import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcrypt";
import { User } from "../models/user.js";
import { sendPasswordResetMail } from "../services/passwordResetMail.js";
import { clearAuthCookieOptions } from "../utils/authTokens.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const genericMessage = "If an account exists for that email, a password reset link will be sent.";

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return res.status(200).json({ message: genericMessage });
    const token = randomBytes(32).toString("hex");
    const previousHash = user.passwordResetTokenHash;
    const previousExpiry = user.passwordResetExpiresAt;
    user.passwordResetTokenHash = hashToken(token);
    user.passwordResetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();
    const origin = (process.env.FRONTEND_URL || "https://www.vidyasetu.me").replace(/\/$/, "");
    const url = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    try {
      await sendPasswordResetMail(user.email, user.name, url);
    } catch (error) {
      user.passwordResetTokenHash = previousHash;
      user.passwordResetExpiresAt = previousExpiry;
      await user.save();
      return next(error);
    }
    return res.status(200).json({ message: genericMessage });
  } catch (error) { return next(error); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return res.status(400).json({ message: "Reset link is invalid or expired. Please request a new one." });
    user.password = await bcrypt.hash(password, 10);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiresAt = null;
    user.refreshTokenIssuedAt = null;
    await user.save();
    res.clearCookie("refreshToken", clearAuthCookieOptions());
    return res.status(200).json({ message: "Password updated. Please log in with your new password." });
  } catch (error) { return next(error); }
}
