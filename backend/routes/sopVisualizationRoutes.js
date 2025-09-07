const express = require("express");
const router = express.Router();
const sopVisualizationController = require("../controllers/sopVisualizationController");
const { body } = require("express-validator");

// Validation rules
const createUpdateValidation = [
  body("status")
    .isIn(["Mulai", "Proses", "Pilihan", "Selesai"])
    .withMessage("Status must be valid"),
  body("return_to_activity_id")
    .optional()
    .isInt()
    .withMessage("Return activity must be integer"),
  body("completeness")
    .optional()
    .isString()
    .withMessage("Kelengkapan must be string"),
  body("time_required")
    .optional()
    .isString()
    .withMessage("Waktu must be string"),
  body("output").optional().isString().withMessage("Output must be string"),
  body("notes").optional().isString().withMessage("Notes must be string"),
];

// Routes
router.get("/:sopDocId", sopVisualizationController.getBySopDocId);
router.post("/", createUpdateValidation, sopVisualizationController.create);
router.put("/:key", createUpdateValidation, sopVisualizationController.update);
router.delete("/:key", sopVisualizationController.delete);

module.exports = router;
