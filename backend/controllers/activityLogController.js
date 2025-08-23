const ActivityLog = require("../models/ActivityLog");

/**
 * Helper function untuk logging aktivitas activity log management
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (VIEW, SEARCH, STATS, CLEANUP)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logActivityLogActivity = async (
  user,
  action,
  description,
  req,
  targetData = null
) => {
  try {
    // Pastikan semua parameter user ada, gunakan default jika undefined
    // Jika user_id null, gunakan system user (ID 32) untuk foreign key constraint
    const userId = user?.id || 32;
    const userName = user?.name || user?.email || "Unknown User";
    const userRole = user?.role || "user";

    // Pastikan parameter lain juga tidak undefined
    const actionStr = action || "UNKNOWN";
    const descriptionStr = description || "No description";

    await ActivityLog.logUserActivity(
      userId,
      userName,
      userRole,
      actionStr,
      "ACTIVITY_LOG",
      descriptionStr,
      req,
      targetData?.id || null,
      targetData ? "activity_log" : null
    );
  } catch (error) {
    console.error("Error logging activity log activity:", error.message);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

// Mengambil semua log aktivitas dengan filter dan pagination
exports.getAllLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      user_id,
      action,
      module,
      user_role,
      date_from,
      date_to,
    } = req.query;

    // Validasi role - hanya admin yang bisa melihat semua log
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat melihat riwayat aktivitas",
      });
    }

    const filters = {};
    if (user_id) filters.user_id = user_id;
    if (action) filters.action = action;
    if (module) filters.module = module;
    if (user_role) filters.user_role = user_role;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const result = await ActivityLog.findAll(
      parseInt(page),
      parseInt(limit),
      filters
    );

    // Log aktivitas melihat daftar log aktivitas
    await logActivityLogActivity(
      req.user,
      "VIEW",
      `Admin ${req.user.name} mengakses riwayat aktivitas (${result.logs.length} records)`,
      req
    );

    res.status(200).json({
      success: true,
      message: "Riwayat aktivitas berhasil diambil",
      data: result,
    });
  } catch (error) {
    console.error("Error in getAllLogs:", error.message);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat aktivitas",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Mengambil log aktivitas berdasarkan ID
exports.getLogById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi role - hanya admin yang bisa melihat detail log
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat melihat detail aktivitas",
      });
    }

    const log = await ActivityLog.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: "Log aktivitas tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Detail log aktivitas berhasil diambil",
      data: log,
    });
  } catch (error) {
    console.error("Error in getLogById:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil detail log aktivitas",
      error: error.message,
    });
  }
};

// Mencari log aktivitas berdasarkan kata kunci
exports.searchLogs = async (req, res) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;

    // Validasi role - hanya admin yang bisa mencari log
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat mencari riwayat aktivitas",
      });
    }

    if (!q || q.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Kata kunci pencarian harus diisi",
      });
    }

    const result = await ActivityLog.search(
      q.trim(),
      parseInt(page),
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      message: "Pencarian riwayat aktivitas berhasil",
      data: result,
      keyword: q.trim(),
    });
  } catch (error) {
    console.error("Error in searchLogs:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mencari riwayat aktivitas",
      error: error.message,
    });
  }
};

// Mendapatkan statistik aktivitas
exports.getActivityStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    // Validasi role - hanya admin yang bisa melihat statistik
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat melihat statistik aktivitas",
      });
    }

    const stats = await ActivityLog.getStats(parseInt(days));

    res.status(200).json({
      success: true,
      message: "Statistik aktivitas berhasil diambil",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getActivityStats:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik aktivitas",
      error: error.message,
    });
  }
};

// Membuat log aktivitas baru (untuk testing atau manual entry)
exports.createLog = async (req, res) => {
  try {
    const { action, module, description, target_id, target_type } = req.body;

    // Validasi input
    if (!action || !module || !description) {
      return res.status(400).json({
        success: false,
        message: "Action, module, dan description harus diisi",
      });
    }

    // Validasi role - hanya admin yang bisa membuat log manual
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat membuat log aktivitas manual",
      });
    }

    const newLog = await ActivityLog.logUserActivity(
      req.user.id,
      req.user.name,
      req.user.role,
      action.toUpperCase(),
      module.toUpperCase(),
      description,
      req,
      target_id,
      target_type
    );

    res.status(201).json({
      success: true,
      message: "Log aktivitas berhasil dibuat",
      data: newLog,
    });
  } catch (error) {
    console.error("Error in createLog:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal membuat log aktivitas",
      error: error.message,
    });
  }
};

// Menghapus log lama (maintenance)
exports.cleanupOldLogs = async (req, res) => {
  try {
    const { days = 90 } = req.body;

    // Validasi role - hanya admin yang bisa cleanup
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat melakukan cleanup log",
      });
    }

    const result = await ActivityLog.deleteOldLogs(parseInt(days));

    // Log aktivitas cleanup
    await ActivityLog.logUserActivity(
      req.user.id,
      req.user.name,
      req.user.role,
      "CLEANUP",
      "SYSTEM",
      `Membersihkan log aktivitas lebih dari ${days} hari. ${result.deleted_count} log dihapus`,
      req
    );

    res.status(200).json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error("Error in cleanupOldLogs:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal melakukan cleanup log aktivitas",
      error: error.message,
    });
  }
};

// Mengambil aktivitas user tertentu (untuk profil user)
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    // User hanya bisa melihat aktivitasnya sendiri, kecuali admin
    if (req.user.role !== "admin" && req.user.id !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: "Anda hanya dapat melihat aktivitas sendiri",
      });
    }

    const result = await ActivityLog.findAll(parseInt(page), parseInt(limit), {
      user_id: userId,
    });

    res.status(200).json({
      success: true,
      message: "Riwayat aktivitas user berhasil diambil",
      data: result,
    });
  } catch (error) {
    console.error("Error in getUserActivities:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat aktivitas user",
      error: error.message,
    });
  }
};
