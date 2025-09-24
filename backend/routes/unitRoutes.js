const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unitController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

// GET /api/units - Ambil semua unit (semua user yang login bisa akses)
router.get("/", authenticate, unitController.getAllUnits);

// GET /api/units/public - Ambil semua unit untuk registrasi (tanpa autentikasi)
router.get("/public", unitController.getAllUnitsPublic);

// GET /api/units/stats - Ambil statistik unit (admin only)
router.get(
  "/stats",
  authenticate,
  authorize(["superadmin", "admin"]),
  unitController.getUnitStats
);

// GET /api/units/search - Cari unit (semua user yang login bisa akses)
router.get("/search", authenticate, unitController.searchUnits);

// GET /api/units/:id - Ambil unit berdasarkan ID (semua user yang login bisa akses)
router.get("/:id", authenticate, unitController.getUnitById);

// POST /api/units - Buat unit baru (admin only)
router.post(
  "/",
  authenticate,
  authorize(["superadmin", "admin"]),
  unitController.createUnit
);

// PUT /api/units/:id - Update unit (admin only)
router.put(
  "/:id",
  authenticate,
  authorize(["superadmin", "admin"]),
  unitController.updateUnit
);

// DELETE /api/units/:id - Hapus unit (admin only)
// PUT /api/units/:id/deactivate - Nonaktifkan unit (admin only)
router.put(
  "/:id/deactivate",
  authenticate,
  authorize(["superadmin", "admin"]),
  unitController.deactivateUnit
);

// PUT /api/units/:id/activate - Aktifkan kembali unit (admin only)
router.put(
  "/:id/activate",
  authenticate,
  authorize(["superadmin", "admin"]),
  unitController.activateUnit
);

module.exports = router;
