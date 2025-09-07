const pool = require("../config/db");
const { logDocumentActivity } = require("./activityLogController");
const { generateSopCode } = require("../utils/sopCodeGenerator");
const SopCreatorAssignment = require("../models/SopCreatorAssignment");
const QRCodeService = require("../services/qrCodeService");

/**
 * Controller untuk mengambil SOP yang menunggu review oleh user yang login
 */
exports.getPendingReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Query untuk mendapatkan SOP yang menunggu review
    let query;
    let params;

    if (userRole === "admin" || userRole === "admin_unit") {
      // Admin hanya bisa lihat SOP dimana mereka punya role sebagai Reviewer/Approver
      query = `
        SELECT DISTINCT
          d.id,
          d.sop_code,
          d.title,
          d.review_status,
          d.created_at,
          d.updated_at,
          creator.name as creator_name,
          unit_scope.nama_unit as unit_scope_name,
          user_role.role as my_role
        FROM sop_documents d
        JOIN sop_approval_roles user_role ON d.id = user_role.sop_doc_id AND user_role.user_id = ?
        LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
        LEFT JOIN users creator ON creator_role.user_id = creator.id
        LEFT JOIN units unit_scope ON d.unit_scope = unit_scope.id
        WHERE user_role.role IN ('Reviewer', 'Approver')
          AND (
            -- Admin sebagai Reviewer hanya lihat SOP yang submitted_for_review
            (user_role.role = 'Reviewer' AND d.review_status = 'submitted_for_review') OR
            -- Admin sebagai Approver hanya lihat SOP yang reviewer_approved
            (user_role.role = 'Approver' AND d.review_status = 'reviewer_approved')
          )
        ORDER BY d.updated_at DESC
      `;
      params = [userId];
    } else {
      // User biasa lihat SOP yang perlu dia review berdasarkan role
      query = `
        SELECT DISTINCT
          d.id,
          d.sop_code,
          d.title,
          d.review_status,
          d.created_at,
          d.updated_at,
          creator.name as creator_name,
          unit_scope.nama_unit as unit_scope_name,
          ar.role as my_role
        FROM sop_documents d
        JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id 
        LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
        LEFT JOIN users creator ON creator_role.user_id = creator.id
        LEFT JOIN units unit_scope ON d.unit_scope = unit_scope.id
        WHERE ar.user_id = ? 
          AND ar.role IN ('Reviewer', 'Approver')
          AND (
            -- Reviewer dapat melihat SOP yang submitted_for_review (bukan needs_revision karena belum diajukan ulang)
            (ar.role = 'Reviewer' AND d.review_status = 'submitted_for_review') OR
            -- Approver dapat melihat SOP yang reviewer_approved
            (ar.role = 'Approver' AND d.review_status = 'reviewer_approved')
          )
        ORDER BY d.updated_at DESC
      `;
      params = [userId];
    }

    const [rows] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting pending reviews",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil detail SOP untuk review
 */
exports.getSopForReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get SOP detail dengan approval roles
    const [sopRows] = await pool.query(
      `
      SELECT 
        d.*,
        unit_scope.nama_unit as unit_scope_name,
        creator.name as creator_name,
        reviewer.name as reviewer_name,
        approver.name as approver_name
      FROM sop_documents d
      LEFT JOIN units unit_scope ON d.unit_scope = unit_scope.id
      LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
      LEFT JOIN users creator ON creator_role.user_id = creator.id
      LEFT JOIN sop_approval_roles reviewer_role ON d.id = reviewer_role.sop_doc_id AND reviewer_role.role = 'Reviewer'
      LEFT JOIN users reviewer ON reviewer_role.user_id = reviewer.id
      LEFT JOIN sop_approval_roles approver_role ON d.id = approver_role.sop_doc_id AND approver_role.role = 'Approver'
      LEFT JOIN users approver ON approver_role.user_id = approver.id
      WHERE d.id = ?
    `,
      [id]
    );

    if (sopRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "SOP document not found",
      });
    }

    // Check if user has permission to review this SOP
    const [permissionRows] = await pool.query(
      `
      SELECT role FROM sop_approval_roles 
      WHERE sop_doc_id = ? AND user_id = ? AND role IN ('Reviewer', 'Approver')
    `,
      [id, userId]
    );

    if (
      permissionRows.length === 0 &&
      req.user.role !== "admin" &&
      req.user.role !== "admin_unit"
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to review this SOP",
      });
    }

    // Get review history
    const [historyRows] = await pool.query(
      `
      SELECT 
        rh.*,
        u.name as reviewer_name,
        u.role as reviewer_role
      FROM review_history rh
      LEFT JOIN users u ON rh.reviewer_id = u.id
      WHERE rh.sop_doc_id = ?
      ORDER BY rh.created_at DESC
    `,
      [id]
    );

    const sopData = sopRows[0];
    sopData.review_history = historyRows;
    sopData.user_role =
      permissionRows.length > 0 ? permissionRows[0].role : req.user.role;

    res.status(200).json({
      success: true,
      data: sopData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting SOP for review",
      error: error.message,
    });
  }
};

