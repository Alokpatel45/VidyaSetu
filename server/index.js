import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/user.js";
import courseRoute from "./routes/courses.js";
import adminRoute from "./routes/admin.js";
import { connectDB } from "./database/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import aiRoute from "./routes/aiRoutes.js";
import http from "http";
import { Server } from "socket.io";
import { router as chatRoutes } from "./routes/chatRoutes.js";
import path from "path";
import { fileURLToPath } from "url";
import { verifyAccessToken } from "./utils/authTokens.js";

dotenv.config();

const defaultOrigins = [
  "https://www.vidyasetu.me",
  "https://vidya-setu-frontend-ui-git-main-alok-patels-projects-a7d43281.vercel.app",
  "https://vidya-setu-frontend-e1qqbaosg-alok-patels-projects-a7d43281.vercel.app",
];

const allowedOrigins = [
  ...(process.env.FRONTEND_URLS
    ? process.env.FRONTEND_URLS.split(",").map((origin) => origin.trim()).filter(Boolean)
    : []),
  process.env.FRONTEND_URL,
  ...defaultOrigins,
].filter(Boolean);

const corsOrigin = (origin, callback) => {
  if (!origin || allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  return callback(new Error(`CORS blocked for origin: ${origin}`));
};

const app = express();
const server = http.createServer(app);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("trust proxy", 1);

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Unauthorized"));
    }

    const decoded = verifyAccessToken(token);
    socket.userId = decoded._id;
    return next();
  } catch (error) {
    return next(new Error("Unauthorized"));
  }
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    exposedHeaders: ["x-access-token"],
  })
);

// Routes
app.use("/api", userRoute);
app.use("/api", courseRoute);
app.use("/api", adminRoute);
app.use("/api/chat", chatRoutes);
app.use("/gemini", aiRoute);

io.on("connection", (socket) => {
  console.log("A user connected to chat", socket.userId);

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start server
const port = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.once("error", (error) => {
      console.error("Server failed to start:", error);
      process.exit(1);
    });
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

