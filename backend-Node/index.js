import express from "express"
import dotenv from "dotenv"
import userRoutes from "./routes/userRoutes.js"
import readinessRoutes from "./routes/readinessRoutes.js"
import levelGapRoutes from "./routes/levelGapRoutes.js"
import leetcodeRoutes from "./routes/leetcodeRoutes.js"
import githubRoutes from "./routes/githubRoutes.js"
import dsaRoutes from "./routes/dsaRoutes.js"
import academicRoutes from "./routes/academicRoutes.js"
import recommendationRoutes from "./routes/recommendationRoutes.js"
import progressRoutes from "./routes/progressRoutes.js"
import milestoneRoutes from "./routes/milestoneRoutes.js"
import roadmapRoutes from "./routes/roadmapRoutes.js"
import arenaRoutes from "./routes/arenaRoutes.js"
import coachRoutes from "./routes/coachRoutes.js"
import vtopRoutes from "./routes/vtopRoutes.js"
import jobRoutes from "./routes/jobRoutes.js"
import Job from "./models/jobModel.js"
import { seedJobsIfNeeded, normalizeRapidApiJob } from "./services/jobService.js"

import cookieParser from "cookie-parser"
import cors from "cors"
import { protect } from "./middlewares/authMiddleware.js"
dotenv.config()
const PORT = process.env.PORT || 3000
import axios from "axios"
import connectDB from "./config/db.js"

connectDB().then(() => {
  seedJobsIfNeeded()
})

const app = express()

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://dev-clash-flax.vercel.app",
  "https://dev-clash-hackathon.vercel.app",
  // Vercel deployment URLs — update with your actual domain after first deploy
  "https://getplacedos.vercel.app",
  "https://getplaced.vercel.app",
  // Allow all vercel.app preview deployments
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
]

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        callback(null, true)
      } else {
        callback(null, true)
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
)

app.use(express.json())

app.use(cookieParser())

// Mount Core & Feature Routes
app.use("/api/users", userRoutes)
app.use("/api/readiness", readinessRoutes)
app.use("/api/gap-analysis", levelGapRoutes)
app.use("/api/leetcode", leetcodeRoutes)
app.use("/api/github", githubRoutes)
app.use("/api/dsa", dsaRoutes)

// Group C Feature Routes (#28 - #44)
app.use("/api/academics", academicRoutes)
app.use("/api/recommendations", recommendationRoutes)
app.use("/api/progress", progressRoutes)
app.use("/api/milestones", milestoneRoutes)
app.use("/api/roadmap", roadmapRoutes)
app.use("/api/arena", arenaRoutes)
app.use("/api/coach", coachRoutes)
app.use("/api/vtop", vtopRoutes)
app.use("/api/jobs", jobRoutes)

app.get("/api/resume/latest", protect, (req, res) => {
  res.json({
    success: true,
    name: req.user.name,
    email: req.user.email,
    targetRole: req.user.targetJobRole || "Software Engineer Candidate",
    resumeScore: req.user.resumeScore ?? null,
    resumeText: req.user.resumeText || "",
    resumeAnalysis: req.user.resumeAnalysis || null,
    updatedAt: req.user.updatedAt,
  })
})


import { getJobsList } from "./controllers/jobController.js"

// Canonical jobs endpoints are mounted at /api/jobs and /api/jobs/recommendations
// Legacy alias routes for backwards compatibility
app.get("/job-recommendations", (req, res) => {
  const queryStr = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  res.redirect(307, `/api/jobs${queryStr}`);
});
app.get("/api/job-recommendations", (req, res) => {
  const queryStr = req.url.includes("?") ? req.url.substring(req.url.indexOf("?")) : "";
  res.redirect(307, `/api/jobs${queryStr}`);
});

// Error Handler Middleware (ensures JSON errors for registration and auth)
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

app.listen(PORT, () => {
  console.log("Server listening on port: " + PORT)
})
