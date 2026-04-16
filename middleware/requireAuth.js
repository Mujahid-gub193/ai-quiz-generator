import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/index.js";

const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authorization token is required.");
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(payload.id);

    if (!user) {
      throw new ApiError(401, "User for this token no longer exists.");
    }

    req.user = user;
    req.user.role = payload.role ?? user.role;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      next(new ApiError(401, "Invalid or expired token."));
      return;
    }

    next(error);
  }
};

export default requireAuth;
