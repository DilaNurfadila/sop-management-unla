const express = require("express");
const router = express.Router();
const archiveController = require("../controllers/archiveController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// Route untuk melihat daftar dokumen yang diarsipkan - semua user bisa akses
router.get(
  "/",
  authenticate,
  authorize(["admin", "admin_unit", "user"]),
  archiveController.getAllArchivedDocs
);

// Route untuk mengarsipkan dokumen SOP aktif - hanya admin/admin_unit
router.post(
  "/archive-sop/:sopId",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.archiveSop
);

// Route untuk mendapatkan statistik arsip - semua user bisa akses
router.get(
  "/stats",
  authenticate,
  authorize(["admin", "admin_unit", "user"]),
  archiveController.getArchiveStats
);
// router.get(
//   "/sop/:sopId",
//   authenticate,
//   authorize(["admin", "admin_unit"]),
//   archiveController.getArchivedVersions
// );
// router.get(
//   "/:id",
//   authenticate,
//   authorize(["admin", "admin_unit"]),
//   archiveController.getArchivedById
// );
// router.get(
//   "/:id/download",
//   authenticate,
//   authorize(["admin", "admin_unit"]),
//   archiveController.downloadArchivedFile
// );
router.post(
  "/:id/restore",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.restoreSopFromArchive
);
// Komentar: Fungsi ini belum diimplementasikan
// router.delete(
//   "/:id",
//   authenticate,
//   authorize(["admin", "admin_unit"]),
//   archiveController.deleteArchived
// );

module.exports = router;