/**
 * Controller untuk menyetujui SOP
 */
exports.approveSop = async (req, res) => {
  try {
    const { id } = req.params;
    const { note, effective_date } = req.body;
    const userId = req.user.id;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get current SOP status and user role
      const [sopRows] = await connection.query(
        `
        SELECT d.id, d.sop_code, d.version, d.title, d.review_status, d.created_at, d.updated_at, d.unit_scope, d.revision_type, ar.role as user_role
        FROM sop_documents d
        LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.user_id = ?
        WHERE d.id = ?
      `,
        [userId, id]
      );

      if (sopRows.length === 0) {
        throw new Error("SOP not found or you don't have permission");
      }

      const sop = sopRows[0];
      const userRole = sop.user_role;
      const revision_type = sop.revision_type;

      let newStatus;
      let nextStep;

      if (
        userRole === "Reviewer" &&
        sop.review_status === "submitted_for_review"
      ) {
        newStatus = "reviewer_approved";
        nextStep = "Approved by Reviewer, waiting for Approver";
      } else if (
        userRole === "Approver" &&
        sop.review_status === "reviewer_approved"
      ) {
        newStatus = "approved";
        nextStep = "Approved by Approver, SOP is ready to publish";

        // Validasi effective_date untuk Approver
        if (!effective_date) {
          throw new Error("Tanggal efektif harus diisi untuk pengesahan SOP");
        }

        // Validasi tanggal efektif tidak boleh di masa lalu
        const today = new Date().toISOString().split("T")[0];
        if (effective_date < today) {
          throw new Error("Tanggal efektif tidak boleh di masa lalu");
        }

        // Validasi unit_scope
        if (!sop.unit_scope) {
          throw new Error("Unit scope tidak ditemukan pada SOP ini");
        }

        // Generate kode SOP ketika disetujui oleh Approver
        const sopCode = await generateSopCode(
          sop.unit_scope,
          new Date(effective_date)
        );

        let newVersion = sop.version;

        const versionWithoutPrefix = sop.version.replace(/^V\./, "");
        const currentVersionParts = versionWithoutPrefix.split(".");
        const majorVersion = parseInt(currentVersionParts[0] || 1);

        if (revision_type === "major") {
          newVersion = `V.${majorVersion + 1}.0`;
          await connection.query(
            "UPDATE sop_documents SET version = ?, sop_code = ?, sop_applicable = ?, revision_date = NOW() WHERE id = ?",
            [newVersion, sopCode, effective_date, id]
          );
        } else {
          // Update SOP dengan tanggal efektif dan kode SOP
          await connection.query(
            "UPDATE sop_documents SET sop_code = ?, sop_applicable = ? WHERE id = ?",
            [sopCode, effective_date, id]
          );
        }

        // Update status assignment menjadi completed ketika SOP disahkan
        const [sopDoc] = await connection.query(
          "SELECT assignment_id FROM sop_documents WHERE id = ?",
          [id]
        );

        if (sopDoc.length > 0 && sopDoc[0].assignment_id) {
          await SopCreatorAssignment.markAsCompleted(sopDoc[0].assignment_id);
        }
      } else {
        throw new Error("Invalid approval workflow state");
      }

      // Update review status (tanpa update updated_at)
      await connection.query(
        "UPDATE sop_documents SET review_status = ? WHERE id = ?",
        [newStatus, id]
      );

      // Update approval date for this role
      await connection.query(
        "UPDATE sop_approval_roles SET approval_date = NOW() WHERE sop_doc_id = ? AND user_id = ?",
        [id, userId]
      );

      // Insert review history
      const reviewNote = note || nextStep;
      const finalNote =
        userRole === "Approver" && effective_date
          ? `${reviewNote} (Tanggal efektif: ${effective_date})`
          : reviewNote;

      await connection.query(
        `
        INSERT INTO review_history (sop_doc_id, reviewer_id, action, note, created_at)
        VALUES (?, ?, 'approved', ?, NOW())
      `,
        [id, userId, finalNote]
      );

      // Log activity
      await logDocumentActivity(
        req.user,
        "APPROVE",
        `${req.user.name} approved SOP "${sop.title}" as ${userRole}`,
        req,
        { id: id }
      );

      // Generate QR code untuk bukti pengesahan jika SOP sudah fully approved (disahkan oleh Approver)
      if (userRole === "Approver" && newStatus === "approved") {
        try {
          // Update approval data untuk QR code generation
          await connection.query(
            "UPDATE sop_documents SET approved_by = ?, approval_date = NOW() WHERE id = ?",
            [userId, id]
          );

          // Generate checksum untuk bukti pengesahan - gunakan connection transaksi yang sama
          const checksumResult =
            await QRCodeService.generateChecksumForApprovedSOP(id, connection);

          // Simpan checksum SHA-256 ke database
          await connection.query(
            "UPDATE sop_documents SET qr_checksum = ? WHERE id = ?",
            [checksumResult.checksum, id]
          );
        } catch (qrError) {
          console.error(
            "❌ Error generating QR checksum for approved SOP:",
            qrError
          );
          console.error("❌ QR Error details:", qrError.stack);
          // QR checksum generation error tidak menggagalkan proses approval
        }
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: `SOP approved successfully. ${nextStep}`,
        new_status: newStatus,
        effective_date: effective_date || null,
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error approving SOP",
      error: error.message,
    });
  }
};

