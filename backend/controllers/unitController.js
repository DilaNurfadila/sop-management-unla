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
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

// Mengambil semua unit
exports.getAllUnits = async (req, res) => {
  try {
    let units = await Unit.findAll();
    // Untuk non-admin, sembunyikan unit yang dinonaktifkan (kode_unit diawali 'disabled:')
    if (req.user?.role !== "admin") {
      units = units.filter(
        (u) => !String(u.kode_unit || "").startsWith("disabled:")
      );
    }
    res.status(200).json({
      success: true,
      message: "Data unit berhasil diambil",
      units: units,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data unit",
      error: error.message,
    });
  }
};

// Mengambil semua unit untuk registrasi (tanpa autentikasi)
exports.getAllUnitsPublic = async (req, res) => {
  try {
    const unitsAll = await Unit.findAll();
    // Publik hanya melihat unit aktif
    const units = unitsAll.filter(
      (u) => !String(u.kode_unit || "").startsWith("disabled:")
    );
    res.status(200).json({
      success: true,
      message: "Data unit berhasil diambil",
      units: units,
    });
  } catch (error) {
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

// Nonaktifkan unit (soft deactivate dengan prefix pada kode_unit)
exports.deactivateUnit = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat menonaktifkan unit",
      });
    }

    const unit = await Unit.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    if (String(unit.kode_unit || "").startsWith("disabled:")) {
      return res.status(400).json({
        success: false,
        message: "Unit sudah dinonaktifkan",
      });
    }

    const updated = await Unit.update(id, {
      nomor_unit: unit.nomor_unit,
      kode_unit: `disabled:${unit.kode_unit}`,
      nama_unit: unit.nama_unit,
    });

    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const adminName = userRows[0]?.name || req.user?.email || "Admin";

    await logUnitActivity(
      req.user,
      "DEACTIVATE",
      `Admin (${adminName}) menonaktifkan unit: ${unit.nama_unit} (${unit.kode_unit})`,
      req,
      { id: updated.id },
      adminName
    );

    res.status(200).json({
      success: true,
      message: "Unit berhasil dinonaktifkan",
      unit: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menonaktifkan unit",
      error: error.message,
    });
  }
};

// Aktifkan kembali unit (restore kode_unit dari prefix disabled:)
exports.activateUnit = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Hanya admin yang dapat mengaktifkan unit",
      });
    }

    const unit = await Unit.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit tidak ditemukan",
      });
    }

    const kode = String(unit.kode_unit || "");
    if (!kode.startsWith("disabled:")) {
      return res.status(400).json({
        success: false,
        message: "Unit sudah dalam keadaan aktif",
      });
    }

    const restoredKode = kode.replace(/^disabled:/, "");
    // Pastikan tidak terjadi konflik kode saat reaktivasi
    const existing = await Unit.findByKode(restoredKode);
    if (existing && existing.id !== unit.id) {
      return res.status(409).json({
        success: false,
        message: `Kode unit "${restoredKode}" sudah digunakan oleh unit lain`,
      });
    }

    const updated = await Unit.update(id, {
      nomor_unit: unit.nomor_unit,
      kode_unit: restoredKode,
      nama_unit: unit.nama_unit,
    });

    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id,
    ]);
    const adminName = userRows[0]?.name || req.user?.email || "Admin";

    await logUnitActivity(
      req.user,
      "ACTIVATE",
      `Admin (${adminName}) mengaktifkan kembali unit: ${updated.nama_unit} (${updated.kode_unit})`,
      req,
      { id: updated.id },
      adminName
    );

    res.status(200).json({
      success: true,
      message: "Unit berhasil diaktifkan kembali",
      unit: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengaktifkan unit",
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

    let units = await Unit.search(q.trim());
    if (req.user?.role !== "admin") {
      units = units.filter(
        (u) => !String(u.kode_unit || "").startsWith("disabled:")
      );
    }

    res.status(200).json({
      success: true,
      message: "Pencarian unit berhasil",
      units: units,
      keyword: q.trim(),
    });
  } catch (error) {
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
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik unit",
      error: error.message,
    });
  }
};
