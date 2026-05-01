const tryCatch = (handler) => {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      res.status(error.statusCode || 500).json({
        message: error.message || "Something went wrong",
      });
    }
  };
};
export default tryCatch;
