const express = require("express");
const router = express.Router();
const archiveController = require("../controllers/archiveController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// All archive routes require authentication and admin/admin_unit role
router.get(
  "/",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.getAllArchived
);
router.get(
  "/stats",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.getArchiveStats
);
router.get(
  "/sop/:sopId",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.getArchivedVersions
);
router.get(
  "/:id",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.getArchivedById
);
router.get(
  "/:id/download",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.downloadArchivedFile
);
router.post(
  "/:id/restore",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.restoreDocument
);
router.delete(
  "/:id",
  authenticate,
  authorize(["admin", "admin_unit"]),
  archiveController.deleteArchived
);

module.exports = router;