/**
 * Controller untuk menolak/revisi SOP
 */
exports.rejectSop = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const userId = req.user.id;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: "Note is required for rejection",
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Get current SOP and user role
      const [sopRows] = await connection.query(
        `
        SELECT d.id, d.sop_code, d.title, d.review_status, d.created_at, d.updated_at, ar.role as user_role
        FROM sop_documents d
        LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.user_id = ?
        WHERE d.id = ?
      `,
        [userId, id]
      );

      if (sopRows.length === 0) {
        throw new Error("SOP not found or you don't have permission");
      }

      const sop = sopRows[0];

      // Update review status back to draft for revision (tanpa update updated_at)
      await connection.query(
        "UPDATE sop_documents SET review_status = 'needs_revision' WHERE id = ?",
        [id]
      );

      // Insert review history
      await connection.query(
        `
        INSERT INTO review_history (sop_doc_id, reviewer_id, action, note, created_at)
        VALUES (?, ?, 'rejected', ?, NOW())
      `,
        [id, userId, note]
      );

      // Log activity
      await logDocumentActivity(
        req.user,
        "REJECT",
        `${req.user.name} rejected SOP "${sop.title}" as ${sop.user_role}. Note: ${note}`,
        req,
        { id: id }
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: "SOP rejected successfully. Document sent back for revision.",
        new_status: "needs_revision",
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error rejecting SOP",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil riwayat review
 */
exports.getReviewHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT 
        rh.*,
        u.name as reviewer_name,
        u.role as reviewer_role,
        ar.role as approval_role
      FROM review_history rh
      LEFT JOIN users u ON rh.reviewer_id = u.id
      LEFT JOIN sop_approval_roles ar ON rh.sop_doc_id = ar.sop_doc_id AND rh.reviewer_id = ar.user_id
      WHERE rh.sop_doc_id = ?
      ORDER BY rh.created_at DESC
    `,
      [id]
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting review history",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil catatan revisi dari review history
 * @param {Object} req - Request object dengan parameter sop_doc_id
 * @param {Object} res - Response object
 */
exports.getRevisionNotes = async (req, res) => {
  try {
    const { sop_doc_id } = req.params;

    // Validasi parameter
    if (!sop_doc_id) {
      return res.status(400).json({
        success: false,
        message: "SOP document ID is required",
      });
    }

    // Query untuk mengambil catatan revisi yang ditolak
    const [rows] = await pool.query(
      `
      SELECT 
        rh.id,
        rh.action,
        rh.note,
        rh.created_at,
        u.name as reviewer_name,
        u.email as reviewer_email
      FROM review_history rh
      LEFT JOIN users u ON rh.reviewer_id = u.id
      WHERE rh.sop_doc_id = ? AND rh.action = 'rejected'
      ORDER BY rh.created_at DESC
    `,
      [sop_doc_id]
    );

    res.status(200).json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting revision notes",
      error: error.message,
    });
  }
};
