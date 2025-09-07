// Import model SopDoc untuk operasi database dokumen SOP
const SopDoc = require("../models/SopDoc");
// Import model SopArchive untuk operasi arsip dokumen
const SopArchive = require("../models/SopArchive");
// Import model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog");
// Import jsonwebtoken untuk verifikasi JWT token
const jwt = require("jsonwebtoken");
// Import QR Code service untuk generate QR code pengesahan
const QRCodeService = require("../services/qrCodeService");

/**
 * Helper function untuk logging aktivitas document
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (CREATE, UPDATE, DELETE, ARCHIVE)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logDocumentActivity = async (
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
      "SOP_DOCUMENT",
      descriptionStr,
      req,
      targetData?.id || null,
      targetData ? "sop_document" : null
    );
  } catch (error) {
    console.error("❌ Error logging document activity:", error.message);
    console.error("Full error:", error);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

/**
 * Controller untuk mendapatkan semua dokumen SOP
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getAllDocs = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;

    // Jika user tidak terautentikasi, hanya tampilkan published docs
    if (!userId) {
      const publishedDocs = await SopDoc.findPublishedSopDocs();
      return res.status(200).json(publishedDocs);
    }

    // Ambil semua dokumen SOP dari database dengan filter berdasarkan permission
    const docs = await SopDoc.findAllSopDocWithPermission(userId, userRole);

    // Kirim response dengan status 200 dan data dokumen
    res.status(200).json(docs);
  } catch (error) {
    // Jika terjadi error, kirim response error dengan pesan error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan dokumen SOP yang sudah dipublikasi
 * Menerapkan aturan visibilitas:
 * - Dokumen dengan unit_scope = 1 (Universitas) → terlihat semua orang
 * - Dokumen dengan unit_scope lain → hanya terlihat oleh user dari unit yang sama
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getPublishedDocs = async (req, res) => {
  try {
    // Ambil dokumen SOP dengan status 'published' dari database
    const allDocs = await SopDoc.findPublishedSopDocs();

    // Cek apakah ada token user (opsional untuk public endpoint)
    let userUnit = null;
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userUnit = decoded.unit; // Ambil unit user dari token
      } catch (tokenError) {
        // Token invalid atau tidak ada, user dianggap sebagai guest
        throw new Error("Invalid or no token provided");
      }
    }

    // Filter dokumen berdasarkan aturan visibilitas
    const filteredDocs = allDocs.filter((doc) => {
      // Dokumen dengan unit_scope = 1 (Universitas) terlihat untuk semua orang
      if (doc.unit_scope === 1) {
        return true;
      }

      // Dokumen dengan unit_scope lain hanya terlihat oleh user dari unit yang sama
      if (userUnit && doc.unit_scope === userUnit) {
        return true;
      }

      // Jika user adalah guest (tidak login) atau bukan dari unit yang sama,
      // dokumen tidak terlihat
      return false;
    });

    // Kirim response sukses dengan data dokumen yang sudah difilter
    res.status(200).json(filteredDocs);
  } catch (error) {
    // Handle error dan kirim response error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan konten SOP yang sudah dipublikasi (public endpoint)
 * @param {Object} req - Request object (berisi params.id)
 * @param {Object} res - Response object dari Express
 */
