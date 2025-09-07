const express = require("express");
const router = express.Router();
const sopCreatorController = require("../controllers/sopCreatorController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireAdminRole } = require("../middlewares/adminMiddleware");

// Middleware auth untuk semua routes
router.use(authenticate);

/**
 * Route untuk mengambil daftar pengguna dalam unit yang sama dengan admin
 * GET /api/sop-creator/users
 * Header: Authorization: Bearer <token>
 * Hanya untuk admin unit
 */
router.get(
  "/users",
  requireAdminRole,
  sopCreatorController.getUsersByAdminUnit
);

/**
 * Route untuk menugaskan pengguna sebagai creator SOP
 * POST /api/sop-creator/assign
 * Header: Authorization: Bearer <token>
 * Hanya untuk admin unit
 * Body: {
 *   assigned_to: user_id,
 *   notes: "Catatan tugas",
 *   due_date: "YYYY-MM-DD"
 * }
 */
router.post("/assign", requireAdminRole, sopCreatorController.assignSopCreator);

/**
 * Route untuk mengambil daftar penugasan yang dibuat oleh admin
 * GET /api/sop-creator/assignments/created
 * Header: Authorization: Bearer <token>
 * Hanya untuk admin unit
 */
router.get(
  "/assignments/created",
  requireAdminRole,
  sopCreatorController.getAssignmentsByAdmin
);

/**
 * Route untuk mengambil daftar penugasan untuk user yang login
 * GET /api/sop-creator/assignments/mine
 * Header: Authorization: Bearer <token>
 */
router.get("/assignments/mine", sopCreatorController.getAssignmentsForUser);

/**
 * Route untuk mengambil daftar SOP yang sudah disahkan berdasarkan unit kerja admin
 * GET /api/sop-creator/approved-sops
 * Header: Authorization: Bearer <token>
 * Hanya untuk admin unit
 */
router.get(
  "/approved-sops",
  requireAdminRole,
  sopCreatorController.getApprovedSopsByAdminUnit
);

/**
 * Route untuk mengupdate status penugasan
 * PUT /api/sop-creator/assignments/:id/status
 * Header: Authorization: Bearer <token>
 * Body: {
 *   status: "accepted|rejected|in_progress|completed",
 *   response: "Response text (opsional)"
 * }
 */
router.put(
  "/assignments/:id/status",
  sopCreatorController.updateAssignmentStatus
);

/**
 * Route untuk menghapus penugasan (hanya oleh admin yang membuat)
 * DELETE /api/sop-creator/assignments/:id
 * Header: Authorization: Bearer <token>
 * Hanya untuk admin unit
 */
router.delete(
  "/assignments/:id",
  requireAdminRole,
  sopCreatorController.deleteAssignment
);

module.exports = router;
