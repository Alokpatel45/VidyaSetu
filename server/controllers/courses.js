import { instance } from "../index.js";
import tryCatch from "../middlewares/tryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/lecture.js";
import { Payment } from "../models/payment.js";
import { User } from "../models/user.js";
import crypto from "crypto";

export const getAllCourses = tryCatch(async (req, res) => {
  const courses = await Courses.find();
  res.status(200).json({
    courses,
  });
});

export const getSingleCourse = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  res.status(200).json({
    course,
  });
});

export const getAllLectures = tryCatch(async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.id });
  const user = await User.findById(req.user._id);
  if (user.role == "admin") {
    return res.status(200).json({
      lectures,
    });
  }
  if (!user.subscription.includes(req.params.id)) {
    return res.status(400).json({
      message: "You are not subscribed to this course",
    });
  }
  res.status(200).json({
    lectures,
  });
});
export const fetchLecture = tryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  const user = await User.findById(req.user._id);
  if (user.role == "admin") {
    return res.status(200).json({
      lecture,
    });
  }
  if (!user.subscription.includes(lecture.course)) {
    return res.status(400).json({
      message: "You are not subscribed to this course",
    });
  }
  res.status(200).json({
    lecture,
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

  if (user.subscription.includes(course._id)) {
    return res.status(400).json({
      messege: "you have already have this course",
    });
  }
  const options = {
    amount: Number(course.price * 100),
    currency: "INR",
  };
  const order = await instance.orders.create(options);
  res.status(201).json({
    course,
    order,
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
    user.subscription.push(course._id);
    await user.save();
    res.status(200).json({
      messege: "course purchase successfull",
    });
  } else {
    return res.status(400).json({
      message: "Payement Failed",
    });
  }
});
