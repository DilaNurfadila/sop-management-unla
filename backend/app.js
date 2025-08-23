// Import Express framework untuk web server
const express = require("express");
// Import CORS middleware untuk handling cross-origin requests
const cors = require("cors");
// Import cookie-parser untuk parsing HTTP cookies
const cookieParser = require("cookie-parser");

// Import route handlers untuk berbagai endpoint
const docRoutes = require("./routes/docRoutes"); // Routes untuk dokumen SOP
const authRoutes = require("./routes/authRoutes"); // Routes untuk authentication
const userRoutes = require("./routes/userRoutes"); // Routes untuk user management
const feedbackRoutes = require("./routes/feedbackRoutes"); // Routes untuk feedback sistem
const archiveRoutes = require("./routes/archiveRoutes"); // Routes untuk archive sistem
const unitRoutes = require("./routes/unitRoutes"); // Routes untuk unit management
const activityLogRoutes = require("./routes/activityLogRoutes"); // Routes untuk activity logs

// Load environment variables dari .env file
require("dotenv").config();

// Inisialisasi Express application
const app = express();

/**
 * Middleware Configuration
 */

// Middleware untuk parsing cookies dari request headers
app.use(cookieParser());

// Middleware CORS untuk mengizinkan frontend mengakses backend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // URL frontend dari environment atau default
    credentials: true, // Mengizinkan pengiriman cookies dalam cross-origin requests
  })
);

// Middleware untuk parsing JSON request body
app.use(express.json());

/**
 * Route Configuration
 * Semua routes diawali dengan prefix /api/
 */
app.use("/api/docs", docRoutes); // Endpoint untuk operasi dokumen SOP
app.use("/api/auth", authRoutes); // Endpoint untuk authentication (login, register, logout)
app.use("/api/users", userRoutes); // Endpoint untuk user management
app.use("/api/feedback", feedbackRoutes); // Endpoint untuk sistem feedback
app.use("/api/archive", archiveRoutes); // Endpoint untuk sistem arsip dokumen
app.use("/api/units", unitRoutes); // Endpoint untuk unit management
app.use("/api/activities", activityLogRoutes); // Endpoint untuk activity logs

/**
 * Global Error Handler Middleware
 * Menangani semua error yang tidak ditangani di route handlers
 */
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error ke console untuk debugging
  res.status(500).json({ message: "Terjadi kesalahan server" });
});

/**
 * Server Configuration
 * Start server pada port yang ditentukan di environment variable atau default 5000
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
