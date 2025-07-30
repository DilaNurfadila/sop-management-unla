const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { expressjwt } = require("express-jwt"); // Updated import
const docRoutes = require("./routes/docRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
require("dotenv").config();

const app = express();

// Middleware
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Ganti dengan origin frontend
    credentials: true,
  })
);
app.use(express.json());

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET;

// Protected routes
app.use("/api/docs", docRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Terjadi kesalahan server" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
