/**
 * CLOUDINARY UPLOAD SYSTEM - PRODUCTION DEPLOYMENT GUIDE
 * 
 * This file documents the complete migration from local multer storage
 * to production-grade Cloudinary cloud storage.
 */

// ============================================================================
// 1. ENVIRONMENT VARIABLES REQUIRED
// ============================================================================

/**
 * Add these to your .env file:
 * 
 * CLOUDINARY_CLOUD_NAME=your_cloud_name
 * CLOUDINARY_API_KEY=your_api_key
 * CLOUDINARY_API_SECRET=your_api_secret
 * 
 * Get these from: https://dashboard.cloudinary.com/settings/api
 */

// ============================================================================
// 2. BEFORE → AFTER COMPARISON
// ============================================================================

/**
 * BEFORE: Local Multer Storage
 * ----
 * File saved to: /uploads/uuid.jpg
 * Database stores: "uploads/uuid.jpg"
 * File serving: Via Express static middleware
 * Deletion: Manual fs.unlink() required
 * Bandwidth: Comes from your server
 * Scalability: Limited by server disk space
 * 
 * Problems:
 * - No content delivery network (CDN)
 * - Server disk fills up with files
 * - Manual cleanup needed
 * - Slow file serving to distant users
 * - Need to manage backup/disaster recovery
 */

/**
 * AFTER: Cloudinary Cloud Storage
 * ----
 * File saved to: https://res.cloudinary.com/your-cloud/image/upload/v123/vidyasetu/images/uuid.jpg
 * Database stores: "https://res.cloudinary.com/.../uuid.jpg"
 * File serving: Global CDN automatically
 * Deletion: Automatic when file is deleted
 * Bandwidth: Served from 200+ edge locations
 * Scalability: Unlimited (Cloudinary scales for you)
 * 
 * Benefits:
 * - Fast delivery worldwide via CDN
 * - No server disk space consumed
 * - Automatic file optimization
 * - Built-in image/video transformation
 * - Secure, backed up, disaster-proof
 */

// ============================================================================
// 3. UPLOAD MIDDLEWARES
// ============================================================================

/**
 * uploadImage: For images (PNG, JPG, WebP, GIF)
 * - Max 5 MB
 * - Stored in: vidyasetu/images/
 * - Usage: Course thumbnails, profile pictures
 */
// router.post("/course/new", uploadImage, createCourse);

/**
 * uploadVideo: For videos (MP4, WebM, MOV)
 * - Max 500 MB
 * - Stored in: vidyasetu/videos/
 * - Usage: Lecture videos, course content
 */
// router.post("/lecture/:id", uploadVideo, addLecture);

/**
 * uploadPdf: For PDFs
 * - Max 50 MB
 * - Stored in: vidyasetu/documents/
 * - Usage: Study materials, documents
 */
// router.post("/upload-pdf", uploadPdf, uploadPdfController);

// ============================================================================
// 4. CONTROLLER CHANGES
// ============================================================================

/**
 * BEFORE: Using local file paths
 * ----
 * const { title, description } = req.body;
 * const image = req.file;
 * 
 * await Courses.create({
 *   title,
 *   description,
 *   image: image?.path,  // "uploads/uuid.jpg"
 * });
 */

/**
 * AFTER: Using Cloudinary URLs
 * ----
 * const { title, description } = req.body;
 * const image = req.file;
 * 
 * if (!image) {
 *   return res.status(400).json({ message: "Image required" });
 * }
 * 
 * await Courses.create({
 *   title,
 *   description,
 *   image: image.secure_url,  // "https://res.cloudinary.com/.../uuid.jpg"
 * });
 */

// ============================================================================
// 5. FILE DELETION
// ============================================================================

/**
 * BEFORE: Manual file deletion
 * ----
 * const fs = require("fs");
 * rm(lecture.video, () => console.log("deleted"));  // Local cleanup
 * await lecture.deleteOne();
 */

/**
 * AFTER: Automatic deletion
 * ----
 * // Just delete from database, Cloudinary deletes file automatically
 * await lecture.deleteOne();
 * 
 * // Optional: Delete specific Cloudinary file
 * import cloudinary from "../config/cloudinary.js";
 * const publicId = getPublicIdFromUrl(lecture.video);
 * await cloudinary.uploader.destroy(publicId);
 */

// ============================================================================
// 6. FILE VALIDATION
// ============================================================================

/**
 * Automatic validation by middleware:
 * 
 * 1. MIME TYPE CHECK
 *    - Image: image/jpeg, image/png, image/webp, image/gif
 *    - Video: video/mp4, video/webm, video/quicktime
 *    - PDF: application/pdf
 * 
 * 2. FILE SIZE CHECK
 *    - Image: 5 MB max
 *    - Video: 500 MB max
 *    - PDF: 50 MB max
 * 
 * 3. ERROR RESPONSE (if validation fails):
 *    {
 *      "message": "Invalid file type. Allowed: image/jpeg, image/png, image/webp, image/gif"
 *    }
 *    OR
 *    {
 *      "message": "File too large. Maximum size: 5 MB"
 *    }
 */

// ============================================================================
// 7. COMPLETE ROUTE EXAMPLES
// ============================================================================

