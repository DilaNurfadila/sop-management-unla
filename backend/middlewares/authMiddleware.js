/**
 * Middleware: authMiddleware
 *
 * Memvalidasi sesi pengguna:
 * - Membaca JWT dari cookie httpOnly
 * - Memverifikasi token dan memuat user ke req.user
 * - Mengembalikan 401 jika tidak valid/expired
 *
 * Catatan:
 * - Dipakai sebelum endpoint privat (melindungi data internal)
 */
// Import jsonwebtoken untuk verifikasi JWT token
const jwt = require("jsonwebtoken");
// Import model User untuk mengambil data lengkap user
const User = require("../models/User");
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
  // Gunakan nama cookie tunggal untuk token
  let cookieName = "token";

  // Ambil token dari cookie HTTP-only berdasarkan nama cookie yang sesuai
  // Pastikan req.cookies ada sebelum mengakses property
  const token = req.cookies ? req.cookies[cookieName] : null;

  // Jika token tidak ada, tolak akses
  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak, token tidak tersedia" });
  }

  try {
    // Verifikasi dan decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ambil data lengkap user dari database berdasarkan ID dari token
    try {
      const fullUserData = await User.findById(decoded.id);
      if (fullUserData) {
        // Jika akun dinonaktifkan (termasuk format disabled:*), tolak akses
        if (
          typeof fullUserData.role === "string" &&
          fullUserData.role.startsWith("disabled")
        ) {
          try {
            await Auth.logout(fullUserData.email);
          } catch (e) {}
          // Bersihkan cookie token
          try {
            // Clear token cookie (match the cookie name based on origin) and session_id
            res.clearCookie(cookieName, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              path: "/",
            });
            try {
              res.clearCookie("session_id", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
              });
            } catch (e) {}
          } catch (e) {}
          return res
            .status(403)
            .json({ message: "Akun dinonaktifkan. Hubungi administrator." });
        }
        // Simpan data user lengkap ke request object
        req.user = fullUserData;
      } else {
        // Jika user tidak ditemukan di database, gunakan data dari token
        req.user = decoded;
      }
    } catch (dbError) {
      // Fallback ke data dari token jika gagal akses database
      req.user = decoded;
    }

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
      } catch (e) {}

      // Pastikan cookie token dibersihkan dari browser
      try {
        // Clear token cookie (match the cookie name based on origin) and session_id when expired
        res.clearCookie(cookieName, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
        try {
          res.clearCookie("session_id", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
          });
        } catch (e) {}
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
      // Clear token cookie (match the cookie name based on origin) and session_id when invalid
      res.clearCookie(cookieName, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      try {
        res.clearCookie("session_id", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          path: "/",
        });
      } catch (e) {}
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
