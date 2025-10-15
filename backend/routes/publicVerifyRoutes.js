/**
 * File: routes/publicVerifyRoutes.js
 * Ringkasan: Rute publik untuk verifikasi SOP melalui checksum QR (tanpa autentikasi).
 */
const express = require("express");
const router = express.Router();
const publicVerifyController = require("../controllers/publicVerifyController");

// PUBLIC QR verification route by checksum (no auth)
router.get("/verify-sop/:checksum", publicVerifyController.verifySopByChecksum);

module.exports = router;
