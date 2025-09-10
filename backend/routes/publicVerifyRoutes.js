const express = require("express");
const router = express.Router();
const publicVerifyController = require("../controllers/publicVerifyController");

// PUBLIC QR verification route by checksum (no auth)
router.get("/verify-sop/:checksum", publicVerifyController.verifySopByChecksum);

module.exports = router;
