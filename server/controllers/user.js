import sendMail from "../middlewares/sendMail.js";
import tryCatch from "../middlewares/tryCatch.js";
import { User } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const Register = tryCatch(async (req, res) => {
  const { email, name, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.status(400).json({
      message: "User already exists",
    });
  }
  let hashPass = await bcrypt.hash(password, 10);

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
  await User.create({
    name: verify.user.name,
    email: verify.user.email,
    password: verify.user.password,
  });

  res.json({
    message: "User registered successfully",
  });
});

export const loginUser = tryCatch(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(402).json({
      message: "invalid email",
    });
  }
  const pass = await bcrypt.compare(password, user.password);
  if (!pass) {
    return res.status(401).json({
      message: "invalid password",
    });
  }
  const token = await jwt.sign({ _id: user._id }, process.env.JWT_Sec, {
    expiresIn: "15d",
  });
  res.json({
    message: `Welcome back,${user.name}`,
    token,
    user,
  });
});

export const myProfile = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ user });
});
