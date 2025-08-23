const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unitController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET /api/units - Ambil semua unit (semua user yang login bisa akses)
router.get("/", authenticate, unitController.getAllUnits);

// GET /api/units/stats - Ambil statistik unit (admin only)
router.get("/stats", authenticate, authorize(["admin"]), unitController.getUnitStats);

// GET /api/units/search - Cari unit (semua user yang login bisa akses)
router.get("/search", authenticate, unitController.searchUnits);

// GET /api/units/:id - Ambil unit berdasarkan ID (semua user yang login bisa akses)
router.get("/:id", authenticate, unitController.getUnitById);

// POST /api/units - Buat unit baru (admin only)
router.post("/", authenticate, authorize(["admin"]), unitController.createUnit);

// PUT /api/units/:id - Update unit (admin only)
router.put("/:id", authenticate, authorize(["admin"]), unitController.updateUnit);

// DELETE /api/units/:id - Hapus unit (admin only)
router.delete("/:id", authenticate, authorize(["admin"]), unitController.deleteUnit);

module.exports = router;
