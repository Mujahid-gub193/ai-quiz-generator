import ApiError from "../utils/apiError.js";

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ApiError(403, "Access denied."));
  }
  next();
};

export default requireRole;
