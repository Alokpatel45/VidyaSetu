import express from "express";
import Message from "../models/Message.js";
import { isAuth } from "../middlewares/isAuth.js";

export const router = express.Router();

router.get("/", isAuth, async (req, res) => {
  const messages = await Message.find().sort({ createdAt: 1 }).limit(100);
  res.json(messages);
});

router.post("/", isAuth, async (req, res) => {
  const { text } = req.body;

  const newMessage = new Message({
    userId: req.user._id,
    userName: req.user.name,
    text,
  });

  await newMessage.save();

  req.io.emit("chatMessage", newMessage);

  res.json(newMessage);
});
