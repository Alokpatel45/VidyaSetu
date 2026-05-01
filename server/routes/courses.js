import express from "express";
import {
  getSingleCourse,
  getAllCourses,
  getAllLectures,
  getMyCourses,
  checkout,
  paymentVerification,
  fetchLecture,
} from "../controllers/courses.js";
import { isAuth } from "../middlewares/isAuth.js";

const router = express.Router();

router.get("/course/all", getAllCourses);
router.get("/course/:id", getSingleCourse);
router.get("/lectures/:id", isAuth, getAllLectures);
router.get("/lecture/:id", isAuth, fetchLecture);
router.get("/mycourse", isAuth, getMyCourses);
router.post("/course/checkout/:id", isAuth, checkout);
router.post("/verification/:id", isAuth, paymentVerification);
export default router;
