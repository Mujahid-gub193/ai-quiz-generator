import Stripe from "stripe";
import { env } from "../config/env.js";
import { Chapter, Coupon, Course, Enrollment, Lesson, User } from "../models/index.js";
import ApiError from "../utils/apiError.js";

const stripe = new Stripe(env.stripeSecretKey);

// Check if user is enrolled
export const checkEnrollment = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    where: { userId: req.user.id, courseId: req.params.courseId, status: "active" },
  });
  res.json({ enrolled: !!enrollment });
};

// Get enrolled course with full content
export const getEnrolledCourse = async (req, res) => {
  const enrollment = await Enrollment.findOne({
    where: { userId: req.user.id, courseId: req.params.courseId, status: "active" },
  });
  if (!enrollment) throw new ApiError(403, "You are not enrolled in this course.");

  const course = await Course.findByPk(req.params.courseId, {
    include: [{
      model: Chapter, as: "chapters",
      include: [{ model: Lesson, as: "lessons" }],
    }],
  });
  res.json({ course });
};

// List student's enrolled courses
export const listMyEnrollments = async (req, res) => {
  const enrollments = await Enrollment.findAll({
    where: { userId: req.user.id, status: "active" },
    include: [{
      model: Course, as: "course",
      include: [{ model: User, as: "teacher", attributes: ["id", "name"] }],
    }],
  });
  res.json({ enrollments });
};

// Create Stripe checkout session
export const createCheckoutSession = async (req, res) => {
  const { courseId, couponCode, currency } = req.body;

  const course = await Course.findOne({ where: { id: courseId, published: true } });
  if (!course) throw new ApiError(404, "Course not found.");

  // Check already enrolled
  const existing = await Enrollment.findOne({ where: { userId: req.user.id, courseId, status: "active" } });
  if (existing) throw new ApiError(400, "Already enrolled.");

  // Free course — enroll directly
  if (course.isFree || course.price === 0) {
    await Enrollment.create({ userId: req.user.id, courseId, paidAmount: 0, currency: "USD" });
    return res.json({ enrolled: true, free: true });
  }

  // Apply coupon
  let discountPercent = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({
      where: { code: couponCode.toUpperCase(), active: true },
    });
    if (!coupon) throw new ApiError(400, "Invalid coupon code.");
    if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new ApiError(400, "Coupon expired.");
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new ApiError(400, "Coupon usage limit reached.");
    if (coupon.courseId && coupon.courseId !== Number(courseId)) throw new ApiError(400, "Coupon not valid for this course.");
    discountPercent = coupon.discountPercent;
  }

  const usedCurrency = (currency || course.currency || "USD").toUpperCase();
  let unitAmount = Math.round(course.price * 100); // cents
  if (discountPercent > 0) unitAmount = Math.round(unitAmount * (1 - discountPercent / 100));

  // 100% discount = free
  if (unitAmount <= 0) {
    if (couponCode) {
      await Coupon.increment("usedCount", { where: { code: couponCode.toUpperCase() } });
    }
    await Enrollment.create({ userId: req.user.id, courseId, paidAmount: 0, currency: usedCurrency });
    return res.json({ enrolled: true, free: true });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: usedCurrency.toLowerCase(),
        product_data: { name: course.title, description: course.description?.slice(0, 200) },
        unit_amount: unitAmount,
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${env.appUrl}/courses/${courseId}?success=1`,
    cancel_url: `${env.appUrl}/courses/${courseId}?cancelled=1`,
    metadata: {
      userId: String(req.user.id),
      courseId: String(courseId),
      couponCode: couponCode || "",
      paidAmount: String(unitAmount / 100),
      currency: usedCurrency,
    },
  });

  res.json({ url: session.url });
};

// Stripe webhook — confirm payment
export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret || "");
  } catch {
    // In dev without webhook secret, parse raw body
    try { event = JSON.parse(req.body.toString()); } catch { return res.status(400).send("Bad payload"); }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, courseId, couponCode, paidAmount, currency } = session.metadata;
    const existing = await Enrollment.findOne({ where: { userId, courseId } });
    if (!existing) {
      await Enrollment.create({
        userId: Number(userId), courseId: Number(courseId),
        paidAmount: Number(paidAmount), currency,
        stripeSessionId: session.id, status: "active",
      });
      if (couponCode) {
        await Coupon.increment("usedCount", { where: { code: couponCode } });
      }
    }
  }
  res.json({ received: true });
};

// Manual enrollment confirm (fallback for redirect after payment)
export const confirmEnrollment = async (req, res) => {
  const { sessionId } = req.body;
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") throw new ApiError(400, "Payment not completed.");

  const { userId, courseId, couponCode, paidAmount, currency } = session.metadata;
  if (Number(userId) !== req.user.id) throw new ApiError(403, "Unauthorized.");

  const existing = await Enrollment.findOne({ where: { userId, courseId } });
  if (!existing) {
    await Enrollment.create({
      userId: Number(userId), courseId: Number(courseId),
      paidAmount: Number(paidAmount), currency,
      stripeSessionId: session.id, status: "active",
    });
    if (couponCode) await Coupon.increment("usedCount", { where: { code: couponCode } });
  }
  res.json({ enrolled: true });
};
