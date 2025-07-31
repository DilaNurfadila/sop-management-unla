const jwt = require("jsonwebtoken");
require("dotenv").config();
const Auth = require("../models/Auth");

exports.authenticate = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Akses ditolak, token tidak tersedia" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      try {
        const decoded = jwt.decode(token); // decode saja, tidak diverifikasi
        if (decoded && decoded.email) {
          await Auth.logout(decoded.email); // hapus token dari DB
        }
      } catch (e) {
        console.error("Gagal membersihkan token yang expired:", e.message);
      }

      return res
        .status(401)
        .json({ message: "Sesi telah berakhir, silakan login kembali" });
    }

    res.status(401).json({ message: "Token tidak valid" });
  }
};

exports.authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: "Anda tidak memiliki akses ke fitur ini" });
    }
    next();
  };
};
