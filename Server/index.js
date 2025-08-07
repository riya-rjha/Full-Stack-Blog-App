import express from "express";
import "dotenv/config";
import postRouter from "./Routes/post.js";
import mongoose from "mongoose";
import authRouter from "./Routes/auth.js";
import userRouter from "./Routes/user.js";
import notificationRouter from "./Routes/notification.js";
import searchRouter from "./Routes/search.js";
import cors from "cors";
import cookieParser from "cookie-parser";

// Create an instance of express
const app = express();

// Use cookie parser to parse cookies from incoming requests
app.use(cookieParser());

// Parse Middleware Requests
app.use(express.json());

// Setup CORS
// "proxy":http//localhost:8000/api -> Enable cors through Client/package.json
app.use(
  cors({
    origin: process.env.frontendURL,
    credentials: true,
    methods: ["POST", "GET", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

// Setting up Blog Routes
app.use("/post", postRouter);

// Setting up User authentication Route
app.use("/auth", authRouter);

// Setting up User management Route
app.use("/user", userRouter);

// Setting up Notification Route
app.use("/notifications", notificationRouter);

// Setting up Search Route
app.use("/search", searchRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ message: "BlogHub API is running!" });
});

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.mongoDBURL);
    // Start Server
    app.listen(process.env.PORT, () => {
      console.log(`App is listening to PORT ${process.env.PORT}`);
    });
    console.log("Successfully connected to database");
  } catch (error) {
    console.log(error.message);
    process.exit(1); // To exit ongoing Node.js process
  }
};

connectToDatabase();
