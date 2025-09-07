// Middleware khusus untuk admin unit role validation

/**
 * Middleware untuk memvalidasi role admin unit
 * Hanya admin yang dapat mengakses endpoint tertentu
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.requireAdminRole = (req, res, next) => {
  try {
    // Cek apakah user sudah login melalui auth middleware sebelumnya
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // Cek apakah user memiliki role admin atau admin_unit
    if (req.user.role !== "admin" && req.user.role !== "admin_unit") {
      return res.status(403).json({
        message:
          "Admin role required. Only admin or admin unit can access this feature.",
        user_role: req.user.role,
      });
    }

    // Jika sudah admin, lanjutkan ke controller
    next();
  } catch (error) {res.status(500).json({
      message: "Error validating admin role",
      error: error.message,
    });
  }
};

/**
 * Middleware untuk memvalidasi unit access
 * Admin hanya bisa mengakses data dalam unit mereka sendiri
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
exports.requireSameUnit = (req, res, next) => {
  // Untuk sekarang, validasi ini dilakukan di controller level
  // Middleware ini bisa digunakan untuk validasi tambahan jika diperlukan
  next();
};

module.exports = exports;
