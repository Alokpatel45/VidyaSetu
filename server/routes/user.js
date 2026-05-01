import express from "express";

import {
  loginUser,
  myProfile,
  Register,
  verifyUser,
} from "../controllers/user.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/user/register", Register);

router.post("/user/verify", verifyUser);

router.post("/user/login", loginUser);

router.get("/user/me", isAuth, myProfile);

export default router;
