const express = require("express");
const router = express.Router();
const archiveController = require("../controllers/archiveController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// All archive routes require authentication and admin role
router.get(
  "/",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.getAllArchived
);
router.get(
  "/stats",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.getArchiveStats
);
router.get(
  "/sop/:sopId",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.getArchivedVersions
);
router.get(
  "/:id",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.getArchivedById
);
router.get(
  "/:id/download",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.downloadArchivedFile
);
router.post(
  "/:id/restore",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.restoreDocument
);
router.delete(
  "/:id",
  authenticate,
  authorize(["Penyusun"]),
  archiveController.deleteArchived
);

module.exports = router;
