import express from "express";
import multer from "multer";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  listCourses, getCourse, listMyCourses, createCourse, updateCourse, deleteCourse,
  addChapter, deleteChapter, addLesson, deleteLesson,
  adminListCourses, adminDeleteCourse, adminTogglePublish,
} from "../controllers/courseController.js";
import {
  checkEnrollment, getEnrolledCourse, listMyEnrollments,
  createCheckoutSession, stripeWebhook, confirmEnrollment,
} from "../controllers/enrollmentController.js";
import {
  toggleLessonProgress, getCourseProgress, getCompletedLessons,
  getCourseStudents, removeEnrollment, unenroll, adminListEnrollments,
} from "../controllers/progressController.js";
import { createCoupon, listCoupons, deleteCoupon, toggleCoupon, validateCoupon } from "../controllers/couponController.js";
import { detectCurrency } from "../controllers/currencyController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

// Public
router.get("/courses", asyncHandler(listCourses));
router.get("/courses/:id", asyncHandler(getCourse));
router.get("/currency", asyncHandler(detectCurrency));

// Stripe webhook (raw body)
router.post("/webhook/stripe", express.raw({ type: "application/json" }), asyncHandler(stripeWebhook));

// Coupon validation (public with auth)
router.post("/coupons/validate", requireAuth, asyncHandler(validateCoupon));

// Student
router.get("/enrollments/my", requireAuth, asyncHandler(listMyEnrollments));
router.get("/enrollments/check/:courseId", requireAuth, asyncHandler(checkEnrollment));
router.get("/enrollments/course/:courseId", requireAuth, asyncHandler(getEnrolledCourse));
router.post("/enrollments/checkout", requireAuth, asyncHandler(createCheckoutSession));
router.post("/enrollments/confirm", requireAuth, asyncHandler(confirmEnrollment));
router.delete("/enrollments/unenroll/:courseId", requireAuth, asyncHandler(unenroll));

// Progress
router.post("/progress/lesson/:lessonId", requireAuth, asyncHandler(toggleLessonProgress));
router.get("/progress/course/:courseId", requireAuth, asyncHandler(getCourseProgress));
router.get("/progress/completed/:courseId", requireAuth, asyncHandler(getCompletedLessons));

// Teacher
router.get("/teacher/courses/:courseId/students", requireAuth, requireRole("teacher", "admin"), asyncHandler(getCourseStudents));
router.delete("/teacher/enrollments/:enrollmentId", requireAuth, requireRole("teacher", "admin"), asyncHandler(removeEnrollment));

// Teacher
router.get("/teacher/courses", requireAuth, requireRole("teacher", "admin"), asyncHandler(listMyCourses));
router.post("/teacher/courses", requireAuth, requireRole("teacher", "admin"), upload.single("thumbnail"), asyncHandler(createCourse));
router.patch("/teacher/courses/:id", requireAuth, requireRole("teacher", "admin"), upload.single("thumbnail"), asyncHandler(updateCourse));
router.delete("/teacher/courses/:id", requireAuth, requireRole("teacher", "admin"), asyncHandler(deleteCourse));
router.post("/teacher/courses/:courseId/chapters", requireAuth, requireRole("teacher", "admin"), asyncHandler(addChapter));
router.delete("/teacher/chapters/:chapterId", requireAuth, requireRole("teacher", "admin"), asyncHandler(deleteChapter));
router.post("/teacher/chapters/:chapterId/lessons", requireAuth, requireRole("teacher", "admin"), upload.single("file"), asyncHandler(addLesson));
router.delete("/teacher/lessons/:lessonId", requireAuth, requireRole("teacher", "admin"), asyncHandler(deleteLesson));

// Admin
router.get("/admin/courses", requireAuth, requireRole("admin"), asyncHandler(adminListCourses));
router.delete("/admin/courses/:id", requireAuth, requireRole("admin"), asyncHandler(adminDeleteCourse));
router.patch("/admin/courses/:id/publish", requireAuth, requireRole("admin"), asyncHandler(adminTogglePublish));
router.get("/admin/enrollments", requireAuth, requireRole("admin"), asyncHandler(adminListEnrollments));
router.delete("/admin/enrollments/:enrollmentId", requireAuth, requireRole("admin"), asyncHandler(removeEnrollment));
router.get("/admin/coupons", requireAuth, requireRole("admin"), asyncHandler(listCoupons));
router.post("/admin/coupons", requireAuth, requireRole("admin"), asyncHandler(createCoupon));
router.delete("/admin/coupons/:id", requireAuth, requireRole("admin"), asyncHandler(deleteCoupon));
router.patch("/admin/coupons/:id/toggle", requireAuth, requireRole("admin"), asyncHandler(toggleCoupon));

export default router;
