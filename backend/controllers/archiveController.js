/**
 * File: archiveController.js
 * Ringkasan: Mengelola arsip dokumen SOP:
 * - Melihat semua arsip & statistiknya
 * - Arsipkan dokumen aktif dengan alasan, dan pulihkan kembali (restore)
 * - Mencatat aktivitas (audit trail)
 */
// Mengimpor model SopArchive untuk operasi database arsip dokumen
const SopArchive = require("../models/SopArchive");
// Mengimpor model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog");
// Mengimpor model SopDoc untuk operasi dengan dokumen SOP
const SopDoc = require("../models/SopDoc");

// Membuat fungsi untuk mendapatkan semua dokumen yang diarsipkan
const getAllArchivedDocs = async (req, res) => {
  try {
    const { role, id: userId, unit: userUnit } = req.user;

    // Mendapatkan semua dokumen yang diarsipkan beserta informasi pengguna terkait
    let archivedDocs = await SopArchive.getAllArchivedDocs();

    // Perubahan: Semua role (admin, admin_unit, user) dapat melihat seluruh dokumen arsip.
    // Tidak ada filtering tambahan berdasarkan role/unit agar pengguna biasa juga bisa melihat semua arsip.

    res.status(200).json({ success: true, data: archivedDocs });
  } catch (error) {
    console.error("Error getting archived docs:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil dokumen yang diarsipkan",
    });
  }
};

// Membuat fungsi untuk mendapatkan statistik arsip
const getArchiveStats = async (req, res) => {
  try {
    // Ambil user data untuk filtering berdasarkan unit
    const { role, unit } = req.user;

    // Mendapatkan statistik arsip dari database dengan filtering unit
    const stats = await SopArchive.getArchiveStats(role, unit);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error("Error getting archive stats:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil statistik arsip",
    });
  }
};

// Membuat fungsi untuk mengarsipkan dokumen SOP aktif
const archiveSop = async (req, res) => {
  try {
    const { sopId } = req.params;
    const { id: userId } = req.user;

    // Validasi body request dan ambil reason
    let reason;
    try {
      reason = req.body?.reason;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      return res.status(400).json({
        success: false,
        message: "Format data tidak valid. Pastikan mengirim JSON yang benar.",
      });
    }

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Alasan pengarsipan wajib diisi",
      });
    }

    // Mendapatkan informasi dokumen SOP yang akan diarsipkan
    const sopDoc = await SopDoc.getSopDocById(sopId);
    if (!sopDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Dokumen SOP tidak ditemukan" });
    }

    // Membuat data arsip baru sesuai struktur tabel sop_archive
    const archiveData = {
      original_sop_id: sopId,
      title: sopDoc.title,
      description: JSON.stringify({
        goals: sopDoc.goals,
        scope: sopDoc.scope,
        definition: sopDoc.definition,
      }),
      version: sopDoc.version,
      status: sopDoc.status,
      created_by: sopDoc.created_by || userId, // ID pembuat dokumen asli
      archived_by: userId,
      archived_reason: reason,
      original_created_at: sopDoc.created_at || new Date(),
    };

    // Memasukkan data ke tabel arsip
    const result = await SopArchive.createArchive(archiveData);

    if (result) {
      // Mengupdate status dokumen menjadi diarsipkan
      await SopDoc.updateSopStatus(sopId, "archived");

      // Mencatat aktivitas pengarsipan
      await ActivityLog.logUserActivity(
        userId,
        req.user.name || "Unknown User",
        req.user.role || "user",
        "ARCHIVE",
        "SOP_DOCUMENT",
        `Mengarsipkan dokumen SOP: ${sopDoc.title} (${sopDoc.sop_code}) dengan alasan: ${reason}`,
        req,
        sopId,
        "sop_document"
      );

      res.status(200).json({
        success: true,
        message: "Dokumen SOP berhasil diarsipkan",
        data: { archiveId: result.insertId },
      });
    } else {
      throw new Error("Gagal mengarsipkan dokumen");
    }
  } catch (error) {
    console.error("❌ Error archiving SOP:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    console.error("Request params:", req.params);

    // Periksa jenis error untuk response yang lebih spesifik
    if (error.message && error.message.includes("JSON")) {
      return res.status(400).json({
        success: false,
        message: "Format data JSON tidak valid",
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengarsipkan dokumen",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Membuat fungsi untuk mengembalikan dokumen dari arsip ke status aktif
const restoreSopFromArchive = async (req, res) => {
  try {
    const { id: archiveId } = req.params; // Perbaiki dari archiveId ke id
    const { id: userId, role } = req.user;

    // Hanya admin atau admin_unit yang diperbolehkan melakukan restore
    if (role !== "admin" && role !== "admin_unit") {
      return res.status(403).json({
        success: false,
        message:
          "Hanya admin atau admin unit yang dapat melakukan restore dokumen",
      });
    }

    // Mendapatkan data arsip
    const archiveData = await SopArchive.getArchiveById(archiveId);
    if (!archiveData) {
      return res
        .status(404)
        .json({ success: false, message: "Data arsip tidak ditemukan" });
    }

    // Mengupdate status dokumen SOP menjadi aktif kembali
    await SopDoc.updateSopStatus(archiveData.original_sop_id, "published");

    // Menandai arsip sebagai dipulihkan (menghapus dari arsip)
    await SopArchive.markAsRestored(archiveId, userId);

    // Mencatat aktivitas pemulihan dokumen
    await ActivityLog.logUserActivity(
      userId,
      req.user.name || "Unknown User",
      req.user.role || "user",
      "RESTORE",
      "SOP_DOCUMENT",
      `Memulihkan dokumen SOP dari arsip: ${archiveData.title}`,
      req,
      archiveData.original_sop_id,
      "sop_document"
    );

    res.status(200).json({
      success: true,
      message: "Dokumen SOP berhasil dipulihkan dari arsip",
    });
  } catch (error) {
    console.error("Error restoring SOP from archive:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memulihkan dokumen dari arsip",
    });
  }
};

// Mengekspor semua fungsi controller yang dibuat
module.exports = {
  getAllArchivedDocs,
  getArchiveStats,
  archiveSop,
  restoreSopFromArchive,
};
