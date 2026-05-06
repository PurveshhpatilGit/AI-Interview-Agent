import express from "express";
import {
  createSession,
  deleteSession,
  endSession,
  getSessionById,
  getSessions,
  submitAnswer,
} from "../controllers/sessionController.js";

import { protect, admin } from "../middleware/authMiddleware.js";
import { uploadSingleAudio } from "../middleware/uploadMiddleware.js";
import Session from "../models/SessionModel.js";

const router = express.Router();

// Apply auth to all
router.use(protect);

// ================= USER ROUTES =================

// Normal user routes
router.route("/").get(getSessions).post(createSession);

router.route("/:id").get(getSessionById).delete(deleteSession);

router.route("/:id/submit-answer").post(uploadSingleAudio, submitAnswer);
router.route("/:id/end").post(endSession);

// ================= ADMIN ROUTES =================

// Get ALL sessions (not only current user)
router.get("/admin/all", admin, async (req, res) => {
  const sessions = await Session.find()
    .populate("user", "name email")
    .sort({ createdAt: -1 });

  res.json(sessions);
});

// Delete ANY session (admin power)
router.delete("/admin/:id", admin, async (req, res) => {
  const session = await Session.findById(req.params.id);

  if (!session) {
    res.status(404);
    throw new Error("Session not found");
  }

  await session.deleteOne();

  res.json({ message: "Session deleted by admin" });
});

export default router;
