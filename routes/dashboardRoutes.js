import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getDashboardOverview } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/overview", requireAuth, asyncHandler(getDashboardOverview));

export default router;
