// Mengimpor model SopArchive untuk operasi database arsip dokumen
const SopArchive = require("../models/SopArchive");
// Mengimpor model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog");
// Mengimpor axios untuk HTTP requests ke Firebase Storage
const axios = require("axios");

/**
 * Helper function untuk logging aktivitas archive
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (CREATE, VIEW, DOWNLOAD, DELETE, RESTORE)
 * @param {string} description - Deskripsi aktivitas yang dilakukan
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target objek yang dikenai aktivitas (opsional)
 */
const logArchiveActivity = async (
  user,
  action,
  description,
  req,
  targetData = null
) => {
  try {
    // Pastikan user ID ada, gunakan system user (ID 32) sebagai fallback
    // ID 32 adalah ID system user untuk memenuhi foreign key constraint
    const userId = user?.id || 32;
    const userName = user?.name || user?.email || "Unknown User";
    const userRole = user?.role || "user";

    // Pastikan parameter aksi dan deskripsi tidak undefined
    const actionStr = action || "UNKNOWN";
    const descriptionStr = description || "No description";

    // Memanggil method logUserActivity untuk menyimpan log
    await ActivityLog.logUserActivity(
      userId, // ID pengguna
      userName, // Nama pengguna
      userRole, // Role pengguna
      actionStr, // Jenis aksi
      "ARCHIVE", // Modul sistem (selalu ARCHIVE untuk controller ini)
      descriptionStr, // Deskripsi aktivitas
      req, // Request object untuk IP dan User Agent
      targetData?.id || null, // ID target objek (jika ada)
      targetData ? "archive" : null // Tipe target objek
    );
  } catch (error) {
    // Log error untuk debugging, tapi tidak mengganggu proses utama
    console.error("Error logging archive activity:", error.message);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

// Cache untuk mencegah duplikasi logging dalam waktu singkat
// Menggunakan Map untuk menyimpan timestamp terakhir logging per user
const recentViewLogs = new Map();

/**
 * Controller untuk mendapatkan semua dokumen yang diarsipkan
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getAllArchived = async (req, res) => {
  try {
    // Mengambil semua dokumen arsip dari database
    const archivedDocs = await SopArchive.getAllArchived();

    // Log aktivitas melihat daftar arsip dengan rate limiting
    if (req.user) {
      const userId = req.user.id; // ID pengguna yang mengakses
      const now = Date.now(); // Timestamp saat ini
      const cacheKey = `${userId}_VIEW_ARCHIVE`; // Key unik per user

      // Cek apakah sudah ada log dalam 30 detik terakhir untuk user yang sama
      const lastLogTime = recentViewLogs.get(cacheKey);
      const shouldLog = !lastLogTime || now - lastLogTime > 30000; // 30 detik cooldown

      if (shouldLog) {
        // Import database connection untuk mendapatkan nama user
        const db = require("../config/db");
        // Query untuk mendapatkan nama pengguna berdasarkan ID
        const [userRows] = await db.execute(
          "SELECT name FROM users WHERE id = ?",
          [userId] // Parameter ID pengguna
        );
        // Ambil nama dari hasil query, fallback ke email atau "Unknown User"
        const userName = userRows[0]?.name || req.user?.email || "Unknown User";

        // Log aktivitas mengakses daftar arsip
        await logArchiveActivity(
          req.user, // Data pengguna yang mengakses
          "VIEW", // Jenis aksi yang dilakukan
          `${userName} mengakses daftar dokumen arsip (${archivedDocs.length} dokumen)`,
          req, // Request object
          null, // Tidak ada target data spesifik
          userName // Nama pengguna yang sudah di-resolve
        );

        // Update cache dengan timestamp saat ini untuk rate limiting
        recentViewLogs.set(cacheKey, now);

        // Cleanup cache entries yang sudah lama (lebih dari 5 menit)
        // Ini mencegah memory leak dari cache yang terus bertambah
        for (const [key, time] of recentViewLogs.entries()) {
          if (now - time > 300000) {
            // 5 menit = 300000 ms
            recentViewLogs.delete(key); // Hapus entry yang sudah expired
          }
        }
      }
    }

    // Mengembalikan data arsip dokumen ke client
    res.json(archivedDocs);
  } catch (error) {
    // Log error untuk debugging
    console.error("Error fetching archived documents:", error);
    // Kirim response error ke client
    res.status(500).json({ message: "Gagal mengambil data arsip" });
  }
};

/**
 * Controller untuk mendapatkan versi-versi arsip dari dokumen SOP tertentu
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getArchivedVersions = async (req, res) => {
  try {
    // Mengambil ID SOP dari parameter URL
    const { sopId } = req.params;
    // Mencari semua versi arsip berdasarkan ID SOP
    const archivedVersions = await SopArchive.getArchivedVersions(sopId);
    // Mengembalikan data versi arsip ke client
    res.json(archivedVersions);
  } catch (error) {
    // Log error untuk debugging
    console.error("Error fetching archived versions:", error);
    // Kirim response error ke client
    res.status(500).json({ message: "Gagal mengambil versi arsip" });
  }
};

/**
 * Controller untuk mendapatkan detail dokumen arsip berdasarkan ID
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getArchivedById = async (req, res) => {
  try {
    // Mengambil ID dokumen arsip dari parameter URL
    const { id } = req.params;
    // Mencari dokumen arsip berdasarkan ID
    const archivedDoc = await SopArchive.getArchivedById(id);

    // Cek apakah dokumen ditemukan
    if (!archivedDoc) {
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    // Mengembalikan detail dokumen arsip ke client
    res.json(archivedDoc);
  } catch (error) {
    // Log error untuk debugging
    console.error("Error fetching archived document:", error);
    // Kirim response error ke client
    res.status(500).json({ message: "Gagal mengambil dokumen arsip" });
  }
};

/**
 * Controller untuk download file dokumen arsip
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.downloadArchivedFile = async (req, res) => {
  try {
    // Mengambil ID dokumen arsip dari parameter URL
    const { id } = req.params;
    console.log("Download request for archive ID:", id);

    // Mencari dokumen arsip berdasarkan ID
    const archivedDoc = await SopArchive.getArchivedById(id);

    // Cek apakah dokumen arsip ditemukan
    if (!archivedDoc) {
      console.log("Archive document not found for ID:", id);
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    console.log("Archived doc data:", archivedDoc);
    console.log("File path (Firebase URL):", archivedDoc.file_path);

    // Cek apakah file path (URL Firebase) tersedia
    if (!archivedDoc.file_path) {
      console.log("File path is empty for archive ID:", id);
      return res
        .status(404)
        .json({ message: "URL file arsip tidak ditemukan" });
    }

    console.log("Fetching file from Firebase Storage...");

    // Menggunakan axios untuk mengambil file dari Firebase Storage
    // responseType: "stream" agar bisa di-pipe langsung ke response
    const response = await axios.get(archivedDoc.file_path, {
      responseType: "stream",
    });

    console.log("Firebase response received, status:", response.status);
    console.log(
      "Content-Type from Firebase:",
      response.headers["content-type"]
    );
    console.log(
      "Content-Length from Firebase:",
      response.headers["content-length"]
    );

    // Set headers yang sesuai untuk download PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${
        archivedDoc.file_name || "archived-document.pdf" // Nama file default jika tidak ada
      }"`
    );

    // Set Content-Length jika tersedia dari Firebase response
    if (response.headers["content-length"]) {
      res.setHeader("Content-Length", response.headers["content-length"]);
    }

    console.log("Piping response to client...");

    // Log aktivitas download arsip (jika user terautentikasi)
    if (req.user) {
      // Import database connection untuk mendapatkan nama user
      const db = require("../config/db");
      // Query untuk mendapatkan nama pengguna
      const [userRows] = await db.execute(
        "SELECT name FROM users WHERE id = ?",
        [req.user.id] // Parameter ID pengguna
      );
      // Resolve nama pengguna dengan fallback
      const userName = userRows[0]?.name || req.user?.email || "Unknown User";

      // Log aktivitas download
      await logArchiveActivity(
        req.user, // Data pengguna yang download
        "DOWNLOAD", // Jenis aksi
        `${userName} mengunduh file arsip: ${
          archivedDoc.file_name || archivedDoc.title // Nama file yang didownload
        }`,
        req, // Request object
        { id: archivedDoc.id }, // ID dokumen arsip sebagai target
        userName // Nama pengguna yang sudah di-resolve
      );
    }

    // Pipe stream dari Firebase langsung ke response client
    // Ini efisien karena tidak perlu load seluruh file ke memory
    response.data.pipe(res);
  } catch (error) {
    // Log error detail untuk debugging
    console.error("Error downloading archived file:", error.message);
    console.error(
      "Error details:",
      error.response?.status, // HTTP status dari Firebase
      error.response?.statusText // Status text dari Firebase
    );

    // Handle error 404 dari Firebase (file tidak ditemukan)
    if (error.response && error.response.status === 404) {
      return res
        .status(404)
        .json({ message: "File tidak ditemukan di Firebase Storage" });
    }

    // Kirim generic error response untuk error lainnya
    res.status(500).json({ message: "Gagal mengunduh file arsip" });
  }
};

/**
 * Controller untuk restore dokumen dari arsip kembali ke dokumen aktif
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.restoreDocument = async (req, res) => {
  try {
    // Mengambil ID dokumen arsip dari parameter URL
    const { id } = req.params;
    // ID pengguna yang melakukan restore
    const restoredBy = req.user.id;

    // Ambil data arsip sebelum restore untuk logging dan validasi
    const archivedDoc = await SopArchive.getArchivedById(id);
    if (!archivedDoc) {
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    // Menjalankan proses restore dokumen
    const result = await SopArchive.restoreDocument(id, restoredBy);

    // Ambil nama pengguna dari database untuk logging
    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id, // Parameter ID pengguna
    ]);
    const userName = userRows[0]?.name || req.user?.email || "Unknown User";

    // Log aktivitas restore dokumen
    // Log aktivitas restore dokumen
    await logArchiveActivity(
      req.user, // Data pengguna yang melakukan restore
      "RESTORE", // Jenis aksi
      `${userName} mengembalikan dokumen dari arsip: ${archivedDoc.title}`,
      req, // Request object
      { id: archivedDoc.id }, // ID dokumen arsip sebagai target
      userName // Nama pengguna yang sudah di-resolve
    );

    // Mengembalikan hasil restore ke client
    res.json(result);
  } catch (error) {
    // Log error untuk debugging
    console.error("Error restoring document:", error);
    // Kirim response error ke client
    res.status(500).json({
      message: error.message || "Gagal mengembalikan dokumen",
    });
  }
};

/**
 * Controller untuk menghapus dokumen arsip secara permanen
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.deleteArchived = async (req, res) => {
  try {
    // Mengambil ID dokumen arsip dari parameter URL
    const { id } = req.params;

    // Ambil informasi dokumen arsip sebelum dihapus (untuk logging dan cleanup file)
    const archivedDoc = await SopArchive.getArchivedById(id);

    // Cek apakah dokumen arsip ditemukan
    if (!archivedDoc) {
      return res.status(404).json({ message: "Dokumen arsip tidak ditemukan" });
    }

    // Hapus record dari database
    const result = await SopArchive.deleteArchived(id);

    // Ambil nama pengguna dari database untuk logging
    const db = require("../config/db");
    const [userRows] = await db.execute("SELECT name FROM users WHERE id = ?", [
      req.user.id, // Parameter ID pengguna
    ]);
    const userName = userRows[0]?.name || req.user?.email || "Unknown User";

    // Log aktivitas penghapusan arsip
    await logArchiveActivity(
      req.user, // Data pengguna yang menghapus
      "DELETE", // Jenis aksi
      `${userName} menghapus dokumen arsip: ${archivedDoc.title}`,
      req, // Request object
      { id: archivedDoc.id }, // ID dokumen arsip sebagai target
      userName // Nama pengguna yang sudah di-resolve
    );

    // Coba hapus file fisik (opsional, tidak gagal jika file tidak ada)
    // Note: Ini mungkin tidak diperlukan jika menggunakan Firebase Storage
    try {
      const filePath = path.join(__dirname, "..", archivedDoc.file_path);
      await fs.unlink(filePath); // Hapus file dari filesystem lokal
    } catch (fileError) {
      // Log warning tapi tidak stop proses jika file tidak bisa dihapus
      console.warn("Could not delete archived file:", fileError.message);
    }

    // Mengembalikan hasil penghapusan ke client
    res.json(result);
  } catch (error) {
    // Log error untuk debugging
    console.error("Error deleting archived document:", error);
    // Kirim response error ke client
    res.status(500).json({ message: "Gagal menghapus dokumen arsip" });
  }
};

exports.getArchiveStats = async (req, res) => {
  try {
    const stats = await SopArchive.getArchiveStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching archive stats:", error);
    res.status(500).json({ message: "Gagal mengambil statistik arsip" });
  }
};
