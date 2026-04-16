import crypto from "crypto";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import { env } from "../config/env.js";
import { PasswordResetToken, User } from "../models/index.js";
import ApiError from "../utils/apiError.js";

const getResend = () => new Resend(env.resendApiKey || "placeholder");

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required.");

  const user = await User.unscoped().findOne({ where: { email: email.trim().toLowerCase() } });

  // Always respond the same to prevent email enumeration
  if (!user) {
    return res.json({ message: "If that email exists, a reset link has been sent." });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await PasswordResetToken.create({ token, expiresAt, userId: user.id });

  const resetUrl = `${env.appUrl}/reset-password?token=${token}`;

  await getResend().emails.send({
    from: env.resendFrom,
    to: user.email,
    subject: "Reset your password — QuizPortal",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Password Reset</h2>
        <p>Hi ${user.name},</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#667eea;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="margin-top:24px;color:#999;font-size:13px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });

  res.json({ message: "If that email exists, a reset link has been sent." });
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError(400, "Token and password are required.");
  if (password.length < 6) throw new ApiError(400, "Password must be at least 6 characters.");

  const record = await PasswordResetToken.findOne({ where: { token, used: false } });

  if (!record || new Date() > record.expiresAt) {
    throw new ApiError(400, "Reset link is invalid or has expired.");
  }

  const hashed = await bcrypt.hash(password, 10);
  await User.unscoped().update({ password: hashed }, { where: { id: record.userId } });
  await record.update({ used: true });

  res.json({ message: "Password reset successfully. You can now log in." });
};
