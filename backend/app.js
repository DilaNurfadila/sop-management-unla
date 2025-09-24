/**
 * app.js — Entry point aplikasi Express untuk Sistem Manajemen SOP UNLA
 *
 * Tanggung jawab file ini:
 * - Inisialisasi instance Express
 * - Registrasi middleware global (cookies, CORS, JSON body parser)
 * - Mount semua route module (tanpa logika bisnis di sini)
 * - Menjalankan HTTP server
 *
 * Catatan arsitektur:
 * - Semua handler/logic ada di folder routes/ dan controllers/ (bukan di app.js)
 * - Konfigurasi DB ada di config/db.js dan diakses oleh controller/service terkait
 * - Endpoint publik verifikasi QR dipisah di routes/publicVerifyRoutes.js (tanpa auth)
 */
// Import Express framework untuk web server
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Import route modules (semua rute diorganisir per domain)
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const unitRoutes = require("./routes/unitRoutes");
const activityLogRoutes = require("./routes/activityLogRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const archiveRoutes = require("./routes/archiveRoutes");
const docRoutes = require("./routes/docRoutes");
const sopCreatorRoutes = require("./routes/sopCreatorRoutes");
const flowchartRoutes = require("./routes/flowchartRoutes");
const sopVisualizationRoutes = require("./routes/sopVisualizationRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const qrCodeRoutes = require("./routes/qrCodeRoutes");
const healthRoutes = require("./routes/healthRoutes");
const publicVerifyRoutes = require("./routes/publicVerifyRoutes");
const kpiRoutes = require("./routes/kpiRoutes");

// Buat instance Express
const app = express();

// Middleware: parsing cookies (auth berbasis cookie, dsb.)
app.use(cookieParser());

// Konfigurasi CORS untuk mengizinkan frontend mengakses backend
// Sesuaikan daftar origin sesuai port Vite atau domain deployment
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ], // URL frontend React
    credentials: true, // Mengizinkan cookie dikirim
  })
);

// Middleware: parsing JSON body
app.use(express.json());

// Mount routes: setiap base path merepresentasikan domain fitur tertentu
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api/docs", docRoutes); // Rute dokumen
app.use("/api/sop-creator", sopCreatorRoutes);
app.use("/api", flowchartRoutes); // Rute flowchart
app.use("/api/sop-visualization", sopVisualizationRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/qr", qrCodeRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/kpi", kpiRoutes);
// Endpoint publik verifikasi QR (tanpa auth), dipasang di root agar URL ringkas untuk QR scanner
app.use("/", publicVerifyRoutes);

// Catatan: route publik & health check dipindahkan ke module terdedikasi (tidak menumpuk di app.js)

// Mulai server HTTP
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
