/**
 * Validation middleware for Zod schemas
 * Validates req.body against provided schema
 * Replaces req.body with sanitized data
 * Returns consistent error response format
 */

/** Multipart parsers sometimes repeat keys as `[value]`; Zod `.string()` would fail */
const unwrapMultipartArrays = (body) => {
  if (!body || typeof body !== "object" || Buffer.isBuffer(body)) {
    return body;
  }
  const out = { ...body };
  for (const key of Object.keys(out)) {
    const v = out[key];
    if (Array.isArray(v) && v.length > 0) {
      out[key] = v[0];
    }
  }
  return out;
};

export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(unwrapMultipartArrays(req.body));
      req.body = validated;
      next();
    } catch (error) {
      if (error.name === "ZodError") {
        const errorMessages = error.errors.map((err) => err.message);
        const detailedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        return res.status(400).json({
          message: errorMessages[0] || "Validation failed",
          errors: detailedErrors,
        });
      }
      return res.status(400).json({
        message: "Invalid request body",
      });
    }
  };
};

export default validate;
