/**
 * File: routes/flowchartRoutes.js
 * Ringkasan: Rute untuk aktivitas SOP, pelaksana (responsible person), dan visualisasi alur; tersedia varian publik dan protected.
 */
// flowchartRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  getSopActivities,
  createSopActivity,
  updateSopActivity,
  deleteSopActivity,
  getSopResponsiblePersons,
  getAvailableUsers,
  createSopResponsiblePerson,
  updateSopResponsiblePerson,
  deleteSopResponsiblePerson,
  getSopVisualizations,
  saveBulkVisualizations,
} = require("../controllers/flowchartController");

// ===============================
// PUBLIC FLOWCHART ROUTES (NO AUTH)
// ===============================
router.get("/public/sop-activities", getSopActivities);
router.get("/public/sop-responsible-person", getSopResponsiblePersons);
router.get("/public/sop-visualization", getSopVisualizations);

// ===============================
// PROTECTED ROUTES (WITH AUTH)
// ===============================
router.use(authenticate);

// ===============================
// SOP ACTIVITIES ROUTES
// ===============================
router.get("/sop-activities", getSopActivities);
router.post("/sop-activities", createSopActivity);
router.put("/sop-activities/:id", updateSopActivity);
router.delete("/sop-activities/:id", deleteSopActivity);

// ===============================
// SOP RESPONSIBLE PERSON ROUTES
// ===============================
router.get("/sop-responsible-person", getSopResponsiblePersons);
router.get("/sop-responsible-person/users", getAvailableUsers);
router.post("/sop-responsible-person", createSopResponsiblePerson);
router.put("/sop-responsible-person/:id", updateSopResponsiblePerson);
router.delete("/sop-responsible-person/:id", deleteSopResponsiblePerson);

// ===============================
// USERS ROUTES
// ===============================
router.get("/users", getAvailableUsers); // Endpoint baru untuk kecocokan frontend

// ===============================
// SOP VISUALIZATION ROUTES
// ===============================
router.get("/sop-visualization", getSopVisualizations);
router.post("/sop-visualization/bulk", saveBulkVisualizations);
router.delete("/sop-visualization/clear/:sop_doc_id", async (req, res) => {
  try {
    const { sop_doc_id } = req.params;

    // First, get all activity IDs for this SOP
    const [activities] = await db.execute(
      "SELECT id FROM sop_activities WHERE sop_doc_id = ?",
      [sop_doc_id]
    );

    if (activities.length === 0) {
      return res.json({
        message: `No activities found for SOP ${sop_doc_id}, nothing to clear.`,
        deletedCount: 0,
      });
    }

    const activityIds = activities.map((activity) => activity.id);

    // Delete visualizations for these activities
    const placeholders = activityIds.map(() => "?").join(",");
    const [result] = await db.execute(
      `DELETE FROM sop_visualization WHERE activity_id IN (${placeholders})`,
      activityIds
    );

    res.json({
      message: `All visualizations for SOP ${sop_doc_id} have been cleared.`,
      deletedCount: result.affectedRows,
    });
  } catch (error) {
    console.error("Error clearing visualization data:", error);
    res.status(500).json({
      message: "Error clearing visualization data",
      error: error.message,
      details: error.stack || "No stack trace available",
    });
  }
});

module.exports = router;
