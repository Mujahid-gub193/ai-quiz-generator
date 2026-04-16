import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getSiteStats, listUsers, updateUserRole, listAllQuizzes, listAllAttempts, listAllMaterials, deleteAnyMaterial, deleteAnyQuiz } from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.get("/users", asyncHandler(listUsers));
router.patch("/users/:id/role", asyncHandler(updateUserRole));
router.get("/stats", asyncHandler(getSiteStats));
router.get("/quizzes", asyncHandler(listAllQuizzes));
router.delete("/quizzes/:id", asyncHandler(deleteAnyQuiz));
router.get("/attempts", asyncHandler(listAllAttempts));
router.get("/materials", asyncHandler(listAllMaterials));
router.delete("/materials/:id", asyncHandler(deleteAnyMaterial));

export default router;
