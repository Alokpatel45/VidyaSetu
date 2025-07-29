import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/user.js";
import courseRoute from "./routes/courses.js";
import adminRoute from "./routes/admin.js";
import { connectDB } from "./database/db.js";
import Razorpay from "razorpay";
import cors from "cors";
import aiRoute from "./routes/aiRoutes.js";
import http from "http";
import { Server } from "socket.io"; 
import { router as chatRoutes } from "./routes/chatRoutes.js"; 
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import aiController from "./controllers/aiController.js";
dotenv.config();

export const instance = new Razorpay({
  key_id: process.env.Razorpay_Key,
  key_secret: process.env.Razorpay_Secret,
});

const app = express();
const server = http.createServer(app); 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const io = new Server(server, {
  cors: {
    origin: "https://vidya-setu-frontend-ruddy.vercel.app",
    methods: ["GET", "POST"],
    credentials: true,
  },
});


app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json());
app.use(cors({
  origin: "https://vidya-setu-frontend-ruddy.vercel.app",
  credentials: true,
}));



// Routes
app.use("/api", userRoute);
app.use("/api", courseRoute);
app.use("/api", adminRoute);
app.use("/api/chat", chatRoutes);
app.use("/gemini", aiRoute);

io.on("connection", (socket) => {
  console.log("A user connected to chat");

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const port = process.env.PORT || 5000;
server.listen(port, () => {
  connectDB();
});

