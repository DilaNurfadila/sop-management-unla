/**
 * File: routes/archiveRoutes.js
 * Ringkasan: Rute untuk melihat arsip, statistik arsip, mengarsipkan dokumen, dan restore dokumen.
 */
const express = require("express");
const router = express.Router();
const archiveController = require("../controllers/archiveController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// Route untuk melihat daftar dokumen yang diarsipkan - semua user bisa akses
router.get(
  "/",
  authenticate,
  authorize(["superadmin", "admin", "admin_unit", "user"]),
  archiveController.getAllArchivedDocs
);

// Route untuk mengarsipkan dokumen SOP aktif - hanya admin/admin_unit
router.post(
  "/archive-sop/:sopId",
  authenticate,
  authorize(["superadmin", "admin", "admin_unit"]),
  archiveController.archiveSop
);

// Route untuk mendapatkan statistik arsip - semua user bisa akses
router.get(
  "/stats",
  authenticate,
  authorize(["superadmin", "admin", "admin_unit", "user"]),
  archiveController.getArchiveStats
);
router.post(
  "/:id/restore",
  authenticate,
  authorize(["superadmin", "admin", "admin_unit"]),
  archiveController.restoreSopFromArchive
);

module.exports = router;
