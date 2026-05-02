import mongoose from "mongoose";

export const connectDB = async () => {
  if (!process.env.DB) {
    throw new Error("Missing DB connection string (DB)");
  }
  await mongoose.connect(process.env.DB);
  console.log("MongoDB connected");
};
