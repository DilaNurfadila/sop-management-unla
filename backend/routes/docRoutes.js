// Import Express untuk membuat router
const express = require("express");
const router = express.Router();
// Import multer untuk handling file uploads
const multer = require("multer");
// Import controller untuk dokumen SOP
const sopDocController = require("../controllers/sopDocController");
// Import middleware authentication
const { authenticate } = require("../middlewares/authMiddleware");

/**
 * Konfigurasi multer untuk upload file
 * Menggunakan memory storage untuk file yang di-upload
 */
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limit ukuran file 10MB
  },
  fileFilter: (req, file, cb) => {
    // Filter file - hanya PDF yang diizinkan
    if (file.mimetype === "application/pdf") {
      cb(null, true); // Accept file
    } else {
      cb(new Error("Only PDF files are allowed"), false); // Reject file
    }
  },
});

/**
 * Route Definitions untuk operasi dokumen SOP
 */

// GET /api/docs - Ambil semua dokumen (protected)
router.get("/", authenticate, sopDocController.getAllDocs);

// GET /api/docs/public/published - Ambil dokumen published (public endpoint)
router.get("/public/published", sopDocController.getPublishedDocs);

// GET /api/docs/:id - Ambil dokumen berdasarkan ID (protected)
router.get("/:id", authenticate, sopDocController.getDocById);

// POST /api/docs - Buat dokumen baru (protected)
router.post("/", authenticate, sopDocController.createDoc);

// POST /api/docs/upload - Upload file PDF dan buat dokumen (protected)
router.post(
  "/upload",
  authenticate, // Middleware authentication
  upload.single("file"), // Middleware multer untuk upload single file
  sopDocController.uploadFile // Controller handler
);

// PUT /api/docs/:id - Update dokumen berdasarkan ID (protected)
router.put("/:id", authenticate, sopDocController.updateDoc);

// PUT /api/docs/update-file/:id - Update file dokumen (protected)
router.put(
  "/update-file/:id",
  authenticate, // Middleware authentication
  upload.single("file"), // Middleware multer untuk upload file baru
  sopDocController.updateFile // Controller handler
);

// PUT /api/docs/publish/:id - Publish dokumen (protected)
router.put("/publish/:id", authenticate, sopDocController.publishDoc);

// PUT /api/docs/unpublish/:id - Unpublish dokumen (protected)
router.put("/unpublish/:id", authenticate, sopDocController.unpublishDoc);

// DELETE /api/docs/:id - Hapus dokumen berdasarkan ID (protected)
router.delete("/:id", authenticate, sopDocController.deleteDoc);

// Export router untuk digunakan di app.js
module.exports = router;
