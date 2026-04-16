import express from "express";
import multer from "multer";
import requireAuth from "../middleware/requireAuth.js";
import requireRole from "../middleware/requireRole.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  createMaterial, deleteMaterial, getMaterialById,
  listMaterials, updateMaterial,
} from "../controllers/materialController.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf", "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and video files are allowed."));
    }
  },
});

router.use(requireAuth);

router.route("/")
  .get(asyncHandler(listMaterials))
  .post(requireRole("teacher", "admin"), upload.single("file"), asyncHandler(createMaterial));

router.route("/:id")
  .get(asyncHandler(getMaterialById))
  .patch(requireRole("teacher", "admin"), asyncHandler(updateMaterial))
  .delete(requireRole("teacher", "admin"), asyncHandler(deleteMaterial));

export default router;
