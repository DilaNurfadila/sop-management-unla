const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Database connectivity health check
router.get("/db", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    res.json({ ok: true, result: rows[0] });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

module.exports = router;
