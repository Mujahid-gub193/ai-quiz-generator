import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getMe, login, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(getMe));

export default router;
