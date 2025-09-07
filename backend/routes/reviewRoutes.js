const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const reviewController = require("../controllers/reviewController");

/**
 * GET /api/review/pending
 * Mengambil daftar SOP yang menunggu review oleh user yang login
 */
router.get("/pending", authenticate, reviewController.getPendingReviews);

/**
 * GET /api/review/sop/:id
 * Mengambil detail SOP untuk review
 */
router.get("/sop/:id", authenticate, reviewController.getSopForReview);

/**
 * POST /api/review/approve/:id
 * Menyetujui SOP (dari reviewer ke approver, atau dari approver ke published)
 */
router.post("/approve/:id", authenticate, reviewController.approveSop);

/**
 * POST /api/review/reject/:id
 * Menolak/revisi SOP dengan alasan
 */
router.post("/reject/:id", authenticate, reviewController.rejectSop);

/**
 * GET /api/review/history/:id
 * Mengambil riwayat review SOP
 */
router.get("/history/:id", authenticate, reviewController.getReviewHistory);

/**
 * GET /api/review/revision-notes/:sop_doc_id
 * Mengambil catatan revisi untuk SOP yang ditolak
 */
router.get(
  "/revision-notes/:sop_doc_id",
  authenticate,
  reviewController.getRevisionNotes
);

module.exports = router;