exports.getPublishedSopContent = async (req, res) => {
  try {
    // Ambil dokumen berdasarkan ID dari parameter URL
    const doc = await SopDoc.findById(req.params.id);

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "SOP document not found",
      });
    }

    // Pastikan dokumen sudah published
    if (doc.status !== "published") {
      return res.status(403).json({
        success: false,
        message: "SOP document is not published",
      });
    }

    // Kirim response sukses dengan data konten SOP
    const sopContent = {
      id: doc.id,
      sop_code: doc.sop_code,
      sop_title: doc.title,
      version: doc.version,
      goals: doc.goals,
      scope: doc.scope,
      definition: doc.definition,
      sop_reference: doc.sop_reference,
      procedure_description: doc.procedure_description,
      status: doc.status,
      review_status: doc.review_status,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      creation_date: doc.creation_date,
      effective_date: doc.effective_date,
      revision_date: doc.revision_date,
      creator_name: doc.uploader_name,
      unit_name: doc.unit_name,
      reviewer_name: doc.reviewer_name,
      approver_name: doc.approver_name,
      approver_position: doc.approver_position,
      organization: doc.organization,
      unit_scope: doc.unit_scope,
      unit_scope_name: doc.unit_scope_name,
      qr_checksum: doc.qr_checksum,
      sop_applicable: doc.sop_applicable,
    };

    res.status(200).json({
      success: true,
      data: sopContent,
    });
  } catch (error) {
    console.error("❌ Error in getPublishedSopContent:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Controller untuk mendapatkan dokumen SOP berdasarkan ID
 * @param {Object} req - Request object (berisi params.id)
 * @param {Object} res - Response object dari Express
 */
exports.getDocById = async (req, res) => {
  try {
    // Ambil dokumen berdasarkan ID dari parameter URL
    const doc = await SopDoc.findById(req.params.id);

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Tidak ada logging di sini untuk menghindari duplikasi
    // Logging hanya dilakukan di endpoint khusus /view/:id

    // Kirim response sukses dengan data dokumen
    res.status(200).json(doc);
  } catch (error) {
    // Handle error dan kirim response error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan profil user dari token JWT
 * @param {Object} req - Request object (berisi authorization header)
 * @param {Object} res - Response object dari Express
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Ekstrak token dari Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    // Verifikasi dan decode token JWT untuk mendapatkan data user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Buat object user berdasarkan data dari token
    const user = { id: decoded.id, email: decoded.email, registered: true };

    // Kirim response sukses dengan data user
    res.status(200).json(user);
  } catch (error) {
    // Jika token invalid, kirim error 401
    res.status(401).json({ message: "Invalid token or user not registered" });
  }
};

/**
 * Controller untuk membuat dokumen SOP baru
 * @param {Object} req - Request object (berisi data dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.createDoc = async (req, res) => {
  try {
    // Gabungkan data dari request body dengan user_id dan versioning info
    const sopData = {
      ...req.body,
      user_id: req.user.id,
      version_mode: req.body.version_mode, // 'auto' atau 'manual'
      version_type: req.body.version_type, // 'minor' atau 'major' jika auto
    };

    // Simpan dokumen SOP baru ke database (dengan versioning logic)
    const newDoc = await SopDoc.createSopDoc(sopData);

    // Log aktivitas pembuatan dokumen
    await logDocumentActivity(
      req.user,
      "CREATE",
      `User ${req.user.name} membuat dokumen SOP baru: ${
        sopData.sop_title || sopData.sop_code || "Unknown Document"
      }`,
      req,
      { id: newDoc.id }
    );

    // Kirim response sukses dengan data dokumen baru
    res
      .status(201)
      .json({ message: "SOP document created successfully", newDoc });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk mengupdate dokumen SOP
 * @param {Object} req - Request object (berisi id dokumen dan data update)
 * @param {Object} res - Response object dari Express
 */
exports.updateDoc = async (req, res) => {
  try {
    // Ambil data dokumen sebelum update untuk logging
    const oldDoc = await SopDoc.findById(req.params.id);

    // Gabungkan versioning info jika ada
    const sopData = {
      ...req.body,
      version_mode: req.body.version_mode, // 'auto' atau 'manual'
      version_type: req.body.version_type, // 'minor' atau 'major' jika auto
    };

    // Update dokumen berdasarkan ID dengan data baru (dengan versioning logic)
    const updatedDoc = await SopDoc.updateSopDoc(req.params.id, sopData);

    // Log aktivitas update dokumen
    await logDocumentActivity(
      req.user,
      "UPDATE",
      `User ${req.user.name} mengubah data dokumen SOP: ${
        oldDoc?.sop_title || oldDoc?.sop_code || "Unknown Document"
      }`,
      req,
      { id: req.params.id }
    );

    // Kirim response sukses dengan data dokumen yang sudah diupdate
    res
      .status(200)
      .json({ message: "SOP document updated successfully", updatedDoc });
  } catch (error) {
    console.error(`❌ Error in updateDoc controller:`, error);
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk mempublikasi dokumen SOP
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.publishDoc = async (req, res) => {
  try {
    // Ambil data dokumen sebelum publish untuk logging
    const doc = await SopDoc.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Cek aturan akses publikasi: hanya admin_unit yang bisa publikasi,
    // kecuali untuk SOP unit universitas langlangbuana
    const userRole = req.user.role;
    const userId = req.user.id;

    // Ambil data unit dari SOP dan user
    const pool = require("../config/db");
    const [unitData] = await pool.query(
      `
      SELECT 
        unit_scope_tbl.nama_unit as sop_unit_name,
        user_unit.nama_unit as user_unit_name
      FROM sop_documents d
      LEFT JOIN units unit_scope_tbl ON d.unit_scope = unit_scope_tbl.id
      LEFT JOIN users u ON u.id = ?
      LEFT JOIN units user_unit ON u.unit = user_unit.id
      WHERE d.id = ?
    `,
      [userId, req.params.id]
    );

    if (!unitData.length) {
      return res.status(404).json({ message: "Data unit tidak ditemukan" });
    }

    const { sop_unit_name, user_unit_name } = unitData[0];

    // Aturan akses publikasi:
    // 1. admin hanya bisa publikasi SOP dengan ruang lingkup "Universitas Langlangbuana"
    // 2. admin_unit hanya bisa publikasi SOP dari unit mereka sendiri
    const isUniversitasScope =
      sop_unit_name &&
      sop_unit_name.toLowerCase().includes("universitas langlangbuana");

    const canPublish =
      (userRole === "admin" && isUniversitasScope) || // Admin hanya bisa publikasi SOP universitas
      (userRole === "admin_unit" && sop_unit_name === user_unit_name); // Admin unit hanya bisa publikasi SOP unit mereka

    if (!canPublish) {
      let message = "";
      if (userRole === "admin" && !isUniversitasScope) {
        message =
          "Admin hanya dapat mempublikasi SOP dengan ruang lingkup Universitas Langlangbuana.";
      } else if (
        userRole === "admin_unit" &&
        sop_unit_name !== user_unit_name
      ) {
        message =
          "Admin unit hanya dapat mempublikasi SOP dari unit kerja mereka sendiri.";
      } else {
        message = "Anda tidak memiliki akses untuk mempublikasi SOP ini.";
      }

      return res.status(403).json({ message });
    }

    // Ubah status dokumen menjadi 'published'
    await SopDoc.publishSopDoc(req.params.id);

    // Generate QR code untuk bukti pengesahan SOP
    try {
      const pool = require("../config/db");
      const qrResult = await QRCodeService.generateForApprovedSOP(
        req.params.id,
        pool
      );

      // Simpan QR code base64 ke database
      const updateQRQuery = `
        UPDATE sop_documents 
        SET qr_code_url = ? 
        WHERE id = ?
      `;
      await pool.execute(updateQRQuery, [
        qrResult.qr_code_base64,
        req.params.id,
      ]);
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
      // QR code generation error tidak menggagalkan proses publish
    }

    // Ambil data dokumen yang sudah dipublikasi
    const updatedDoc = await SopDoc.findById(req.params.id);

    // Log aktivitas publish dokumen
    await logDocumentActivity(
      req.user,
      "PUBLISH",
      `User ${req.user.name} mempublikasi dokumen SOP: ${
        doc?.sop_title || doc?.title || "Unknown Document"
      }`,
      req,
      { id: req.params.id }
    );

    // Kirim response sukses dengan status published
    res.status(200).json({
      message: "SOP document published successfully",
      status: "published",
      updatedDoc,
    });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk unpublish dokumen SOP (kembali ke draft)
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.unpublishDoc = async (req, res) => {
  try {
    // Ambil data dokumen sebelum unpublish untuk logging
    const doc = await SopDoc.findById(req.params.id);

    // Ubah status dokumen menjadi 'draft'
    await SopDoc.unpublishSopDoc(req.params.id);

    // Ambil data dokumen yang sudah di-unpublish
    const updatedDoc = await SopDoc.findById(req.params.id);

    // Log aktivitas unpublish dokumen
    await logDocumentActivity(
      req.user,
      "UNPUBLISH",
      `User ${req.user.name} membatalkan publikasi dokumen SOP: ${
        doc?.sop_title || doc?.title || "Unknown Document"
      }`,
      req,
      { id: req.params.id }
    );

    // Kirim response sukses dengan status unpublished
    res.status(200).json({
      message: "SOP document unpublished successfully",
      status: "unpublished",
      updatedDoc,
    });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk menghapus dokumen SOP
 * Memindahkan dokumen ke arsip instead of hard delete
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.deleteDoc = async (req, res) => {
  try {
    // Ambil dokumen terlebih dahulu untuk cek apakah ada URL file
    const doc = await SopDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Pindahkan dokumen ke arsip (move dari sop_documents ke sop_archive)
    let archiveResult = null;
    try {
      const SopArchive = require("../models/SopArchive");
      archiveResult = await SopArchive.moveToArchiveOnDelete(
        doc,
        req.user.id,
        "Document archived by user"
      );
    } catch (archiveError) {
      console.error("❌ Error moving document to archive:", archiveError);
      // Jika gagal arsip, jangan lanjutkan
      return res.status(500).json({
        message: "Failed to archive document",
        error: archiveError.message,
      });
    }

    // TIDAK HAPUS FILE dari Firebase Storage - file tetap ada
    // TIDAK PERLU UPDATE STATUS karena data sudah dipindah ke arsip

    // Log aktivitas pemindahan ke arsip (bukan penghapusan permanen)
    await logDocumentActivity(
      req.user,
      "ARCHIVE",
      `User ${req.user.name} memindahkan dokumen SOP ke arsip: ${
        doc.sop_title || doc.sop_code || "Unknown Document"
      }`,
      req,
      { id: doc.id }
    );

    // Kirim response sukses
    res.status(200).json({
      message:
        "SOP document moved to archive successfully. The document has been removed from the active list and moved to archive.",
      archived: true,
      archiveId: archiveResult?.id,
      originalDocId: doc.id,
      note: "Document data has been moved from main table to archive table",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk view/membuka dokumen SOP (dengan logging aktivitas)
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.viewDoc = async (req, res) => {
  try {
    const doc = await SopDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // cek apakah user login = penyusun
    const isOwner = req.user && doc.user_id === req.user.id;

    await logDocumentActivity(
      req.user,
      "VIEW",
      `User ${req.user.name} membuka dokumen SOP: ${
        doc.sop_title || "Unknown Document"
      }`,
      req,
      { id: doc.id }
    );

    res.status(200).json({
      ...doc,
      isOwner, // 🔑 tambahkan flag ini
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mengambil SOP berdasarkan unit kerja pengguna yang login
 * @param {Object} req - Request object dengan user info dari middleware auth
 * @param {Object} res - Response object
 */
exports.getSopByUserUnit = async (req, res) => {
  try {
    // Ambil user_id dari JWT token yang sudah di-decode di middleware
    const userId = req.user.id;

    // Ambil SOP berdasarkan unit kerja user
    const sopDocuments = await SopDoc.findByUserUnit(userId);

    // Kirim response sukses dengan data SOP
    res.status(200).json({
      message: "SOP documents retrieved successfully based on user unit",
      data: sopDocuments,
      count: sopDocuments.length,
      user_id: userId,
    });
  } catch (error) {
    console.error("❌ Error getting SOP by user unit:", error);
    res.status(500).json({
      message: "Error retrieving SOP documents by user unit",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil SOP berdasarkan unit tertentu (dengan parameter unit_id)
 * @param {Object} req - Request object dengan parameter unit_id
 * @param {Object} res - Response object
 */
exports.getSopByUnit = async (req, res) => {
  try {
    // Ambil unit_id dari parameter URL
    const { unit_id } = req.params;

    // Validasi unit_id
    if (!unit_id) {
      return res.status(400).json({
        message: "Unit ID is required",
      });
    }

    // Ambil SOP berdasarkan unit
    const sopDocuments = await SopDoc.findByUnit(unit_id);

    // Kirim response sukses dengan data SOP
    res.status(200).json({
      message: "SOP documents retrieved successfully based on unit",
      data: sopDocuments,
      count: sopDocuments.length,
      unit_id: unit_id,
    });
  } catch (error) {
    console.error("❌ Error getting SOP by unit:", error);
    res.status(500).json({
      message: "Error retrieving SOP documents by unit",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil SOP berdasarkan nama unit tertentu
 * @param {Object} req - Request object dengan parameter unit_name
 * @param {Object} res - Response object
 */
exports.getSopByUnitName = async (req, res) => {
  try {
    // Ambil unit_name dari parameter URL
    const { unit_name } = req.params;

    // Validasi unit_name
    if (!unit_name) {
      return res.status(400).json({
        message: "Unit name is required",
      });
    }

    // Ambil SOP berdasarkan nama unit
    const sopDocuments = await SopDoc.findByUnitName(unit_name);

    // Kirim response sukses dengan data SOP
    res.status(200).json({
      message: "SOP documents retrieved successfully based on unit name",
      data: sopDocuments,
      count: sopDocuments.length,
      unit_name: unit_name,
    });
  } catch (error) {
    console.error("❌ Error getting SOP by unit name:", error);
    res.status(500).json({
      message: "Error retrieving SOP documents by unit name",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengajukan SOP untuk pemeriksaan
 * @param {Object} req - Request object (berisi sop_doc_id)
 * @param {Object} res - Response object dari Express
 */
exports.submitSopForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const pool = require("../config/db");

    // Validasi apakah SOP ada dan milik user yang login
    const [sopRows] = await pool.query(
      "SELECT id, sop_code, title, review_status, created_at, updated_at FROM sop_documents WHERE id = ?",
      [id]
    );

    if (sopRows.length === 0) {
      return res.status(404).json({
        message: "SOP document not found",
      });
    }

    const sopDoc = sopRows[0];

    // Cek apakah sudah ada reviewer dan approver yang dipilih
    const [approvalRoles] = await pool.query(
      "SELECT * FROM sop_approval_roles WHERE sop_doc_id = ? AND role IN ('Reviewer', 'Approver')",
      [id]
    );

    const hasReviewer = approvalRoles.some((role) => role.role === "Reviewer");
    const hasApprover = approvalRoles.some((role) => role.role === "Approver");

    if (!hasReviewer || !hasApprover) {
      return res.status(400).json({
        message:
          "Harus pilih pemeriksa dan pengesah terlebih dahulu sebelum mengajukan pemeriksaan",
        missing: {
          reviewer: !hasReviewer,
          approver: !hasApprover,
        },
      });
    }

    // Update status review menjadi submitted_for_review (tanpa update updated_at)
    await pool.query(
      "UPDATE sop_documents SET review_status = 'submitted_for_review' WHERE id = ?",
      [id]
    );

    // Log aktivitas
    await logDocumentActivity(
      req.user,
      "SUBMIT_REVIEW",
      `User ${req.user.name} mengajukan SOP "${sopDoc.title}" untuk pemeriksaan`,
      req,
      { id: id }
    );

    res.status(200).json({
      message: "SOP berhasil diajukan untuk pemeriksaan",
      sop_doc_id: id,
      review_status: "submitted_for_review",
    });
  } catch (error) {
    console.error("❌ Error submitting SOP for review:", error);
    res.status(500).json({
      message: "Error submitting SOP for review",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mendapatkan data content SOP (bukan PDF)
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.getSopContent = async (req, res) => {
  try {
    // Ambil dokumen berdasarkan ID dari parameter URL
    const doc = await SopDoc.findById(req.params.id);

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Log aktivitas melihat content SOP
    await logDocumentActivity(
      req.user,
      "VIEW_CONTENT",
      `User ${req.user.name} melihat content SOP: ${
        doc.sop_title || "Unknown Document"
      }`,
      req,
      { id: doc.id }
    );

    // Kirim response sukses dengan data dokumen tanpa URL
    const sopContent = {
      id: doc.id,
      sop_code: doc.sop_code,
      sop_title: doc.title, // Gunakan field 'title' dari database
      version: doc.version,
      goals: doc.goals,
      scope: doc.scope,
      definition: doc.definition,
      sop_reference: doc.sop_reference,
      procedure_description: doc.procedure_description,
      status: doc.status,
      review_status: doc.review_status,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
      // Tanggal yang sudah dihitung dengan logika bisnis
      creation_date: doc.creation_date, // Tanggal disahkan
      effective_date: doc.effective_date, // Tanggal efektif
      revision_date: doc.revision_date, // Tanggal revisi (null jika tidak ada)
      creator_name: doc.uploader_name, // Gunakan field yang benar dari query
      unit_name: doc.unit_name,
      reviewer_name: doc.reviewer_name,
      approver_name: doc.approver_name,
      approver_position: doc.approver_position,
      reviewer_id: doc.reviewer_id,
      approver_id: doc.approver_id,
      organization: doc.organization,
      assignment_id: doc.assignment_id,
      unit_scope: doc.unit_scope,
      // QR Code checksum untuk bukti pengesahan
      qr_checksum: doc.qr_checksum,
      // Tambahkan fields lain yang diperlukan
    };

    res.status(200).json({
      success: true,
      data: sopContent,
    });
  } catch (error) {
    console.error("❌ Error in getSopContent:", error);
    // Handle error dan kirim response error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Controller untuk validasi SOP sebelum ajukan untuk pemeriksaan
 * Memastikan semua field dokumen SOP lengkap, ada pemeriksa/pengesah, dan ada visualisasi flowchart
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.validateBeforeSubmit = async (req, res) => {
  try {
    const sopId = req.params.id;

    // Ambil data SOP lengkap
    const sop = await SopDoc.findById(sopId);
    if (!sop) {
      return res.status(404).json({
        isValid: false,
        message: "SOP tidak ditemukan",
      });
    }

    const missingFields = [];
    let isValid = true;

    // Validasi field wajib SOP
    if (!sop.title || sop.title.trim() === "") {
      missingFields.push("Judul SOP");
      isValid = false;
    }

    if (!sop.unit_scope) {
      missingFields.push("Ruang Lingkup Unit Kerja");
      isValid = false;
    }

    if (!sop.goals || sop.goals.trim() === "") {
      missingFields.push("Tujuan");
      isValid = false;
    }

    if (!sop.scope || sop.scope.trim() === "") {
      missingFields.push("Ruang Lingkup");
      isValid = false;
    }

    if (!sop.definition || sop.definition.trim() === "") {
      missingFields.push("Definisi");
      isValid = false;
    }

    if (!sop.sop_reference || sop.sop_reference.trim() === "") {
      missingFields.push("Referensi");
      isValid = false;
    }

    if (!sop.procedure_description || sop.procedure_description.trim() === "") {
      missingFields.push("Deskripsi Prosedur");
      isValid = false;
    }

    // Validasi pemeriksa dan pengesah
    if (!sop.reviewer_id) {
      missingFields.push("Pemeriksa");
      isValid = false;
    }

    if (!sop.approver_id) {
      missingFields.push("Pengesah");
      isValid = false;
    }

    // Validasi visualisasi flowchart - cek sop_activities dan sop_visualization
    const pool = require("../config/db");

    // 1. Cek apakah ada activities
    const [activities] = await pool.query(
      "SELECT id FROM sop_activities WHERE sop_doc_id = ?",
      [sopId]
    );

    if (activities.length === 0) {
      missingFields.push("Visualisasi SOP");
      isValid = false;
    } else {
      // 2. Cek setiap activity harus ada visualisasinya yang lengkap
      let incompleteActivities = [];

      for (const activity of activities) {
        const [visualization] = await pool.query(
          `SELECT person_id, completeness, time_required, output 
           FROM sop_visualization 
           WHERE activity_id = ?`,
          [activity.id]
        );

        if (visualization.length === 0) {
          incompleteActivities.push(`Activity ${activity.id}`);
        } else {
          const viz = visualization[0];
          const missingVizFields = [];

          if (!viz.person_id) missingVizFields.push("pelaksana");
          if (!viz.completeness || viz.completeness.trim() === "")
            missingVizFields.push("kelengkapan");
          if (!viz.time_required || viz.time_required.trim() === "")
            missingVizFields.push("waktu");
          if (!viz.output || viz.output.trim() === "")
            missingVizFields.push("output");

          if (missingVizFields.length > 0) {
            incompleteActivities.push(`Activity ${activity.id}`);
          }
        }
      }

      if (incompleteActivities.length > 0) {
        missingFields.push("Visualisasi SOP");
        isValid = false;
      }
    }

    const hasVisualization =
      activities.length > 0 &&
      missingFields.filter((f) => f.includes("Visualisasi")).length === 0;

    // Kategorikan missing fields
    const documentFields = [
      "Judul SOP",
      "Ruang Lingkup Unit Kerja",
      "Tujuan",
      "Ruang Lingkup",
      "Definisi",
      "Referensi",
      "Deskripsi Prosedur",
      "Pemeriksa",
      "Pengesah",
    ];
    const visualizationFields = ["Visualisasi SOP"];

    const missingDocumentFields = missingFields.filter((field) =>
      documentFields.includes(field)
    );
    const missingVisualizationFields = missingFields.filter((field) =>
      visualizationFields.includes(field)
    );

    let message = "SOP siap untuk diajukan";
    if (!isValid) {
      const messages = [];
      if (missingDocumentFields.length > 0) {
        messages.push("Dokumen");
      }
      if (missingVisualizationFields.length > 0) {
        messages.push("Visualisasi SOP");
      }
      message = messages.join(" dan ") + " belum lengkap";
    }

    res.status(200).json({
      isValid,
      hasDocument:
        sop.procedure_description && sop.procedure_description.trim() !== "",
      hasVisualization,
      missingFields,
      message,
    });
  } catch (error) {
    console.error("❌ Error in validateBeforeSubmit:", error);
    res.status(500).json({
      isValid: false,
      message: "Error validating SOP: " + error.message,
    });
  }
};

module.exports = exports;
