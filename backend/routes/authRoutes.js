const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
// Logout tidak butuh authenticate middleware karena harus bisa logout meskipun token expired
router.post("/logout", authController.logout);

// Routes untuk login dan forgot password
router.post("/login", authController.login);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
