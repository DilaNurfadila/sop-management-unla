// Import koneksi database dari config
const pool = require("../config/db");

/**
 * Model untuk operasi database tabel sop_archive
 * Menangani penyimpanan dan pengambilan dokumen SOP yang diarsipkan
 */
class SopArchive {
  /**
   * Mendapatkan semua dokumen yang diarsipkan
   * @returns {Promise<Array>} Array berisi semua dokumen yang diarsipkan
   */
  static async getAllArchivedDocs() {
    const [rows] = await pool.query(`
      SELECT 
        a.id,
        a.original_sop_id,
        a.title,
        a.description,
        a.version,
        a.status,
        a.created_by,
        a.archived_by,
  a.archived_reason as archived_reason,
        a.original_created_at,
        a.archived_at,
        u.name as archived_by_name, 
        creator.name as creator_name,
        creator.id as creator_id,
        sd.sop_code,
        sd.unit_scope,
        units.nama_unit as unit_scope_name
      FROM sop_archive a
      LEFT JOIN users u ON a.archived_by = u.id
      LEFT JOIN users creator ON a.created_by = creator.id
      LEFT JOIN sop_documents sd ON a.original_sop_id = sd.id
      LEFT JOIN units ON sd.unit_scope = units.id
      WHERE a.id IS NOT NULL
      ORDER BY a.archived_at DESC
    `);

    return rows;
  }

