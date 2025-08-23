const Unit = require("../models/Unit");
const ActivityLog = require("../models/ActivityLog");

/**
 * Helper function untuk logging aktivitas unit management
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (CREATE, UPDATE, DELETE)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logUnitActivity = async (
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
      "UNIT",
      descriptionStr,
      req,
      targetData?.id || null,
      targetData ? "unit" : null
    );
  } catch (error) {
    console.error("Error logging unit activity:", error.message);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

// Mengambil semua unit
exports.getAllUnits = async (req, res) => {
  try {
    const units = await Unit.findAll();
    res.status(200).json({
      success: true,
      message: "Data unit berhasil diambil",
      units: units,
    });
  } catch (error) {
    console.error("Error in getAllUnits:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data unit",
      error: error.message,
    });
  }
};

// Mengambil unit berdasarkan ID
exports.getUnitById = async (req, res) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findById(id);

    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    res.status(200).json({
      success: true,
      message: "Data unit berhasil diambil",
      unit: unit,
    });
  } catch (error) {
    console.error("Error in getUnitById:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data unit",
      error: error.message,
    });
  }
};

// Membuat unit baru
exports.createUnit = async (req, res) => {
  try {
    const { nomor_unit, kode_unit, nama_unit } = req.body;

    // Validasi input
    if (!nomor_unit || !kode_unit || !nama_unit) {
      return res.status(400).json({
        success: false,
        message: "Nomor unit, kode unit, dan nama unit harus diisi",
      });
    }

    // Validasi role - hanya admin yang bisa menambah unit
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat menambah unit",
      });
    }

    const newUnit = await Unit.create({
      nomor_unit: nomor_unit.trim(),
      kode_unit: kode_unit.trim().toUpperCase(),
      nama_unit: nama_unit.trim(),
    });

    // Ambil nama pengguna dari database
    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const adminName = userRows[0]?.name || req.user?.email || "Admin";

    // Log aktivitas pembuatan unit
    await logUnitActivity(
      req.user,
      "CREATE",
      `Admin (${adminName}) membuat unit baru: ${newUnit.nama_unit} (${newUnit.kode_unit})`,
      req,
      { id: newUnit.id },
      adminName
    );

    res.status(201).json({
      success: true,
      message: "Unit berhasil dibuat",
      unit: newUnit,
    });
  } catch (error) {
    console.error("Error in createUnit:", error.message);

    if (error.message.includes("sudah digunakan")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal membuat unit",
      error: error.message,
    });
  }
};

// Update unit
exports.updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { nomor_unit, kode_unit, nama_unit } = req.body;

    // Validasi input
    if (!nomor_unit || !kode_unit || !nama_unit) {
      return res.status(400).json({
        success: false,
        message: "Nomor unit, kode unit, dan nama unit harus diisi",
      });
    }

    // Validasi role - hanya admin yang bisa mengupdate unit
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat mengupdate unit",
      });
    }

    // Ambil data unit lama untuk logging
    const oldUnit = await Unit.findById(id);
    if (!oldUnit) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    const updatedUnit = await Unit.update(id, {
      nomor_unit: nomor_unit.trim(),
      kode_unit: kode_unit.trim().toUpperCase(),
      nama_unit: nama_unit.trim(),
    });

    // Ambil nama pengguna dari database
    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const adminName = userRows[0]?.name || req.user?.email || "Admin";

    // Log aktivitas update unit
    await logUnitActivity(
      req.user,
      "UPDATE",
      `Admin (${adminName}) mengupdate unit: ${oldUnit.nama_unit} menjadi ${updatedUnit.nama_unit}`,
      req,
      {
        id: updatedUnit.id,
      },
      adminName
    );

    res.status(200).json({
      success: true,
      message: "Unit berhasil diupdate",
      unit: updatedUnit,
    });
  } catch (error) {
    console.error("Error in updateUnit:", error.message);

    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.includes("sudah digunakan")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal mengupdate unit",
      error: error.message,
    });
  }
};

// Hapus unit
exports.deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    // Validasi role - hanya admin yang bisa menghapus unit
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat menghapus unit",
      });
    }

    // Ambil data unit sebelum dihapus untuk logging
    const unitToDelete = await Unit.findById(id);
    if (!unitToDelete) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    await Unit.delete(id);

    // Ambil nama pengguna dari database
    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const adminName = userRows[0]?.name || req.user?.email || "Admin";

    // Log aktivitas penghapusan unit
    await logUnitActivity(
      req.user,
      "DELETE",
      `Admin (${adminName}) menghapus unit: ${unitToDelete.nama_unit} (${unitToDelete.kode_unit})`,
      req,
      { id: unitToDelete.id },
      adminName
    );

    res.status(200).json({
      success: true,
      message: "Unit berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deleteUnit:", error.message);

    if (error.message.includes("tidak ditemukan")) {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Gagal menghapus unit",
      error: error.message,
    });
  }
};

// Cari unit
exports.searchUnits = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: "Kata kunci pencarian harus diisi",
      });
    }

    const units = await Unit.search(q.trim());

    res.status(200).json({
      success: true,
      message: "Pencarian unit berhasil",
      units: units,
      keyword: q.trim(),
    });
  } catch (error) {
    console.error("Error in searchUnits:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mencari unit",
      error: error.message,
    });
  }
};

// Mendapatkan statistik unit
exports.getUnitStats = async (req, res) => {
  try {
    const stats = await Unit.getStats();

    res.status(200).json({
      success: true,
      message: "Statistik unit berhasil diambil",
      stats: stats,
    });
  } catch (error) {
    console.error("Error in getUnitStats:", error.message);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik unit",
      error: error.message,
    });
  }
};
