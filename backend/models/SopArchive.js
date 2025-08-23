// Import koneksi database dari config
const pool = require("../config/db");

/**
 * Model untuk operasi database tabel sop_archive
 * Menangani penyimpanan dan pengambilan dokumen SOP yang diarsipkan
 */
class SopArchive {
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
      description: sopDoc.organization,
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
    console.log("archiveDocument called with:", {
      sopData,
      archivedBy,
      reason,
    });

    // Konversi format sop_documents ke format archive
    const archiveData = this.convertSopDocToArchiveFormat(sopData);
    console.log("Converted archive data:", archiveData);

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

    // Gunakan archivedBy sebagai created_by karena info creator asli tidak tersedia
    // and archivedBy is guaranteed to exist (current authenticated user)
    const created_by = archivedBy;

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
    console.log("Executing archive query with params:", queryParams);

    const [result] = await pool.query(
      `INSERT INTO sop_archive 
       (original_sop_id, title, description, file_path, file_name, file_size, 
        version, category, status, created_by, archived_by, archived_reason, 
        original_created_at, archived_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      queryParams
    );

    console.log("Archive query result:", result);

    if (result.affectedRows === 1) {
      return {
        id: result.insertId,
        success: true,
        message: "Document archived successfully",
      };
    } else {
      throw new Error("Failed to archive document");
    }
  }

  // Get all archived documents
  static async getAllArchived() {
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

  // Restore archived document (replace current with archived version)
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

      // Get current document to archive it first
      const [currentRows] = await connection.query(
        "SELECT * FROM sop_documents WHERE id = ?",
        [archived.original_sop_id]
      );

      if (currentRows.length === 0) {
        throw new Error("Current document not found");
      }

      const current = currentRows[0];

      // Archive current version
      await connection.query(
        `INSERT INTO sop_archive 
         (original_sop_id, title, description, file_path, file_name, file_size, 
          version, category, status, created_by, archived_by, archived_reason, 
          original_created_at, archived_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          current.id,
          current.sop_title,
          current.organization,
          current.url,
          current.sop_title + ".pdf",
          null,
          current.sop_version,
          current.organization,
          current.status,
          current.created_by,
          restoredBy,
          "Replaced by restored version",
          current.created_at,
        ]
      );

      // Update current document with archived data
      await connection.query(
        `UPDATE sop_documents 
         SET sop_title = ?, url = ?, organization = ?, 
             sop_applicable = ?, sop_version = ?, status = ?, 
             updated_at = NOW()
         WHERE id = ?`,
        [
          archived.title,
          archived.file_path,
          archived.category,
          archived.original_created_at,
          archived.version,
          archived.status,
          archived.original_sop_id,
        ]
      );

      // Remove the restored version from archive
      await connection.query("DELETE FROM sop_archive WHERE id = ?", [
        archiveId,
      ]);

      await connection.commit();

      return {
        success: true,
        message: "Document restored successfully",
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get archive statistics
  static async getArchiveStats() {
    const [stats] = await pool.query(
      `SELECT 
        COUNT(*) as total_archived,
        COUNT(DISTINCT original_sop_id) as documents_with_archives,
        AVG(file_size) as avg_file_size
       FROM sop_archive`
    );

    const [recentArchives] = await pool.query(
      `SELECT 
        a.title,
        a.archived_at,
        u.name as archived_by_name
       FROM sop_archive a
       LEFT JOIN users u ON a.archived_by = u.id
       ORDER BY a.archived_at DESC
       LIMIT 5`
    );

    return {
      ...stats[0],
      recent_archives: recentArchives,
    };
  }
}

module.exports = SopArchive;
