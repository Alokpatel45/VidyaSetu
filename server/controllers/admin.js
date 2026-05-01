import tryCatch from "../middlewares/tryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/lecture.js";
import { rm } from "fs";
import { promisify } from "util";
import fs from "fs";
import { User } from "../models/user.js";
export const createCourse = tryCatch(async (req, res) => {
  const { title, description, category, createdBy, duration, price } = req.body;
  const image = req.file;
  await Courses.create({
    title,
    description,
    category,
    createdBy,
    image: image?.path,
    duration,
    price,
  });
  res.status(201).json({
    message: "Course Created",
  });
});
export const addLecture = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(402).json({
      message: "no such course exist",
    });
  }
  const { title, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "Video file is required",
    });
  }

  const lecture = await Lecture.create({
    title,
    description,
    video: file.path,
    course: course._id,
  });
  res.status(201).json({
    message: "lecture added",
    lecture,
  });
});

export const deleteLecture = tryCatch(async (req, res) => {
  const lecture = await Lecture.findById(req.params.id);
  if (!lecture) {
    return res.status(404).json({
      message: "No such lecture exist",
    });
  }
  rm(lecture.video, () => {
    console.log("video deleted");
  });
  await lecture.deleteOne();
  res.status(200).json({
    message: "lecture deleted",
  });
});

const unlinkAsync = promisify(fs.unlink);

export const deleteCourse = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({
      message: "No such course exist",
    });
  }

  const lectures = await Lecture.find({ course: course._id });
  await Lecture.find({ course: course._id }).deleteMany(); // Pehle DB se hatao

  await Promise.all(
    lectures.map(async (lecture) => {
      try {
        await unlinkAsync(lecture.video);
        console.log(`Deleted video: ${lecture.video}`);
      } catch (error) {
        console.log(
          `Failed to delete video ${lecture.video}: ${error.message}`
        );
      }
    })
  );

  try {
    await unlinkAsync(course.image);
    console.log("Image deleted");
  } catch (error) {
    console.log(`Failed to delete image ${course.image}: ${error.message}`);
  }

  await course.deleteOne();

  await User.updateMany(
    { subscription: req.params.id },
    { $pull: { subscription: req.params.id } }
  );

  res.status(200).json({
    message: "Course deleted",
  });
});

export const allStats = tryCatch(async (req, res) => {
  const totalCourses = (await Courses.find()).length;
  const totalLectures = (await Lecture.find()).length;
  const totalUsers = (await User.find()).length;
  res.status(200).json({
    stats: {
      totalCourses,
      totalLectures,
      totalUsers,
    },
  });
});

export const getAllUser = tryCatch(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } }).select(
    "-password"
  );
  res.json({ users });
});

export const updateRole = tryCatch(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user.role === "user") {
    user.role = "admin";
    await user.save();
    return res.status(200).json({
      message: "role updated to admin",
    });
  }
  if (user.role === "admin") {
    user.role = "user";
    await user.save();
    return res.status(200).json({
      message: "role updated",
    });
  }
});
