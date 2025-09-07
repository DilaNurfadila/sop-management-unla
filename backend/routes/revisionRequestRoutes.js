const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authMiddleware");
const { requireAdminRole } = require("../middlewares/adminMiddleware");
const revisionRequestController = require("../controllers/revisionRequestController");

// Submit revision request (any authenticated user)
router.post(
  "/:id/request",
  authenticate,
  revisionRequestController.submitRevisionRequest
);

// Get revision request history for a SOP (any authenticated user)
router.get(
  "/:id/history",
  authenticate,
  revisionRequestController.getRevisionRequestHistory
);

// Get all pending revision requests (admin only)
router.get(
  "/pending",
  authenticate,
  requireAdminRole,
  revisionRequestController.getPendingRevisionRequests
);

// Approve revision request (admin only)
router.put(
  "/:id/approve",
  authenticate,
  requireAdminRole,
  revisionRequestController.approveRevisionRequest
);

// Reject revision request (admin only)
router.put(
  "/:id/reject",
  authenticate,
  requireAdminRole,
  revisionRequestController.rejectRevisionRequest
);

module.exports = router;
