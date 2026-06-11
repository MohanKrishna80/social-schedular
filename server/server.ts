import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRouter from "./Routes/authRoutes.js";
import socialAuthRouter from "./Routes/socialAuthRoutes.js";
import accountRouter from "./Routes/accountRoutes.js";
import postRouter from "./Routes/postRoutes.js";
import activityRouter from "./Routes/activityRoutes.js";
import { initScheduler } from "./services/schedulerService.js";
import contentRouter from "./Routes/contentRoute.js";

const app = express();

// database connection
await connectDB();

// Middleware
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get("/", (_req: Request, res: Response) => {
  res.send("Server is Live!");
});

app.use("/api/auth", authRouter);
app.use("/api/oauth",socialAuthRouter)
app.use("/api/accounts",accountRouter)
app.use("/api/posts",postRouter)
app.use("/api/activity",activityRouter)
app.use("/api/content",contentRouter)


//initialize scheduler

initScheduler()

//Global error handler

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.log(err);
  res.status(500).send(err?.response?.data?.message || err?.message);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
