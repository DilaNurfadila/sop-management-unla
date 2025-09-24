const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const { authenticate } = require("../middlewares/authMiddleware");
const { requireSuperAdmin } = require("../middlewares/adminMiddleware");

// GET /api/activities - Ambil semua log aktivitas (superadmin only)
router.get(
  "/",
  authenticate,
  requireSuperAdmin,
  activityLogController.getAllLogs
);

// GET /api/activities/stats - Ambil statistik aktivitas (superadmin only)
router.get(
  "/stats",
  authenticate,
  requireSuperAdmin,
  activityLogController.getActivityStats
);

// GET /api/activities/search - Cari log aktivitas (superadmin only)
router.get(
  "/search",
  authenticate,
  requireSuperAdmin,
  activityLogController.searchLogs
);

// GET /api/activities/user/:userId - Ambil aktivitas user tertentu (user sendiri atau admin)
router.get(
  "/user/:userId",
  authenticate,
  activityLogController.getUserActivities
);

// GET /api/activities/:id - Ambil log aktivitas berdasarkan ID (superadmin only)
router.get(
  "/:id",
  authenticate,
  requireSuperAdmin,
  activityLogController.getLogById
);

// POST /api/activities - Buat log aktivitas manual (superadmin only, untuk testing)
router.post(
  "/",
  authenticate,
  requireSuperAdmin,
  activityLogController.createLog
);

// POST /api/activities/cleanup - Bersihkan log lama (superadmin only)
router.post(
  "/cleanup",
  authenticate,
  requireSuperAdmin,
  activityLogController.cleanupOldLogs
);

module.exports = router;
