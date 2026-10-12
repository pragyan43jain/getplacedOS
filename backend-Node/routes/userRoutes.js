import express from "express"
import {
  authUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  getBehavioralStories,
  saveBehavioralStory,
  deleteBehavioralStory,
  getBehavioralBookmarks,
  toggleBehavioralBookmark,
  getBehavioralPractice,
  recordBehavioralPractice,
} from "../controllers/userController.js"
import { protect } from "../middlewares/authMiddleware.js"
import dotenv from "dotenv"
dotenv.config()

const router = express.Router()

router.post("/", registerUser)
router.post("/register", registerUser)
router.post("/signup", registerUser)
router.post("/auth", authUser)
router.post("/login", authUser)
router.post("/signin", authUser)
router.post("/logout", logoutUser)
router
  .route("/profile")
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile)

router.get("/get" ,(req,res) =>{
  res.send("backend working")
})

router.get("/resume/latest", protect, (req, res) => {
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

// Behavioral STAR Matrix & Practice History Endpoints
router
  .route("/behavioral-stories")
  .get(protect, getBehavioralStories)
  .post(protect, saveBehavioralStory)

router
  .route("/behavioral-stories/:id")
  .delete(protect, deleteBehavioralStory)

router
  .route("/behavioral-bookmarks")
  .get(protect, getBehavioralBookmarks)
  .post(protect, toggleBehavioralBookmark)

router
  .route("/behavioral-practice")
  .get(protect, getBehavioralPractice)
  .post(protect, recordBehavioralPractice)

export default router
