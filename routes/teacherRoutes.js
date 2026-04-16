import express from "express";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getStudentResults } from "../controllers/teacherController.js";

const router = express.Router();

router.use(requireAuth, requireRole("teacher", "admin"));

router.get("/results", asyncHandler(getStudentResults));

export default router;
