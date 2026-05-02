import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

/**
 * File type validators and size limits
 * Each upload type has specific allowed MIME types and max file size
 */

const UPLOAD_CONFIGS = {
  image: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    maxSize: 5 * 1024 * 1024, // 5 MB
    folder: "vidyasetu/images",
    resourceType: "image",
  },
  video: {
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
    maxSize: 500 * 1024 * 1024, // 500 MB
    folder: "vidyasetu/videos",
    resourceType: "video",
  },
  pdf: {
    mimeTypes: ["application/pdf"],
    maxSize: 50 * 1024 * 1024, // 50 MB
    folder: "vidyasetu/documents",
    resourceType: "raw",
  },
};

/**
 * File validation middleware
 * Checks file type and size before upload
 */
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const config = UPLOAD_CONFIGS[allowedTypes];

    if (!config) {
      return cb(new Error(`Unknown upload type: ${allowedTypes}`));
    }

    if (!config.mimeTypes.includes(file.mimetype)) {
      return cb(
        new Error(
          `Invalid file type. Allowed: ${config.mimeTypes.join(", ")}`
        )
      );
    }

    cb(null, true);
  };
};

/**
 * File size validator middleware
 * Ensures file doesn't exceed size limit
 */
const fileSizeValidator = (allowedTypes) => {
  return (req, res, next) => {
    const config = UPLOAD_CONFIGS[allowedTypes];
    const fileSize = req.headers["content-length"];

    if (fileSize && parseInt(fileSize) > config.maxSize) {
      return res.status(413).json({
        message: `File too large. Maximum size: ${config.maxSize / (1024 * 1024)} MB`,
      });
    }

    next();
  };
};

/**
 * Create Cloudinary storage configuration
 * @param {string} uploadType - 'image', 'video', or 'pdf'
 * @returns {CloudinaryStorage} configured storage instance
 */
const createCloudinaryStorage = (uploadType) => {
  const config = UPLOAD_CONFIGS[uploadType];

  const publicId = async () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}-${random}`;
  };

  const baseParams = {
    folder: config.folder,
    resource_type: config.resourceType,
    public_id: publicId,
  };

  // Video: never set `format` here — that is an *incoming* transform and fails for large
  // files (Cloudinary: "Video is too large to process synchronously… eager_async=true").
  // Store the original; optional eager MP4 is generated in the background for delivery.
  if (uploadType === "video") {
    return new CloudinaryStorage({
      cloudinary,
      params: {
        ...baseParams,
        eager_async: true,
        eager: [{ format: "mp4", video_codec: "h264", audio_codec: "aac" }],
      },
    });
  }

  return new CloudinaryStorage({
    cloudinary,
    params: {
      ...baseParams,
      format: async (req, file) => file.mimetype.split("/")[1],
    },
  });
};

/**
 * BEFORE: router.post("/course/new", isAuth, isAdmin, uploadFiles, createCourse);
 * - Uses local disk storage
 * - No file type validation
 * - File paths stored in DB
 * - Manual cleanup needed
 */

/**
 * AFTER: router.post("/course/new", isAuth, isAdmin, uploadImage, createCourse);
 * - Uses Cloudinary storage
 * - Validates file type (image/jpeg, png, webp, gif)
 * - Checks file size (max 5MB)
 * - Only URL stored in DB
 * - Automatic cleanup via Cloudinary
 */

/**
 * Image upload middleware (5MB max)
 * Used for: course thumbnails, profile pictures, etc.
 */
export const uploadImage = multer({
  storage: createCloudinaryStorage("image"),
  fileFilter: fileFilter("image"),
  limits: { fileSize: UPLOAD_CONFIGS.image.maxSize },
}).single("file");

/**
 * Video upload middleware (500MB max)
 * Used for: lecture videos, course content, etc.
 */
export const uploadVideo = multer({
  storage: createCloudinaryStorage("video"),
  fileFilter: fileFilter("video"),
  limits: { fileSize: UPLOAD_CONFIGS.video.maxSize },
}).single("file");

/**
 * PDF upload middleware (50MB max)
 * Used for: study materials, documents, etc.
 */
export const uploadPdf = multer({
  storage: createCloudinaryStorage("pdf"),
  fileFilter: fileFilter("pdf"),
  limits: { fileSize: UPLOAD_CONFIGS.pdf.maxSize },
}).single("file");

/** Converts multer/async upload failures into JSON so clients don't see bare Express 500s */
export function withMulterErrors(multerMiddleware) {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (!err) {
        return next();
      }
      console.error("[upload]", err.message || err);
      const msg = err.message || "File upload failed";
      const lower = msg.toLowerCase();
      const clientError =
        err.name === "MulterError" ||
        lower.includes("invalid") ||
        lower.includes("file") ||
        err.http_code === 400;
      return res.status(clientError ? 400 : 502).json({
        message: clientError
          ? msg
          : `${msg}. If this persists, verify CLOUDINARY_* env vars and network access.`,
      });
    });
  };
}

/**
 * Generic upload with validation
 * Validates file size before upload processing
 */
export const withFileSizeValidation = (uploadType) => {
  return fileSizeValidator(uploadType);
};
