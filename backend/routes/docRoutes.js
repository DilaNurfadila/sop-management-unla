const express = require("express");
const router = express.Router();
const multer = require("multer");
const sopDocController = require("../controllers/sopDocController");
const { authenticate } = require("../middlewares/authMiddleware");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  },
});

router.get("/", authenticate, sopDocController.getAllDocs);
router.get("/public/published", sopDocController.getPublishedDocs); // Public endpoint for published docs
router.get("/:id", authenticate, sopDocController.getDocById);
router.post("/", authenticate, sopDocController.createDoc);
router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  sopDocController.uploadFile
);
router.put("/:id", authenticate, sopDocController.updateDoc);
router.put(
  "/update-file/:id",
  authenticate,
  upload.single("file"),
  sopDocController.updateFile
);
router.put("/publish/:id", authenticate, sopDocController.publishDoc);
router.put("/unpublish/:id", authenticate, sopDocController.unpublishDoc);
router.delete("/:id", authenticate, sopDocController.deleteDoc);

module.exports = router;
