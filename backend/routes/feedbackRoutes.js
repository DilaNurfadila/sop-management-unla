const express = require("express");
const router = express.Router();
const feedbackController = require("../controllers/feedbackController");
const { authenticate } = require("../middlewares/authMiddleware");

// Public routes (tidak perlu autentikasi)
router.post("/", feedbackController.createFeedback);
router.get("/sop/:sop_id", feedbackController.getFeedbackBySopId);

// Protected routes (perlu autentikasi - untuk admin)
router.get("/", authenticate, feedbackController.getAllFeedback);
router.put("/:id", authenticate, feedbackController.updateFeedback);
router.delete("/:id", authenticate, feedbackController.deleteFeedback);

module.exports = router;
