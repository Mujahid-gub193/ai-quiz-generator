import express from "express";

import requireAuth from "../middleware/requireAuth.js";

const router = express.Router();

router.get("/protected", requireAuth, (req, res) => {
  res.json({
    message: "Protected route accessed successfully.",
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
    },
  });
});

export default router;