  /**
   * Mendapatkan data arsip berdasarkan ID
   * @param {number} id - ID arsip yang dicari
   * @returns {Promise<Object|null>} Object data arsip atau null jika tidak ditemukan
   */
  static async getArchiveById(id) {
    const [rows] = await pool.query(
      `
      SELECT a.*, u.name as archived_by_name, sd.sop_code
      FROM sop_archive a
      LEFT JOIN users u ON a.archived_by = u.id
      LEFT JOIN sop_documents sd ON a.original_sop_id = sd.id
      WHERE a.id = ?
    `,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Membuat entri arsip baru
   * @param {Object} archiveData - Data arsip yang akan dibuat
   * @returns {Promise<Object>} Result dari operasi insert
   */
  static async createArchive(archiveData) {
    const [result] = await pool.query(`INSERT INTO sop_archive SET ?`, [
      archiveData,
    ]);
    return result;
  }

  /**
   * Menandai arsip sebagai dipulihkan (pada implementasi ini, kita akan menghapus dari arsip)
   * @param {number} id - ID arsip yang akan ditandai
   * @param {number} restoredBy - ID user yang memulihkan
   * @returns {Promise<Object>} Result dari operasi delete
   */
  static async markAsRestored(id, restoredBy) {
    // Karena tabel sop_archive tidak memiliki kolom is_restored,
    // kita akan menghapus entry dari arsip sebagai tanda bahwa dokumen telah dipulihkan
    const [result] = await pool.query(`DELETE FROM sop_archive WHERE id = ?`, [
      id,
    ]);
    return result;
  }

  /**
   * Mendapatkan statistik arsip
   * @param {string} userRole - Role user (admin, admin_unit, user)
   * @param {string} userUnit - Unit kerja user
   * @returns {Promise<Object>} Object berisi statistik arsip
   */
  static async getArchiveStats(userRole = null, userUnit = null) {
    // Base query conditions berdasarkan role dan unit
    let whereCondition = "";
    let params = [];

    // Jika bukan admin, filter berdasarkan unit
    if (userRole !== "admin") {
      whereCondition = "WHERE sd.unit_scope = ?";
      params.push(userUnit);
    }

    // Total dokumen yang diarsipkan
    const archiveQuery =
      userRole === "admin"
        ? `SELECT COUNT(*) as total FROM sop_archive`
        : `SELECT COUNT(*) as total FROM sop_archive sa
         LEFT JOIN sop_documents sd ON sa.original_sop_id = sd.id
         ${whereCondition}`;

    const [totalArchived] = await pool.query(archiveQuery, params);

    // Total dokumen aktif (tidak diarsipkan)
    const activeQuery =
      userRole === "admin"
        ? `SELECT COUNT(*) as total FROM sop_documents 
         WHERE status NOT IN ('archived', 'deleted')`
        : `SELECT COUNT(*) as total FROM sop_documents 
         WHERE status NOT IN ('archived', 'deleted') AND unit_scope = ?`;

    const activeParams = userRole === "admin" ? [] : [userUnit];
    const [totalActive] = await pool.query(activeQuery, activeParams);

    // Dokumen unik yang memiliki arsip
    const documentsQuery =
      userRole === "admin"
        ? `SELECT COUNT(DISTINCT original_sop_id) as total FROM sop_archive`
        : `SELECT COUNT(DISTINCT sa.original_sop_id) as total FROM sop_archive sa
         LEFT JOIN sop_documents sd ON sa.original_sop_id = sd.id
         ${whereCondition}`;

    const [documentsWithArchives] = await pool.query(documentsQuery, params);

    // Arsip terbaru (30 hari terakhir)
    const recentQuery =
      userRole === "admin"
        ? `SELECT sa.*, sd.title as original_title, u.name as archived_by_name
         FROM sop_archive sa
         LEFT JOIN sop_documents sd ON sa.original_sop_id = sd.id
         LEFT JOIN users u ON sa.archived_by = u.id
         WHERE sa.archived_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
         ORDER BY sa.archived_at DESC
         LIMIT 10`
        : `SELECT sa.*, sd.title as original_title, u.name as archived_by_name
         FROM sop_archive sa
         LEFT JOIN sop_documents sd ON sa.original_sop_id = sd.id
         LEFT JOIN users u ON sa.archived_by = u.id
         WHERE sa.archived_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND sd.unit_scope = ?
         ORDER BY sa.archived_at DESC
         LIMIT 10`;

    const recentParams = userRole === "admin" ? [] : [userUnit];
    const [recentArchives] = await pool.query(recentQuery, recentParams);

    return {
      total_archived: totalArchived[0].total,
      total_active: totalActive[0].total,
      documents_with_archives: documentsWithArchives[0].total,
      recent_archives: recentArchives,
    };
  }
  /**
   * Constructor untuk membuat instance SopArchive
   * @param {string} title - Judul dokumen yang diarsipkan
   * @param {string} description - Deskripsi dokumen arsip
   * @param {string} filePath - Path file dokumen di storage
   * @param {string} fileName - Nama file dokumen
   * @param {number} fileSize - Ukuran file dalam bytes (opsional)
   * @param {string} version - Versi dokumen yang diarsipkan
   * @param {string} category - Kategori dokumen arsip
   * @param {string} status - Status dokumen saat diarsipkan
   * @param {number} createdBy - ID pengguna yang melakukan arsip
   * @param {string} reason - Alasan pengarsipan dokumen
   */
  constructor(
    title,
    description,
    filePath,
    fileName,
    version,
    category,
    status,
    createdBy,
    reason,
    fileSize = null
  ) {
    // Menyimpan judul dokumen yang diarsipkan
    this.title = title;
    // Menyimpan deskripsi dokumen arsip
    this.description = description;
    // Menyimpan path file dokumen di storage
    this.file_path = filePath;
    // Menyimpan nama file dokumen
    this.file_name = fileName;
    // Menyimpan ukuran file dalam bytes
    this.file_size = fileSize;
    // Menyimpan versi dokumen yang diarsipkan
    this.version = version;
    // Menyimpan kategori dokumen untuk pengelompokan
    this.category = category;
    // Menyimpan status dokumen saat diarsipkan
    this.status = status;
    // Menyimpan ID pengguna yang melakukan arsip
    this.created_by = createdBy;
    // Menyimpan alasan pengarsipan dokumen
    this.reason = reason;
  }

  /**
   * Helper function untuk mengkonversi struktur sop_documents ke format archive
   * @param {Object} sopDoc - Object dokumen SOP dari tabel sop_documents
   * @returns {Object} - Object dengan format yang sesuai untuk tabel sop_archive
   */
  static convertSopDocToArchiveFormat(sopDoc) {
    return {
      id: sopDoc.id,
      title: sopDoc.sop_title,
      description: JSON.stringify({
        organization: sopDoc.organization,
        sop_code: sopDoc.sop_code,
        sop_applicable: sopDoc.sop_applicable,
      }), // Store structured data as JSON
      file_path: sopDoc.url,
      file_name: sopDoc.sop_title ? `${sopDoc.sop_title}.pdf` : "document.pdf",
      file_size: null, // Tidak disimpan di tabel sop_documents
      version: sopDoc.sop_version,
      category: sopDoc.organization,
      status: sopDoc.status,
      created_by: null, // Akan diset ke archivedBy di function archiveDocument
      created_at: sopDoc.created_at,
    };
  }

  /**
   * Pindahkan dokumen ke arsip (move dari sop_documents ke sop_archive)
   * @param {Object} sopData - Data dokumen SOP yang akan diarsipkan
   * @param {number} archivedBy - ID user yang melakukan pengarsipan
   * @param {string} reason - Alasan arsip (default: "Document archived")
   * @returns {Object} - Result dari operasi arsip
   */
  static async moveToArchiveOnDelete(
    sopData,
    archivedBy,
    reason = "Document archived"
  ) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Konversi format sop_documents ke format archive
      const archiveData = this.convertSopDocToArchiveFormat(sopData);

      // Destruktur data yang sudah dikonversi
      const {
        id,
        title,
        description,
        file_path,
        file_name,
        file_size,
        version,
        category,
        status,
        created_at,
      } = archiveData;

      // Gunakan archivedBy sebagai archived_by, dan tetap pakai original creator
      const created_by = sopData.user_id || archivedBy;
      const archived_by = archivedBy;

      const queryParams = [
        id,
        title,
        description,
        file_path,
        file_name,
        file_size,
        version,
        category,
        status,
        created_by,
        archived_by,
        reason,
        created_at,
      ];

      // Step 1: INSERT ke tabel sop_archive
      const [archiveResult] = await connection.query(
        `INSERT INTO sop_archive 
         (original_sop_id, title, description, file_path, file_name, file_size, 
          version, category, status, created_by, archived_by, archived_reason, 
          original_created_at, archived_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        queryParams
      );

      // Step 2: DELETE dari tabel sop_documents
      const [deleteResult] = await connection.query(
        "DELETE FROM sop_documents WHERE id = ?",
        [id]
      );

      await connection.commit();

      if (archiveResult.affectedRows === 1 && deleteResult.affectedRows === 1) {
        return {
          id: archiveResult.insertId,
          success: true,
          message: "Document moved to archive successfully",
        };
      } else {
        throw new Error("Failed to move document to archive");
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Arsipkan dokumen lama ketika dokumen diupdate dengan versi baru
   * @param {Object} sopData - Data dokumen SOP yang akan diarsipkan
   * @param {number} archivedBy - ID user yang melakukan arsip
   * @param {string} reason - Alasan arsip (default: "Document updated")
   * @returns {Object} - Result dari operasi arsip
   */
  static async archiveDocument(
    sopData,
    archivedBy,
    reason = "Document updated"
  ) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Konversi format sop_documents ke format archive
      const archiveData = this.convertSopDocToArchiveFormat(sopData); // Destruktur data yang sudah dikonversi
      const {
        id,
        title,
        description,
        file_path,
        file_name,
        file_size,
        version,
        category,
        status,
        created_at,
      } = archiveData;

      // Gunakan archivedBy sebagai created_by karena info creator asli tidak tersedia
      const created_by = sopData.user_id || archivedBy;

      const queryParams = [
        id,
        title,
        description,
        file_path,
        file_name,
        file_size,
        version,
        category,
        status,
        created_by,
        archivedBy,
        reason,
        created_at,
      ];
      const [result] = await connection.query(
        `INSERT INTO sop_archive 
         (original_sop_id, title, description, file_path, file_name, file_size, 
          version, category, status, created_by, archived_by, archived_reason, 
          original_created_at, archived_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        queryParams
      );

      await connection.commit();
      if (result.affectedRows === 1) {
        return {
          id: result.insertId,
          success: true,
          message: "Document archived successfully",
        };
      } else {
        throw new Error("Failed to archive document");
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get all archived documents
  static async getAllArchived() {
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        u1.name as created_by_name,
        u2.name as archived_by_name
       FROM sop_archive a
       LEFT JOIN users u1 ON a.created_by = u1.id
       LEFT JOIN users u2 ON a.archived_by = u2.id
       ORDER BY a.archived_at DESC`
    );
    return rows;
  }

  // Get archived versions of specific document
  static async getArchivedVersions(originalSopId) {
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        u1.name as created_by_name,
        u2.name as archived_by_name
       FROM sop_archive a
       LEFT JOIN users u1 ON a.created_by = u1.id
       LEFT JOIN users u2 ON a.archived_by = u2.id
       WHERE a.original_sop_id = ?
       ORDER BY a.archived_at DESC`,
      [originalSopId]
    );
    return rows;
  }

  // Get specific archived document
  static async getArchivedById(archiveId) {
    const [rows] = await pool.query(
      `SELECT 
        a.*,
        u1.name as created_by_name,
        u2.name as archived_by_name,
        s.sop_title as current_title
       FROM sop_archive a
       LEFT JOIN users u1 ON a.created_by = u1.id
       LEFT JOIN users u2 ON a.archived_by = u2.id
       LEFT JOIN sop_documents s ON a.original_sop_id = s.id
       WHERE a.id = ?`,
      [archiveId]
    );
    return rows[0];
  }

  // Delete archived document permanently
  static async deleteArchived(archiveId) {
    const [result] = await pool.query("DELETE FROM sop_archive WHERE id = ?", [
      archiveId,
    ]);

    if (result.affectedRows === 1) {
      return {
        success: true,
        message: "Archived document deleted permanently",
      };
    } else {
      throw new Error("Failed to delete archived document");
    }
  }

  // Restore archived document (move from archive back to main table)
  static async restoreDocument(archiveId, restoredBy) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get archived document
      const [archivedRows] = await connection.query(
        "SELECT * FROM sop_archive WHERE id = ?",
        [archiveId]
      );

      if (archivedRows.length === 0) {
        throw new Error("Archived document not found");
      }

      const archived = archivedRows[0];

      // Check if this is a restore from file update or full document restore
      const [existingRows] = await connection.query(
        "SELECT * FROM sop_documents WHERE id = ?",
        [archived.original_sop_id]
      );

      if (existingRows.length > 0) {
        // Document exists - this is a file restore (replace stored link)
        // Step 1: INSERT/UPDATE ke sop_documents (tukar URL dari archive ke documents)
        await connection.query(
          `UPDATE sop_documents 
           SET url = ?, sop_version = ?, updated_at = NOW()
           WHERE id = ?`,
          [
            archived.file_path, // URL dari archive menggantikan URL di documents
            archived.version,
            archived.original_sop_id,
          ]
        );
      } else {
        // Document doesn't exist - full restore (recreate document)
        // Parse stored data from description field
        let storedData = {};
        try {
          storedData = JSON.parse(archived.description || "{}");
        } catch (e) {
          // Fallback for old format
          storedData = {
            organization: archived.category || "Unknown",
            sop_code: `RESTORED_${archived.original_sop_id}`,
            sop_applicable: "2025-01-01",
          };
        }

        // Step 1: INSERT ke sop_documents with all required fields
        await connection.query(
          `INSERT INTO sop_documents 
           (id, sop_code, sop_title, organization, sop_applicable, url, sop_version, status, user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            archived.original_sop_id,
            storedData.sop_code || `RESTORED_${archived.original_sop_id}`,
            archived.title,
            storedData.organization || archived.category,
            storedData.sop_applicable
              ? new Date(storedData.sop_applicable).toISOString().split("T")[0]
              : "2025-01-01",
            archived.file_path,
            archived.version,
            "draft", // Set status to draft when restored
            archived.created_by || restoredBy,
            archived.original_created_at,
          ]
        );
      }

      // Step 2: DELETE dari sop_archive (setelah INSERT/UPDATE berhasil)
      await connection.query("DELETE FROM sop_archive WHERE id = ?", [
        archiveId,
      ]);

      await connection.commit();

      return {
        success: true,
        message: "Document restored successfully",
        documentId: archived.original_sop_id,
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = SopArchive;
