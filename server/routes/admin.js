import express from "express";
import { isAdmin, isAuth } from "../middlewares/isAuth.js";
import {
  addLecture,
  allStats,
  createCourse,
  deleteCourse,
  deleteLecture,
  getAllUser,
  updateRole,
  updateCourse,
} from "../controllers/admin.js";
import {
  uploadImage,
  uploadVideo,
  withMulterErrors,
} from "../middlewares/cloudinaryUpload.js";
import { getMyCourses } from "../controllers/courses.js";
import { validate } from "../middlewares/validate.js";
import { createCourseSchema, addLectureSchema, updateCourseSchema } from "../schemas/courseSchema.js";
import { updateRoleSchema } from "../schemas/userSchema.js";

const router = express.Router();

// Multer must run before Zod validate — multipart fields only populate req.body after parse
router.post(
  "/course/new",
  isAuth,
  isAdmin,
  withMulterErrors(uploadImage),
  validate(createCourseSchema),
  createCourse
);

router.put(
  "/course/:id",
  isAuth,
  isAdmin,
  withMulterErrors(uploadImage),
  validate(updateCourseSchema),
  updateCourse
);

router.post(
  "/course/:id",
  isAuth,
  isAdmin,
  withMulterErrors(uploadVideo),
  validate(addLectureSchema),
  addLecture
);

router.get("/stats", isAuth, isAdmin, allStats);

router.get("/mycourses", isAuth, getMyCourses);

router.delete("/course/:id", isAuth, isAdmin, deleteCourse);

router.delete("/lecture/:id", isAuth, isAdmin, deleteLecture);

router.put("/user/:id", isAuth, isAdmin, validate(updateRoleSchema), updateRole);

router.get("/users", isAuth, isAdmin, getAllUser);

export default router;
