// Import konfigurasi database connection pool
const pool = require("../config/db");
const {
  STATUS,
  REVIEW_STATUS,
  VERSION_TYPE,
} = require("../constants/sopStatus");

/**
 * Class untuk mengelola operasi database SOP Documents
 * Menangani CRUD operations untuk dokumen SOP sesuai schema baru
 */
class SopDoc {
  /**
   * Constructor untuk membuat instance SopDoc sesuai struktur sop_documents baru
   * @param {string} sopCode - Kode unik dokumen SOP
   * @param {string} version - Versi dokumen SOP
   * @param {string} title - Judul dokumen SOP
   * @param {string} goals - Tujuan SOP (opsional)
   * @param {string} scope - Ruang lingkup SOP (opsional)
   * @param {string} unitScope - Ruang lingkup unit kerja SOP (opsional)
   * @param {string} definition - Definisi/pengertian SOP (opsional)
   * @param {string} sopReference - Referensi SOP (opsional)
   * @param {string} procedureDescription - Deskripsi prosedur SOP (opsional)
   * @param {string} status - Status dokumen (draft, published, archived)
   * @param {number} assignment_id - ID assignment untuk tracking SOP dari penugasan (opsional)
   */
  constructor(
    sopCode,
    version,
    title,
    goals = null,
    scope = null,
    unitScope = null,
    definition = null,
    sopReference = null,
    procedureDescription = null,
    status = "draft",
    assignment_id = null
  ) {
    this.sop_code = sopCode;
    this.version = version;
    this.title = title;
    this.title = title;
    this.goals = goals;
    this.scope = scope;
    this.unit_scope = unitScope;
    this.definition = definition;
    this.sop_reference = sopReference;
    this.procedure_description = procedureDescription;
    this.status = status;
    this.assignment_id = assignment_id;
  }

