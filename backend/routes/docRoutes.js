/**
 * File: routes/docRoutes.js
 * Ringkasan: Rute REST untuk dokumen SOP (CRUD, konten, publish/unpublish, validasi, submit review).
 * Keamanan: mayoritas endpoint protected; publik hanya /public/* untuk dokumen yang diizinkan.
 */
// Import Express untuk membuat router
const express = require("express");
const router = express.Router();
// Import controller untuk dokumen SOP
const sopDocController = require("../controllers/sopDocController");
// Import middleware authentication dan authorization
const { authenticate, authorize } = require("../middlewares/authMiddleware");

/**
 * Route Definitions untuk operasi dokumen SOP
 */
const canEditSOP = ["admin", "admin_unit", "user"];

// GET /api/docs - Ambil semua dokumen (protected)
router.get("/", authenticate, sopDocController.getAllDocs);

// GET /api/docs/public/published - Ambil dokumen published (public endpoint)
router.get("/public/published", sopDocController.getPublishedDocs);

// GET /api/docs/public/content/:id - Ambil konten SOP published (public endpoint)
router.get("/public/content/:id", sopDocController.getPublishedSopContent);

// GET /api/docs/my-unit - Ambil SOP berdasarkan unit kerja pengguna yang login (protected)
router.get("/my-unit", authenticate, sopDocController.getSopByUserUnit);

// GET /api/docs/by-unit/:unit_id - Ambil SOP berdasarkan unit tertentu (protected)
router.get("/by-unit/:unit_id", authenticate, sopDocController.getSopByUnit);

// GET /api/docs/by-unit-name/:unit_name - Ambil SOP berdasarkan nama unit tertentu (protected)
router.get(
  "/by-unit-name/:unit_name",
  authenticate,
  sopDocController.getSopByUnitName
);

// GET /api/docs/view/:id - View/buka dokumen berdasarkan ID dengan logging (protected)
// ** GUNAKAN ENDPOINT INI UNTUK TOMBOL "BUKA/VIEW" DI FRONTEND **
router.get("/view/:id", authenticate, sopDocController.viewDoc);

// GET /api/docs/:id - Ambil dokumen berdasarkan ID tanpa logging (protected)
// ** GUNAKAN ENDPOINT INI UNTUK AMBIL DATA EDIT FORM (TIDAK ADA LOGGING) **
router.get("/:id", authenticate, sopDocController.getDocById);

// GET /api/docs/content/:id - Ambil content SOP berdasarkan ID (protected)
router.get("/content/:id", authenticate, sopDocController.getSopContent);

// GET /api/docs/validate-before-submit/:id - Validasi dokumen dan visualisasi sebelum ajukan (protected)
router.get(
  "/validate-before-submit/:id",
  authenticate,
  sopDocController.validateBeforeSubmit
);

// POST /api/docs - Buat dokumen baru (protected)
router.post(
  "/",
  authenticate,
  authorize(canEditSOP),
  sopDocController.createDoc
);

// PUT /api/docs/:id - Update dokumen berdasarkan ID (protected)
router.put(
  "/:id",
  authenticate,
  authorize(canEditSOP),
  sopDocController.updateDoc
);

// PUT /api/docs/publish/:id - Publish dokumen (protected)
router.put(
  "/publish/:id",
  authenticate,
  authorize(canEditSOP),
  sopDocController.publishDoc
);

// PUT /api/docs/unpublish/:id - Unpublish dokumen (protected)
router.put(
  "/unpublish/:id",
  authenticate,
  authorize(canEditSOP),
  sopDocController.unpublishDoc
);

// PUT /api/docs/submit-review/:id - Submit SOP for review (protected)
router.put(
  "/submit-review/:id",
  authenticate,
  authorize(canEditSOP),
  sopDocController.submitSopForReview
);

// DELETE /api/docs/:id - Hapus dokumen berdasarkan ID (protected)
// Catatan: Penghapusan adalah tindakan yang sangat sensitif, mungkin hanya admin yang boleh melakukannya.
// Saya menyarankan hanya peran 'admin' yang dapat menghapus.
router.delete(
  "/:id",
  authenticate,
  authorize(["admin"]),
  sopDocController.deleteDoc
);

// Export router untuk digunakan di app.js
module.exports = router;
