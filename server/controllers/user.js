import sendMail from "../middlewares/sendMail.js";
import tryCatch from "../middlewares/tryCatch.js";
import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  clearAuthCookieOptions,
  createAccessToken,
  setAuthCookies,
} from "../utils/authTokens.js";

const buildSafeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  subscription: user.subscription,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const Register = tryCatch(async (req, res) => {
  // BEFORE: Manual validation with custom sanitization functions
  // AFTER: req.body already validated and sanitized by Zod middleware
  const { email, name, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      message: "User already exists",
    });
  }
  const hashPass = await bcrypt.hash(password, 10);

  user = {
    name,
    email,
    password: hashPass,
  };

  const otp = Math.floor(100000 + Math.random() * 900000);

  const activationToken = jwt.sign(
    { user, otp },
    process.env.Activation_Secrete,
    { expiresIn: "5m" }
  );

  await sendMail(email, "VidyaSetu", { name, otp });

  res.status(200).json({
    message: "OTP sent to your email",
    activationToken,
  });
});

export const verifyUser = tryCatch(async (req, res) => {
  // BEFORE: No validation on OTP length or format
  // AFTER: Zod ensures OTP is exactly 6 digits
  const { otp, activationToken } = req.body;

  let verify;
  try {
    verify = jwt.verify(activationToken, process.env.Activation_Secrete);
  } catch (error) {
    return res.status(400).json({
      message: "OTP Expired",
    });
  }

  if (verify.otp != otp) {
    return res.status(400).json({
      message: "Wrong OTP",
    });
  }
  const issuedAt = new Date();
  const user = await User.create({
    name: verify.user.name,
    email: verify.user.email,
    password: verify.user.password,
    refreshTokenIssuedAt: issuedAt,
  });

  const accessToken = createAccessToken(user._id);
  setAuthCookies(res, user._id, issuedAt);
  res.setHeader("x-access-token", accessToken);

  res.status(201).json({
    message: "User registered successfully",
    accessToken,
    user: buildSafeUser(user),
  });
});

export const loginUser = tryCatch(async (req, res) => {
  // BEFORE: No validation, could accept empty or malformed emails
  // AFTER: Zod validates and normalizes email before reaching controller
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
  const pass = await bcrypt.compare(password, user.password);
  if (!pass) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }
  const issuedAt = new Date();
  user.refreshTokenIssuedAt = issuedAt;
  await user.save();
  
  const accessToken = createAccessToken(user._id);
  setAuthCookies(res, user._id, issuedAt);
  res.setHeader("x-access-token", accessToken);
  res.status(200).json({
    message: `Welcome back, ${user.name}`,
    accessToken,
    user: buildSafeUser(user),
  });
});

export const myProfile = tryCatch(async (req, res) => {
  res.json({
    user: buildSafeUser(req.user),
    accessToken: req.accessToken || null,
  });
});

export const logoutUser = tryCatch(async (req, res) => {
  // Clear the refresh token issued timestamp to invalidate all existing tokens
  if (req.user) {
    req.user.refreshTokenIssuedAt = null;
    await req.user.save();
  }
  res.clearCookie("refreshToken", clearAuthCookieOptions());
  res.status(200).json({
    message: "Logged out successfully",
  });
});
