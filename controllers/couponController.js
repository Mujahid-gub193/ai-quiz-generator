import { Coupon } from "../models/index.js";
import ApiError from "../utils/apiError.js";

export const createCoupon = async (req, res) => {
  const { code, discountPercent, maxUses, expiresAt, courseId } = req.body;
  if (!code || !discountPercent) throw new ApiError(400, "Code and discount required.");
  const coupon = await Coupon.create({
    code: code.toUpperCase(), discountPercent, maxUses: maxUses || null,
    expiresAt: expiresAt || null, courseId: courseId || null, active: true,
  });
  res.status(201).json({ coupon });
};

export const listCoupons = async (req, res) => {
  const coupons = await Coupon.findAll({ order: [["createdAt", "DESC"]] });
  res.json({ coupons });
};

export const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found.");
  await coupon.destroy();
  res.json({ message: "Coupon deleted." });
};

export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findByPk(req.params.id);
  if (!coupon) throw new ApiError(404, "Coupon not found.");
  await coupon.update({ active: !coupon.active });
  res.json({ coupon });
};

export const validateCoupon = async (req, res) => {
  const { code, courseId } = req.body;
  const coupon = await Coupon.findOne({ where: { code: code.toUpperCase(), active: true } });
  if (!coupon) throw new ApiError(400, "Invalid coupon.");
  if (coupon.expiresAt && new Date() > coupon.expiresAt) throw new ApiError(400, "Coupon expired.");
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new ApiError(400, "Coupon limit reached.");
  if (coupon.courseId && coupon.courseId !== Number(courseId)) throw new ApiError(400, "Coupon not valid for this course.");
  res.json({ valid: true, discountPercent: coupon.discountPercent });
};