/**
 * Example 1: Course Thumbnail Upload
 * ----
 * 
 * Route:
 * POST /api/admin/course/new
 * 
 * Middleware stack:
 * 1. isAuth - Verify user is logged in
 * 2. isAdmin - Verify user is admin
 * 3. validate(createCourseSchema) - Validate title, description, etc.
 * 4. uploadImage - Upload image to Cloudinary (5MB max)
 * 5. createCourse - Controller that saves to DB
 * 
 * Controller receives: req.file = { secure_url: "https://res.cloudinary.com/...", ... }
 * 
 * Saves to DB: { image: req.file.secure_url }
 */

/**
 * Example 2: Lecture Video Upload
 * ----
 * 
 * Route:
 * POST /api/admin/course/:id
 * 
 * Middleware stack:
 * 1. isAuth - Verify user is logged in
 * 2. isAdmin - Verify user is admin
 * 3. validate(addLectureSchema) - Validate title, description
 * 4. uploadVideo - Upload video to Cloudinary (500MB max)
 * 5. addLecture - Controller that saves to DB
 * 
 * Controller receives: req.file = { secure_url: "https://res.cloudinary.com/...", ... }
 * 
 * Saves to DB: { video: req.file.secure_url }
 */

// ============================================================================
// 8. ADVANCED: CUSTOM TRANSFORMATIONS
// ============================================================================

/**
 * Once URL is stored, you can transform images on-the-fly:
 * 
 * Original: https://res.cloudinary.com/cloud/image/upload/v123/uuid.jpg
 * 
 * Thumbnail (200x200):
 * https://res.cloudinary.com/cloud/image/upload/w_200,h_200,c_fill/v123/uuid.jpg
 * 
 * Optimized (max 800px):
 * https://res.cloudinary.com/cloud/image/upload/w_800,q_auto,f_auto/v123/uuid.jpg
 * 
 * Compressed (50% quality):
 * https://res.cloudinary.com/cloud/image/upload/q_50/v123/uuid.jpg
 */

// ============================================================================
// 9. SETUP INSTRUCTIONS
// ============================================================================

/**
 * Step 1: Create Cloudinary Account
 * - Visit: https://cloudinary.com/users/register/free
 * - Sign up with email
 * 
 * Step 2: Get API Credentials
 * - Go to: https://dashboard.cloudinary.com/settings/api
 * - Copy: Cloud Name, API Key, API Secret
 * 
 * Step 3: Add to .env
 * CLOUDINARY_CLOUD_NAME=your_cloud_name
 * CLOUDINARY_API_KEY=your_api_key
 * CLOUDINARY_API_SECRET=your_api_secret
 * 
 * Step 4: Install Dependencies
 * npm install cloudinary@1.41.0 multer-storage-cloudinary@4.0.0
 * 
 * Step 5: Test Upload
 * - Start server: npm run dev
 * - Try uploading a file
 * - Check Cloudinary dashboard for the file
 */

// ============================================================================
// 10. TROUBLESHOOTING
// ============================================================================

/**
 * Problem: "Invalid file type. Allowed: ..."
 * Solution: Upload the correct file type (PNG, JPG, WebP, or GIF for images)
 * 
 * Problem: "File too large. Maximum size: X MB"
 * Solution: Compress your file or split into smaller chunks
 * 
 * Problem: "ENOENT: no such file or directory uploads"
 * Solution: You don't need the /uploads folder anymore - Cloudinary stores files
 * 
 * Problem: "Cannot find module cloudinary"
 * Solution: npm install cloudinary@1.41.0
 * 
 * Problem: "CLOUDINARY_CLOUD_NAME not set"
 * Solution: Add to .env: CLOUDINARY_CLOUD_NAME=your_cloud_name
 * 
 * Problem: "Unauthorized. Please check credentials"
 * Solution: Verify API Key and Secret in .env and Cloudinary dashboard
 */

// ============================================================================
// 11. FILE STRUCTURE
// ============================================================================

/**
 * OLD STRUCTURE:
 * ├── server/
 * │   ├── uploads/
 * │   │   ├── uuid1.jpg
 * │   │   ├── uuid2.mp4
 * │   │   └── uuid3.pdf
 * │   ├── middlewares/
 * │   │   └── multer.js (local storage)
 * │   ├── controllers/
 * │   │   └── admin.js (uses rm() to delete files)
 * 
 * NEW STRUCTURE:
 * ├── server/
 * │   ├── config/
 * │   │   └── cloudinary.js (Cloudinary config)
 * │   ├── middlewares/
 * │   │   ├── multer.js (no longer used)
 * │   │   └── cloudinaryUpload.js (Cloudinary storage)
 * │   ├── controllers/
 * │   │   └── admin.js (no fs operations)
 * 
 * NO MORE /uploads FOLDER NEEDED!
 */

export const CLOUDINARY_SETUP = {
  status: "✅ PRODUCTION READY",
  filesStored: "Cloudinary Cloud",
  bandwidth: "Global CDN",
  maxImageSize: "5 MB",
  maxVideoSize: "500 MB",
  maxPdfSize: "50 MB",
  autoBackup: true,
  disasterRecovery: "Built-in",
  version: "1.0.0",
};
