import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB);
    console.log("hi");
  } catch (error) {
    console.log(error);
  }
};
