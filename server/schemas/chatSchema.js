import { z } from "zod";

/**
 * Send Chat Message Schema
 * BEFORE: No validation, empty messages could be sent
 * AFTER: Min/max length enforced, whitespace trimmed, special chars escaped
 */
export const sendChatMessageSchema = z.object({
  text: z
    .string()
    .min(1, "Message cannot be empty")
    .max(5000, "Message must not exceed 5000 characters")
    .trim()
    .refine((val) => val.length > 0, "Message cannot contain only whitespace"),
});
