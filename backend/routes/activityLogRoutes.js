const express = require("express");
const router = express.Router();
const activityLogController = require("../controllers/activityLogController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET /api/activities - Ambil semua log aktivitas (admin only)
router.get("/", authenticate, authorize(["admin"]), activityLogController.getAllLogs);

// GET /api/activities/stats - Ambil statistik aktivitas (admin only)
router.get("/stats", authenticate, authorize(["admin"]), activityLogController.getActivityStats);

// GET /api/activities/search - Cari log aktivitas (admin only)
router.get("/search", authenticate, authorize(["admin"]), activityLogController.searchLogs);

// GET /api/activities/user/:userId - Ambil aktivitas user tertentu (user sendiri atau admin)
router.get("/user/:userId", authenticate, activityLogController.getUserActivities);

// GET /api/activities/:id - Ambil log aktivitas berdasarkan ID (admin only)
router.get("/:id", authenticate, authorize(["admin"]), activityLogController.getLogById);

// POST /api/activities - Buat log aktivitas manual (admin only, untuk testing)
router.post("/", authenticate, authorize(["admin"]), activityLogController.createLog);

// POST /api/activities/cleanup - Bersihkan log lama (admin only)
router.post("/cleanup", authenticate, authorize(["admin"]), activityLogController.cleanupOldLogs);

module.exports = router;