  /**
   * Method untuk menyimpan dokumen SOP baru ke database
   * @returns {Object} - Hasil insert dengan ID baru
   */
  async save() {
    const [result] = await pool.query(
      "INSERT INTO sop_documents (sop_code, version, title, goals, scope, unit_scope, definition, sop_reference, procedure_description, status, assignment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        this.sop_code,
        this.version,
        this.title,
        this.goals,
        this.scope,
        this.unit_scope,
        this.definition,
        this.sop_reference,
        this.procedure_description,
        this.status,
        this.assignment_id,
      ]
    );
    return { id: result.insertId, ...this };
  }

  /**
   * Helper method untuk mendapatkan informasi user berdasarkan user_id
   * @param {number} userId - ID user yang akan dicari
   * @returns {Object|null} - Object user atau null jika tidak ditemukan
   */
  static async getUserById(userId) {
    if (!userId) return null;

    try {
      const [rows] = await pool.query(
        "SELECT id, name, email FROM users WHERE id = ?",
        [userId]
      );
      return rows[0] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Method untuk mengambil semua dokumen SOP dari database dengan filter permission
   * Draft documents hanya terlihat oleh creator, published/approved terlihat semua
   * @param {number} userId - ID user yang sedang login
   * @param {string} userRole - Role user yang sedang login
   * @returns {Array} - Array dokumen SOP dengan informasi uploader
   */
  static async findAllSopDocWithPermission(userId, userRole) {
    let query = `
      SELECT 
        d.*,
        COALESCE(creator.name, 'Unknown Creator') AS uploader_name,
        COALESCE(ar.approval_date, d.created_at) AS created_date,
        'Universitas Langlangbuana' AS organization,
        unit_scope_tbl.nama_unit AS unit_scope_name
      FROM sop_documents d
      LEFT JOIN sop_approval_roles ar 
        ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
      LEFT JOIN users creator ON ar.user_id = creator.id
      LEFT JOIN units unit_scope_tbl 
        ON d.unit_scope = unit_scope_tbl.id
      WHERE 
    `;

    let params = [];

    if (userRole === "admin" || userRole === "admin_unit") {
      // Admin dan admin_unit dapat melihat semua dokumen
      query += `1 = 1`;
    } else {
      // User biasa hanya dapat melihat:
      // 1. Draft documents yang mereka buat sendiri
      // 2. HANYA Published documents dari siapapun (bukan unpublished/approved)
      query += `
        (d.status = 'draft' AND ar.user_id = ?) OR
        (d.status = 'published')
      `;
      params.push(userId);
    }

    query += ` ORDER BY d.created_at DESC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  /**
   * Method untuk mengambil semua dokumen SOP dari database
   * @returns {Array} - Array dokumen SOP dengan informasi uploader
   */
  static async findAllSopDoc() {
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        COALESCE(creator.name, 'Unknown Creator') AS uploader_name,
        COALESCE(ar.approval_date, d.created_at) AS created_date,
        'Universitas Langlangbuana' AS organization,
        unit_scope_tbl.nama_unit AS unit_scope_name
      FROM sop_documents d
      LEFT JOIN sop_approval_roles ar 
        ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
      LEFT JOIN users creator ON ar.user_id = creator.id
      LEFT JOIN units unit_scope_tbl 
        ON d.unit_scope = unit_scope_tbl.id
      ORDER BY d.created_at DESC
    `);
    return rows;
  }

  /**
   * Method untuk mengambil SOP dengan struktur query spesifik yang diinginkan
   * @returns {Array} - Array SOP dengan format: id, title, creator, created_date
   */
  static async getAllSOPWithCreator() {
    const [rows] = await pool.query(`
      SELECT 
        d.id, 
        d.title, 
        creator.name AS creator, 
        ar.approval_date AS created_date
      FROM sop_documents d
      LEFT JOIN sop_approval_roles ar 
        ON d.id = ar.sop_doc_id 
        AND ar.role = 'Creator'
      LEFT JOIN users creator ON ar.user_id = creator.id
      ORDER BY d.created_at DESC
    `);
    return rows;
  }

  /**
   * Method untuk mengambil dokumen SOP yang sudah dipublikasi
   * @returns {Array} - Array dokumen SOP published
   */
  static async findPublishedSopDocs() {
    const [rows] = await pool.query(`
      SELECT 
        d.*,
        COALESCE(creator.name, 'Unknown Creator') AS uploader_name,
        COALESCE(ar.approval_date, d.created_at) AS created_date,
        unit_scope_tbl.nama_unit AS unit_scope_name
      FROM sop_documents d
      LEFT JOIN sop_approval_roles ar 
        ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
      LEFT JOIN users creator ON ar.user_id = creator.id
      LEFT JOIN units unit_scope_tbl 
        ON d.unit_scope = unit_scope_tbl.id
      WHERE d.status = 'published' 
      ORDER BY d.sop_code ASC
    `);
    return rows;
  }

  /**
   * Method untuk mencari dokumen SOP berdasarkan ID
   * @param {number} id - ID dokumen yang akan dicari
   * @returns {Object|null} - Dokumen SOP dengan informasi uploader atau null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT 
        d.*,
        COALESCE(creator.name, 'Unknown Creator') AS uploader_name,
        approver_role.approval_date AS creation_date,
        d.sop_applicable AS effective_date,
        d.revision_date,
        COALESCE(approver_role.approval_date, d.created_at) AS created_date,
        u.nama_unit AS unit_name,
        u.kode_unit AS unit_code,
        'Universitas Langlangbuana' AS organization,
        d.unit_scope,
        unit_scope_tbl.nama_unit AS unit_scope_name,
        reviewer.id AS reviewer_id,
        reviewer.name AS reviewer_name,
        approver.id AS approver_id,
        approver.name AS approver_name,
        approver.position AS approver_position,
        d.qr_checksum,
        d.approved_by,
        d.approval_date
      FROM sop_documents d
      LEFT JOIN sop_approval_roles ar 
        ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
      LEFT JOIN users creator ON ar.user_id = creator.id
      LEFT JOIN units u 
        ON ar.unit_id = u.id
      LEFT JOIN units unit_scope_tbl 
        ON d.unit_scope = unit_scope_tbl.id
      LEFT JOIN sop_approval_roles reviewer_role 
        ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
      LEFT JOIN users reviewer ON reviewer_role.user_id = reviewer.id
      LEFT JOIN sop_approval_roles approver_role 
        ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
      LEFT JOIN users approver ON approver_role.user_id = approver.id
      WHERE d.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Method untuk generate version SOP otomatis
   * @param {string} sopTitle - Judul SOP yang akan dicek versionnya
   * @param {string} versionType - 'major' atau 'minor', default 'minor'
   * @returns {string} - Generated version
   */
  // static async generateVersion(sopTitle, versionType = "minor") {
  //   try {
  //     const [rows] = await pool.query(
  //       `SELECT version FROM sop_documents
  //         WHERE title = ?
  //         ORDER BY CAST(SUBSTRING_INDEX(version, '.', 1) AS UNSIGNED) DESC,
  //                  CAST(SUBSTRING_INDEX(version, '.', -1) AS UNSIGNED) DESC
  //         LIMIT 1`,
  //       [sopTitle]
  //     );

  //     if (rows.length === 0) {
  //       return "1.0";
  //     }

  //     const lastVersion = rows[0].version;
  //     const [major, minor] = lastVersion.split(".").map(Number);

  //     if (versionType === "major") {
  //       return `${major + 1}.0`;
  //     } else {
  //       return `${major}.${minor + 1}`;
  //     }
  //   } catch (error) {
  //     return "1.0";
  //   }
  // }

  /**
   * Method untuk generate SOP Code berdasarkan unit user
   * Format: SOP-{nomor_unit}/{kode_unit}/{MM}/{YYYY}/{sequence_number}
   * @param {number} userId - ID user yang membuat SOP
   * @returns {string} - Generated SOP Code
   */
  static async generateSopCode(userId) {
    try {
      const [userRows] = await pool.query(
        `SELECT u.nomor_unit, u.kode_unit 
          FROM users us 
          LEFT JOIN units u ON us.unit = u.id 
          WHERE us.id = ?`,
        [userId]
      );

      if (!userRows[0]) {
        throw new Error("User atau unit tidak ditemukan");
      }

      const { nomor_unit, kode_unit } = userRows[0];

      const unitNumber = nomor_unit || "001";
      const unitCode = kode_unit || "UNLA";

      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();

      const [existingCount] = await pool.query(
        `SELECT COUNT(*) as count 
          FROM sop_documents 
          WHERE sop_code LIKE ? 
          AND MONTH(created_at) = ? 
          AND YEAR(created_at) = ?`,
        [`SOP-${unitNumber}/${unitCode}/${month}/${year}%`, month, year]
      );

      const sequenceNumber = String(existingCount[0].count + 1).padStart(
        3,
        "0"
      );

      const sopCode = `SOP-${unitNumber}/${unitCode}/${month}/${year}/${sequenceNumber}`;

      return sopCode;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method untuk approve SOP dan generate SOP Code
   * @param {number} id - ID SOP yang akan di-approve
   * @param {number} userId - ID user yang approve
   * @returns {Object} - Updated SOP document
   */
  static async approveSop(id, userId) {
    try {
      const sopCode = await this.generateSopCode(userId);

      const [result] = await pool.query(
        `UPDATE sop_documents 
          SET status = 'unpublished', 
              review_status = 'approved',
              sop_code = ?, 
              approval_date = NOW()
          WHERE id = ?`,
        [sopCode, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("SOP tidak ditemukan");
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method untuk mencari dokumen SOP berdasarkan kode SOP
   * @param {string} sopCode - Kode SOP yang akan dicari
   * @param {number|null} excludeId - ID dokumen yang akan dikecualikan dari pencarian
   * @returns {Object|undefined} - Dokumen SOP pertama yang ditemukan
   */
  static async findBySopCode(sopCode, excludeId = null) {
    let query = "SELECT *, unit_scope FROM sop_documents WHERE sop_code = ?";
    const params = [sopCode];

    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  /**
   * Method untuk membuat dokumen SOP baru
   * @param {Object} sopData - Data dokumen SOP yang akan dibuat
   * @returns {Object} - Hasil pembuatan dokumen dengan ID baru
   */
  static async createSopDoc(sopData) {
    const {
      title,
      goals,
      scope,
      unit_scope,
      definition,
      sop_reference,
      procedure_description,
      status = "draft",
      assignment_id = null,
      sop_code = null, // Will be generated after approval
      version = "V.1.0",
      user_id, // ID user yang membuat SOP
      reviewer_id,
      approver_id,
    } = sopData; // Validasi required fields
    if (!title) {
      throw new Error("Judul SOP wajib diisi");
    }

    // Normalisasi unit_scope: jadikan number atau null (hindari string kosong)
    const normalizedUnitScope =
      unit_scope === undefined ||
      unit_scope === null ||
      String(unit_scope).trim() === ""
        ? null
        : Number(unit_scope);

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create SOP document using constructor and save method
      const sopDoc = new SopDoc(
        sop_code, // null initially
        version,
        title,
        goals,
        scope,
        normalizedUnitScope,
        definition,
        sop_reference,
        procedure_description,
        status,
        assignment_id
      ); // Save to database
      const [result] = await connection.query(
        "INSERT INTO sop_documents (sop_code, version, title, goals, scope, unit_scope, definition, sop_reference, procedure_description, status, assignment_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          sopDoc.sop_code,
          sopDoc.version,
          sopDoc.title,
          sopDoc.goals,
          sopDoc.scope,
          sopDoc.unit_scope,
          sopDoc.definition,
          sopDoc.sop_reference,
          sopDoc.procedure_description,
          sopDoc.status,
          sopDoc.assignment_id,
        ]
      );

      const sopDocId = result.insertId; // Jika ada user_id, buat entry approval roles untuk Creator
      if (user_id) {
        // Get user dan unit info
        const [userInfo] = await connection.query(
          "SELECT name, unit FROM users WHERE id = ?",
          [user_id]
        );

        if (userInfo.length > 0) {
          const { unit: userUnit } = userInfo[0];

          // Insert Creator role
          await connection.query(
            `INSERT INTO sop_approval_roles 
             (sop_doc_id, role, user_id, unit_id, approval_date) 
             VALUES (?, ?, ?, ?, NOW())`,
            [sopDocId, "Creator", user_id, userUnit]
          );
        }

        // Insert Reviewer role if provided
        if (reviewer_id) {
          const [reviewerInfo] = await connection.query(
            "SELECT name, unit FROM users WHERE id = ?",
            [reviewer_id]
          );

          if (reviewerInfo.length > 0) {
            const { unit: reviewerUnit } = reviewerInfo[0];
            await connection.query(
              `INSERT INTO sop_approval_roles 
               (sop_doc_id, role, user_id, unit_id) 
               VALUES (?, ?, ?, ?)`,
              [sopDocId, "Reviewer", reviewer_id, reviewerUnit]
            );
          }
        }

        // Insert Approver role if provided
        if (approver_id) {
          const [approverInfo] = await connection.query(
            "SELECT name, unit FROM users WHERE id = ?",
            [approver_id]
          );

          if (approverInfo.length > 0) {
            const { unit: approverUnit } = approverInfo[0];
            await connection.query(
              `INSERT INTO sop_approval_roles 
               (sop_doc_id, role, user_id, unit_id) 
               VALUES (?, ?, ?, ?)`,
              [sopDocId, "Approver", approver_id, approverUnit]
            );
          }
        }
      }

      // Commit transaction
      await connection.commit();

      return {
        id: sopDocId,
        ...sopDoc,
        success: true,
      };
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      throw error;
    } finally {
      // Release connection
      connection.release();
    }
  }

  /**
   * Method untuk mengupdate dokumen SOP berdasarkan ID
   * @param {number} id - ID dokumen yang akan diupdate
   * @param {Object} sopData - Data baru untuk dokumen SOP
   * @returns {Object} - Data dokumen yang sudah diupdate
   */
  static async updateSopDoc(id, sopData) {
    const {
      sop_code,
      title,
      goals,
      scope,
      unit_scope,
      definition,
      sop_reference,
      procedure_description,
      reviewer_id,
      approver_id,
      version_type, // 'minor' atau 'major'
    } = sopData;

    // Cek kode SOP unik hanya jika sop_code diubah/dikirim
    if (sop_code !== undefined && sop_code !== null) {
      const existingDoc = await this.findBySopCode(sop_code, id);
      if (existingDoc) {
        throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
      }
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Ambil data SOP saat ini
      const [currentDoc] = await connection.query(
        "SELECT status, version, review_status, assignment_id FROM sop_documents WHERE id = ?",
        [id]
      );
      if (currentDoc.length === 0)
        throw new Error("Dokumen SOP tidak ditemukan");

      let newVersion = currentDoc[0].version;
      let newStatus = currentDoc[0].status;
      let reviewStatus = null;
      let revisionType = null;

      // Parse versi current
      const versionWithoutPrefix = currentDoc[0].version.replace(/^V\./, "");
      const currentVersionParts = versionWithoutPrefix.split(".");
      const majorVersion = parseInt(currentVersionParts[0] || 1);
      const minorVersion = parseInt(currentVersionParts[1] || 0);

      // Tentukan versioning
      if (version_type === "minor") {
        if (currentDoc[0].review_status !== "approved") {
          throw new Error(
            "Minor versioning hanya bisa diterapkan pada SOP yang pernah disahkan"
          );
        }
        newVersion = `V.${majorVersion}.${minorVersion + 1}`;
        newStatus = "unpublished";
        reviewStatus = "approved"; // reset review status minor
        revisionType = "minor";
      }

      if (version_type === "major") {
        if (currentDoc[0].review_status !== "approved") {
          throw new Error(
            "Major version hanya bisa diterapkan pada SOP yang sudah selesai"
          );
        }
        // Tidak naikkan versi pada saat edit, tandai sebagai major pending
        newStatus = "draft";
        reviewStatus = "major_pending";
        revisionType = "major";
      }

      // Update SOP
      // Normalisasi unit_scope untuk update (hanya set jika dikirim dan tidak kosong)
      const hasUnitScopeField = Object.prototype.hasOwnProperty.call(
        sopData,
        "unit_scope"
      );
      const normalizedUnitScope =
        hasUnitScopeField &&
        unit_scope !== null &&
        String(unit_scope).trim() !== ""
          ? Number(unit_scope)
          : null;

      // Build dynamic SET clause agar tidak menimpa kolom jika tidak dikirim
      const setClauses = [];
      const params = [];

      if (sop_code !== undefined) {
        setClauses.push("sop_code = ?");
        params.push(sop_code);
      }
      setClauses.push("version = ?");
      params.push(newVersion);
      setClauses.push("status = ?");
      params.push(newStatus);
      if (title !== undefined) {
        setClauses.push("title = ?");
        params.push(title);
      }
      if (goals !== undefined) {
        setClauses.push("goals = ?");
        params.push(goals);
      }
      if (scope !== undefined) {
        setClauses.push("scope = ?");
        params.push(scope);
      }
      if (hasUnitScopeField && normalizedUnitScope !== null) {
        setClauses.push("unit_scope = ?");
        params.push(normalizedUnitScope);
      }
      if (definition !== undefined) {
        setClauses.push("definition = ?");
        params.push(definition);
      }
      if (sop_reference !== undefined) {
        setClauses.push("sop_reference = ?");
        params.push(sop_reference);
      }
      if (procedure_description !== undefined) {
        setClauses.push("procedure_description = ?");
        params.push(procedure_description);
      }
      if (reviewStatus) {
        setClauses.push("review_status = ?");
        params.push(reviewStatus);
      }
      if (version_type) {
        setClauses.push("revision_type = ?");
        params.push(revisionType);
      }
      setClauses.push("revision_date = NOW()");

      const updateQuery = `UPDATE sop_documents SET ${setClauses.join(
        ", "
      )} WHERE id = ?`;
      params.push(id);
      await connection.query(updateQuery, params);

      // Update reviewer & approver jika diberikan
      if (reviewer_id || approver_id) {
        await connection.query(
          "DELETE FROM sop_approval_roles WHERE sop_doc_id = ? AND role IN ('Reviewer','Approver')",
          [id]
        );

        if (reviewer_id) {
          const [reviewerInfo] = await connection.query(
            "SELECT unit FROM users WHERE id = ?",
            [reviewer_id]
          );
          if (reviewerInfo.length > 0) {
            await connection.query(
              "INSERT INTO sop_approval_roles (sop_doc_id, role, user_id, unit_id) VALUES (?, 'Reviewer', ?, ?)",
              [id, reviewer_id, reviewerInfo[0].unit]
            );
          }
        }

        if (approver_id) {
          const [approverInfo] = await connection.query(
            "SELECT unit FROM users WHERE id = ?",
            [approver_id]
          );
          if (approverInfo.length > 0) {
            await connection.query(
              "INSERT INTO sop_approval_roles (sop_doc_id, role, user_id, unit_id) VALUES (?, 'Approver', ?, ?)",
              [id, approver_id, approverInfo[0].unit]
            );
          }
        }
      }

      await connection.commit();
      connection.release();

      // Kembalikan data terbaru
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  static async publishSopDoc(id) {
    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Cek apakah ada major revision pending
      const [currentDoc] = await connection.query(
        "SELECT version, review_status, status FROM sop_documents WHERE id = ?",
        [id]
      );

      let newVersion = currentDoc[0].version;
      let newStatus = STATUS.PUBLISHED; // Default: langsung published
      let newReviewStatus = REVIEW_STATUS.APPROVED;

      // Jika ada major revision pending, kirim ulang ke alur review tanpa menaikkan versi lagi (sudah dinaikkan saat approval)
      if (currentDoc[0].review_status === REVIEW_STATUS.MAJOR_PENDING) {
        newStatus = STATUS.UNPUBLISHED;
        newReviewStatus = REVIEW_STATUS.SUBMITTED_FOR_REVIEW;
      }
      // 🔧 PERBAIKAN: Publikasi normal untuk SOP yang sudah approved
      else if (currentDoc[0].review_status === REVIEW_STATUS.APPROVED) {
        // Publikasi normal - status menjadi published
        newStatus = STATUS.PUBLISHED;
        newReviewStatus = REVIEW_STATUS.APPROVED;
      } else {
        throw new Error(
          `❌ SOP belum bisa dipublikasi. Status saat ini: ${currentDoc[0].review_status}. Status harus 'approved' atau 'major_pending'.`
        );
      }

      // Update status, version, dan review_status
      const updateQuery =
        "UPDATE sop_documents SET status = ?, version = ?, published_at = NOW(), review_status = ? WHERE id = ?";
      const updateParams = [newStatus, newVersion, newReviewStatus, id];

      const [updateResult] = await connection.query(updateQuery, updateParams);

      // Verify the publish by checking the database
      const [verifyDoc] = await connection.query(
        "SELECT status, version, review_status FROM sop_documents WHERE id = ?",
        [id]
      );

      await connection.commit();
      connection.release();
      return true;
    } catch (error) {
      console.error(`❌ Error publishing SOP ${id}:`, error);
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  static async unpublishSopDoc(id) {
    await pool.query("UPDATE sop_documents SET status = ? WHERE id = ?", [
      "unpublished",
      id,
    ]);
    return true;
  }

  /**
   * Method untuk mengupdate status dokumen SOP
   * @param {number} id - ID dokumen yang akan diupdate
   * @param {string} status - Status baru (draft, published, archived)
   * @returns {boolean} - True jika berhasil
   */
  static async updateStatus(id, status) {
    await pool.query("UPDATE sop_documents SET status = ? WHERE id = ?", [
      status,
      id,
    ]);
    return true;
  }

  static async delete(id) {
    await pool.query("DELETE FROM sop_documents WHERE id = ?", [id]);
    return true;
  }

  /**
   * Method untuk mengambil SOP berdasarkan unit kerja pengguna
   * Pengecualian: Admin dapat melihat semua SOP
   * @param {number} userId - ID user yang unit kerjanya akan dijadikan filter
   * @returns {Array} - Array SOP yang sesuai dengan unit kerja user (atau semua SOP jika admin)
   */
  static async findByUserUnit(userId) {
    try {
      const [userCheck] = await pool.query(
        `
        SELECT * FROM users WHERE id = ?
      `,
        [userId]
      );
      if (!userCheck.length) {
        throw new Error("User tidak ditemukan");
      }

      const { role } = userCheck[0];
      if (role === "admin") {
        const [rows] = await pool.query(`
          SELECT DISTINCT 
            d.id,
            d.sop_code,
            d.version,
            d.title,
            d.goals,
            d.scope,
            COALESCE(d.unit_scope, sca.unit_scope) AS unit_scope,
            unit_scope_tbl.nama_unit AS unit_scope_name,
            d.definition,
            d.sop_reference,
            d.procedure_description,
            d.status,
            d.review_status,
            d.created_at,
            d.updated_at,
            d.sop_applicable,
            d.approval_date,
            creator.name AS uploader_name,
            ar.user_id AS uploader_id,
            ar.user_id AS creator_id,
            NULL AS assignment_id, -- Untuk kompatibilitas dengan assignment system
            approver_role.approval_date AS creation_date,
            d.sop_applicable AS effective_date,
            d.revision_date,
            COALESCE(approver_role.approval_date, d.created_at) AS created_date,
            u.kode_unit,
            u.nomor_unit
          FROM sop_documents d
          LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
          LEFT JOIN users creator ON ar.user_id = creator.id
          LEFT JOIN units u ON ar.unit_id = u.id
          LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
          LEFT JOIN units unit_scope_tbl ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope_tbl.id
          LEFT JOIN sop_approval_roles reviewer_role ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
          LEFT JOIN sop_approval_roles approver_role ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
          WHERE 1 = 1
          ORDER BY d.created_at DESC
        `);
        return rows;
      }

      if (role === "admin_unit") {
        const userUnit = userCheck[0].unit;
        const [rows] = await pool.query(
          `
          SELECT DISTINCT 
            d.id,
            d.sop_code,
            d.version,
            d.title,
            d.goals,
            d.scope,
            COALESCE(d.unit_scope, sca.unit_scope) AS unit_scope,
            unit_scope_tbl.nama_unit AS unit_scope_name,
            d.definition,
            d.sop_reference,
            d.procedure_description,
            d.status,
            d.review_status,
            d.created_at,
            d.updated_at,
            d.sop_applicable,
            d.approval_date,
            creator.name AS uploader_name,
            ar.user_id AS uploader_id,
            ar.user_id AS creator_id,
            NULL AS assignment_id, -- Untuk kompatibilitas dengan assignment system
            approver_role.approval_date AS creation_date,
            d.sop_applicable AS effective_date,
            d.revision_date,
            COALESCE(approver_role.approval_date, d.created_at) AS created_date,
            u.kode_unit,
            u.nomor_unit
          FROM sop_documents d
          LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
          LEFT JOIN users creator ON ar.user_id = creator.id
          LEFT JOIN units u ON ar.unit_id = u.id
          LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
          LEFT JOIN units unit_scope_tbl ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope_tbl.id
          LEFT JOIN sop_approval_roles reviewer_role ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
          LEFT JOIN sop_approval_roles approver_role ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
          WHERE COALESCE(d.unit_scope, sca.unit_scope) = ?
          ORDER BY d.created_at DESC
        `,
          [userUnit]
        );
        return rows;
      }
      const userUnit = userCheck[0].unit;
      const [rows] = await pool.query(
        `
        SELECT DISTINCT 
          d.id,
          d.sop_code,
          d.version,
          d.title,
          d.goals,
          d.scope,
          COALESCE(d.unit_scope, sca.unit_scope) AS unit_scope,
          unit_scope_tbl.nama_unit AS unit_scope_name,
          d.definition,
          d.sop_reference,
          d.procedure_description,
          d.status,
          d.review_status,
          d.created_at,
          d.updated_at,
          d.sop_applicable,
          d.approval_date,
          COALESCE(creator.name, 'Unknown Creator') AS uploader_name,
          ar.user_id AS uploader_id,
          ar.user_id AS creator_id,
          NULL AS assignment_id, -- Untuk kompatibilitas dengan assignment system
          approver_role.approval_date AS creation_date,
          d.sop_applicable AS effective_date,
            d.revision_date,
          COALESCE(approver_role.approval_date, d.created_at) AS created_date,
          u.kode_unit,
          u.nomor_unit
        FROM sop_documents d
        LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
        LEFT JOIN users creator ON ar.user_id = creator.id
        LEFT JOIN units u ON ar.unit_id = u.id
        LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
        LEFT JOIN units unit_scope_tbl ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope_tbl.id
        LEFT JOIN sop_approval_roles reviewer_role ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
        LEFT JOIN sop_approval_roles approver_role ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
        WHERE 
          (
            COALESCE(d.unit_scope, sca.unit_scope) = ? AND d.status = 'published'
          ) OR 
          (
            ar.user_id = ?
          )
        ORDER BY d.created_at DESC
      `,
        [userUnit, userId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method alternatif untuk mengambil SOP berdasarkan unit kerja pengguna (lebih sederhana)
   * @param {number} unitId - ID unit kerja
   * @returns {Array} - Array SOP yang sesuai dengan unit kerja
   */
  static async findByUnit(unitId) {
    try {
      const [rows] = await pool.query(
        `
        SELECT DISTINCT 
          d.id,
          d.sop_code,
          d.version,
          d.title,
          d.goals,
          d.scope,
          d.unit_scope,
          unit_scope_tbl.nama_unit AS unit_scope_name,
          d.definition,
          d.sop_reference,
          d.procedure_description,
          d.status,
          d.created_at,
          d.updated_at,
          d.sop_applicable,
          creator.name AS uploader_name,
          approver_role.approval_date AS creation_date,
          d.sop_applicable AS effective_date,
            d.revision_date,
          COALESCE(approver_role.approval_date, d.created_at) AS created_date,
          u.nama_unit AS organization,
          u.kode_unit,
          u.nomor_unit
        FROM sop_documents d
        JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id
        JOIN users creator ON ar.user_id = creator.id
        JOIN units u ON ar.unit_id = u.id
        LEFT JOIN units unit_scope_tbl ON d.unit_scope = unit_scope_tbl.id
        LEFT JOIN sop_approval_roles reviewer_role ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
        LEFT JOIN sop_approval_roles approver_role ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
        WHERE ar.role = 'Creator'
          AND u.id = ?
          AND d.status IN ('draft', 'published')
        ORDER BY d.created_at DESC
      `,
        [unitId]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method untuk mengambil SOP berdasarkan nama unit
   * @param {string} unitName - Nama unit kerja
   * @returns {Array} - Array SOP yang sesuai dengan unit kerja
   */
  static async findByUnitName(unitName) {
    try {
      const [rows] = await pool.query(
        `
        SELECT DISTINCT 
          d.id, 
          d.title,
          d.sop_code,
          d.version,
          d.goals,
          d.scope,
          d.unit_scope,
          unit_scope_tbl.nama_unit AS unit_scope_name,
          d.definition,
          d.sop_reference,
          d.procedure_description,
          d.status,
          d.created_at,
          d.updated_at,
          d.sop_applicable,
          creator.name AS uploader_name,
          -- Tanggal Pembuatan: Kapan disahkan oleh Approver
          approver_role.approval_date AS creation_date,
          -- Tanggal Efektif: Dari kolom sop_applicable (diatur oleh pengesah)
          d.sop_applicable AS effective_date,
          -- Tanggal Revisi: Hanya tampilkan jika ada permintaan revisi yang selesai
            -- FIXME: Logic lama salah, ganti dengan NULL sampai ada sistem revisi proper
            d.revision_date,
          -- Fallback untuk kompatibilitas (gunakan creation_date sebagai created_date)
          COALESCE(approver_role.approval_date, d.created_at) AS created_date,
          u.nama_unit AS organization,
          u.kode_unit,
          u.nomor_unit,
          u.nama_unit AS unit_penyusun
        FROM sop_documents d
        JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id
        JOIN users creator ON ar.user_id = creator.id
        JOIN units u ON ar.unit_id = u.id
        LEFT JOIN units unit_scope_tbl ON d.unit_scope = unit_scope_tbl.id
        LEFT JOIN sop_approval_roles reviewer_role ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
        LEFT JOIN sop_approval_roles approver_role ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
        WHERE ar.role = 'Creator'
          AND u.nama_unit = ?
          AND d.status IN ('draft', 'published')
        ORDER BY d.created_at DESC
      `,
        [unitName]
      );

      return rows;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Method untuk mengambil SOP berdasarkan unit dan status tertentu (untuk keperluan assignment)
   * @param {number} unitId - ID unit kerja (BUKAN nama unit!)
   * @param {string} status - Status SOP (contoh: 'approved')
   * @returns {Array} - Array SOP yang sesuai dengan unit kerja dan status
   */
  static async findByUnitAndStatus(unitId, status) {
    try {
      const query = `
        SELECT DISTINCT 
          d.id,
          d.sop_code,
          d.version,
          d.title,
          d.goals,
          d.scope,
          d.unit_scope,
          unit_scope_tbl.nama_unit AS unit_scope_name,
          d.definition,
          d.sop_reference,
          d.procedure_description,
          d.status,
          d.review_status,
          d.created_at,
          d.updated_at,
          d.sop_applicable,
          creator.name AS uploader_name
        FROM sop_documents d
        LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
        LEFT JOIN users creator ON ar.user_id = creator.id
        LEFT JOIN units unit_scope_tbl ON d.unit_scope = unit_scope_tbl.id
        WHERE d.unit_scope = ? 
        AND d.review_status = ?
        ORDER BY d.created_at DESC
        `;

      const [rows] = await pool.query(query, [unitId, status]);

      return rows;
    } catch (error) {
      console.error("Error in findByUnitAndStatus:", error);
      throw error;
    }
  }

  /**
   * Method untuk mengambil semua SOP yang sudah approved (untuk admin biasa)
   * @returns {Array} - Array semua SOP yang sudah approved
   */
  static async findAllApprovedSops() {
    try {
      const query = `
        SELECT DISTINCT 
          d.id,
          d.sop_code,
          d.version,
          d.title,
          d.goals,
          d.scope,
          d.unit_scope,
          unit_scope_tbl.nama_unit AS unit_scope_name,
          d.definition,
          d.sop_reference,
          d.procedure_description,
          d.status,
          d.review_status,
          d.created_at,
          d.updated_at,
          d.sop_applicable,
          creator.name AS uploader_name
        FROM sop_documents d
        LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.role = 'Creator'
        LEFT JOIN users creator ON ar.user_id = creator.id
        LEFT JOIN units unit_scope_tbl ON d.unit_scope = unit_scope_tbl.id
        WHERE d.review_status = 'approved'
        ORDER BY d.created_at DESC
        `;

      const [rows] = await pool.query(query);

      return rows;
    } catch (error) {
      console.error("Error in findAllApprovedSops:", error);
      throw error;
    }
  }

  /**
   * Mendapatkan dokumen SOP berdasarkan ID
   * @param {number} id - ID dokumen yang dicari
   * @returns {Promise<Object|null>} Object data dokumen atau null jika tidak ditemukan
   */
  static async getSopDocById(id) {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM sop_documents WHERE id = ?`,
        [id]
      );
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error("Error in getSopDocById:", error);
      throw error;
    }
  }

  /**
   * Update status dokumen SOP
   * @param {number} id - ID dokumen yang akan diupdate
   * @param {string} status - Status baru (draft, review, published, archived)
   * @returns {Promise<Object>} Result dari operasi update
   */
  static async updateSopStatus(id, status) {
    try {
      const [result] = await pool.query(
        `UPDATE sop_documents SET status = ?, updated_at = NOW() WHERE id = ?`,
        [status, id]
      );
      return result;
    } catch (error) {
      console.error("Error in updateSopStatus:", error);
      throw error;
    }
  }
}

module.exports = SopDoc;
