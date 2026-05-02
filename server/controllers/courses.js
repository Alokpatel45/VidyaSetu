import tryCatch from "../middlewares/tryCatch.js";
import { getRazorpay } from "../config/razorpay.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/lecture.js";
import { Payment } from "../models/payment.js";
import { User } from "../models/user.js";
import crypto from "crypto";

const isSubscribed = (user, courseId) =>
  Array.isArray(user.subscription) &&
  user.subscription.some((id) => String(id) === String(courseId));

export const getAllCourses = tryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.status(200).json({
    courses,
  });
});

export const getSingleCourse = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }
  res.status(200).json({
    course,
  });
});

export const getAllLectures = tryCatch(async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.id });
  const user = await User.findById(req.user._id);

  if (user.role === "admin" || isSubscribed(user, req.params.id)) {
    return res.status(200).json({ lectures });
  }

  return res.status(403).json({
    message: "You are not subscribed to this course",
  });
});

export const fetchLecture = tryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({ message: "Lecture not found" });
  }

  const user = await User.findById(req.user._id);

  if (user.role === "admin" || isSubscribed(user, lecture.course)) {
    return res.status(200).json({ lecture });
  }

  return res.status(403).json({
    message: "You are not subscribed to this course",
  });
});

export const getMyCourses = tryCatch(async (req, res) => {
  const courses = await Courses.find({ _id: req.user.subscription });
  res.status(200).json({
    courses: courses,
  });
});

export const checkout = tryCatch(async (req, res) => {
  const user = await User.findById(req.user._id);
  const course = await Courses.findById(req.params.id);

  if (!course) {
    return res.status(404).json({ message: "Course not found" });
  }

  if (isSubscribed(user, course._id)) {
    return res.status(400).json({
      message: "You already own this course",
    });
  }
  const options = {
    amount: Number(course.price * 100),
    currency: "INR",
  };
  let order;
  try {
    order = await getRazorpay().orders.create(options);
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return res.status(502).json({
      message: "Failed to create payment order. Please check Razorpay API keys.",
      error: error.description || error.message
    });
  }

  res.status(201).json({
    course,
    order,
    key: process.env.Razorpay_Key,
  });
});

export const paymentVerification = tryCatch(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.Razorpay_Secret)
    .update(body)
    .digest("hex");
  const isAuthentic = expectedSignature === razorpay_signature;
  if (isAuthentic) {
    await Payment.create({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    const user = await User.findById(req.user._id);
    const course = await Courses.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    if (isSubscribed(user, course._id)) {
      return res.status(200).json({
        message: "Course already activated",
      });
    }
    user.subscription.push(course._id);
    await user.save();
    res.status(200).json({
      message: "Course purchased successfully",
    });
  } else {
    return res.status(400).json({
      message: "Payment failed",
    });
  }
});
