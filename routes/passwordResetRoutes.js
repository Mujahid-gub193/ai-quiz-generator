import express from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { forgotPassword, resetPassword } from "../controllers/passwordResetController.js";

const router = express.Router();

router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));

export default router;
