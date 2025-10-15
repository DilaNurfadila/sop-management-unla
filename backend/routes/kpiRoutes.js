/**
 * File: routes/kpiRoutes.js
 * Ringkasan: Rute ringkasan KPI untuk dashboard admin/superadmin.
 */
const express = require("express");
const router = express.Router();
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const kpiController = require("../controllers/kpiController");

// KPI summary is available to all authenticated roles; data is scoped by role
router.get(
  "/summary",
  authenticate,
  authorize(["superadmin", "admin"]),
  kpiController.getKpiSummary
);

module.exports = router;
