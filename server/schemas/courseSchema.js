import { z } from "zod";

/**
 * Create Course Schema
 * BEFORE: No validation, oversized titles/descriptions accepted
 * AFTER: Length limits, required fields, price validation
 */
export const createCourseSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters")
    .trim(),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description must not exceed 2000 characters")
    .trim(),
  category: z
    .string()
    .min(2, "Category must be at least 2 characters")
    .max(50, "Category must not exceed 50 characters")
    .trim(),
  createdBy: z
    .string()
    .min(2, "Creator name must be at least 2 characters")
    .max(100, "Creator name must not exceed 100 characters")
    .trim(),
  duration: z.coerce
    .number({ invalid_type_error: "Duration must be a valid number" })
    .positive("Duration must be a positive number"),
  price: z.coerce
    .number({ invalid_type_error: "Price must be a valid number" })
    .min(0, "Price must be at least 0"),
});

export const updateCourseSchema = createCourseSchema.partial();

/**
 * Add Lecture Schema
 * BEFORE: No validation on title/description length
 * AFTER: Enforced limits, required fields
 */
export const addLectureSchema = z.object({
  title: z
    .string()
    .min(3, "Lecture title must be at least 3 characters")
    .max(150, "Lecture title must not exceed 150 characters")
    .trim(),
  description: z
    .string()
    .min(5, "Lecture description must be at least 5 characters")
    .max(3000, "Lecture description must not exceed 3000 characters")
    .trim(),
});
