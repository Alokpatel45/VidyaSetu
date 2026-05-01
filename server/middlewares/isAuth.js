import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.token;
    if (!token) {
      return res.status(403).json({
        message: "please login",
      });
    }
    const decodedData = await jwt.verify(token, process.env.JWT_Sec);
    req.user = await User.findById(decodedData._id);
    next();
  } catch (error) {
    res.status(401).json({
      message: "login first",
    });
  }
};

export const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "you are not autherised",
      });
    }
    next();
  } catch (error) {
    res.status(401).json({
      message: error.message,
    });
  }
};
