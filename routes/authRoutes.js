import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getMe, login, register, applyTeacher } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(getMe));
router.post("/apply-teacher", requireAuth, asyncHandler(applyTeacher));

export default router;
