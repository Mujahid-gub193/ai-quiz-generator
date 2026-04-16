import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateQuiz,
  getQuizById,
  listAttempts,
  listQuizzes,
  submitQuiz,
} from "../controllers/quizController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/attempts", asyncHandler(listAttempts));
router.get("/", asyncHandler(listQuizzes));
router.post("/generate", asyncHandler(generateQuiz));
router.get("/:id", asyncHandler(getQuizById));
router.post("/:id/submit", asyncHandler(submitQuiz));

export default router;
