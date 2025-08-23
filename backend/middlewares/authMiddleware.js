// Import jsonwebtoken untuk verifikasi JWT token
const jwt = require("jsonwebtoken");
// Load environment variables
require("dotenv").config();
// Import model Auth untuk operasi logout
const Auth = require("../models/Auth");

/**
 * Middleware untuk authentication - memverifikasi JWT token
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 * @param {Function} next - Next function untuk melanjutkan ke middleware berikutnya
 */
exports.authenticate = async (req, res, next) => {
  // Ambil token dari cookie HTTP-only
  const token = req.cookies.token;

  // Jika token tidak ada, tolak akses
  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak, token tidak tersedia" });
  }

  try {
    // Verifikasi dan decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Simpan data user dari token ke request object
    req.user = decoded;
    // Lanjutkan ke middleware atau route handler berikutnya
    next();
  } catch (error) {
    // Handle khusus untuk token yang expired
    if (error.name === "TokenExpiredError") {
      try {
        // Decode token tanpa verifikasi untuk mendapatkan email
        const decoded = jwt.decode(token);
        if (decoded && decoded.email) {
          // Hapus token yang expired dari database
          await Auth.logout(decoded.email);
        }
      } catch (e) {
        console.error("Gagal membersihkan token yang expired:", e.message);
      }

      // Pastikan cookie token dibersihkan dari browser
      try {
        res.clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
      } catch (e) {
        // noop
      }

      return res
        .status(401)
        .json({ message: "Sesi telah berakhir, silakan login kembali" });
    }

    // Handle error lainnya (token invalid, malformed, dll)
    try {
      // Coba decode untuk membersihkan token di DB jika memungkinkan
      const decoded = jwt.decode(token);
      if (decoded && decoded.email) {
        await Auth.logout(decoded.email);
      }
    } catch (e) {
      // noop
    }

    // Bersihkan cookie jika token tidak valid
    try {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    } catch (e) {
      // noop
    }

    res.status(401).json({ message: "Token tidak valid" });
  }
};

/**
 * Middleware untuk authorization - memverifikasi role user
 * @param {Array} roles - Array of allowed roles untuk akses
 * @returns {Function} - Middleware function untuk authorization
 */
exports.authorize = (roles) => {
  return (req, res, next) => {
    // Cek apakah role user termasuk dalam role yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki akses ke fitur ini" });
    }
    // Jika role sesuai, lanjutkan ke handler berikutnya
    next();
  };
};
