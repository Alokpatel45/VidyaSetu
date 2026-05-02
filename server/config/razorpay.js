import Razorpay from "razorpay";

let razorpayInstance;

export const getRazorpay = () => {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.Razorpay_Key,
      key_secret: process.env.Razorpay_Secret,
    });
  }
  return razorpayInstance;
};
