import express from "express";
import rateLimit from "express-rate-limit";

import {
  loginUser,
  logoutUser,
  myProfile,
  Register,
  verifyUser,
} from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";
import { validate } from "../middlewares/validate.js";
import {
  registerSchema,
  loginSchema,
  verifySchema,
  updateRoleSchema,
} from "../schemas/userSchema.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    message: "Too many auth attempts, please try again later.",
  },
});

const router = express.Router();

// BEFORE: router.post("/user/register", authLimiter, Register);
// AFTER: Added validation middleware that sanitizes and validates input
router.post("/user/register", authLimiter, validate(registerSchema), Register);

router.post("/user/verify", authLimiter, validate(verifySchema), verifyUser);

router.post("/user/login", authLimiter, validate(loginSchema), loginUser);

router.get("/user/me", isAuth, myProfile);

router.post("/user/logout", isAuth, logoutUser);

export default router;
