import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { User } from "../models/index.js";
import ApiError from "../utils/apiError.js";

const formatUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const validateAuthPayload = ({ name, email, password }, isRegister = false) => {
  if (isRegister && (!name || name.trim().length < 2)) {
    throw new ApiError(400, "Name must be at least 2 characters long.");
  }

  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new ApiError(400, "A valid email address is required.");
  }

  if (!password || password.length < 6) {
    throw new ApiError(400, "Password must be at least 6 characters long.");
  }
};

const createToken = (user) =>
  jwt.sign({ id: user.id, email: user.email, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  validateAuthPayload({ name, email, password }, true);

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    role: "student",
  });

  res.status(201).json({
    message: "Registration successful.",
    token: createToken(user),
    user: formatUser(user),
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  validateAuthPayload({ email, password });

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.unscoped().findOne({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  res.json({
    message: "Login successful.",
    token: createToken(user),
    user: formatUser(user),
  });
};

export const getMe = async (req, res) => {
  res.json({
    user: formatUser(req.user),
  });
};

export const applyTeacher = async (req, res) => {
  if (req.user.role !== "student") {
    throw new ApiError(400, "Only students can apply to become a teacher.");
  }

  const user = await User.unscoped().findByPk(req.user.id);

  if (user.teacherRequest === "pending") {
    throw new ApiError(400, "You already have a pending teacher application.");
  }

  await user.update({ teacherRequest: "pending" });
  res.json({ message: "Teacher application submitted. An admin will review it." });
};
