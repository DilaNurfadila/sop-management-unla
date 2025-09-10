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

    if (userRole === "admin") {
      // Admin: bisa bertindak sebagai Reviewer/Approver tanpa harus ditugaskan
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
          creator_unit.nama_unit as unit_name,
          CASE 
            WHEN d.review_status = 'submitted_for_review' THEN 'Reviewer'
            WHEN d.review_status = 'reviewer_approved' THEN 'Approver'
            ELSE NULL
          END as my_role
        FROM sop_documents d
        LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
        LEFT JOIN users creator ON creator_role.user_id = creator.id
        LEFT JOIN units creator_unit ON creator.unit = creator_unit.id
        LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
        LEFT JOIN units unit_scope ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope.id
        WHERE d.review_status IN ('submitted_for_review','reviewer_approved')
        ORDER BY d.updated_at DESC
      `;
      params = [];
    } else if (userRole === "admin_unit") {
      // Admin unit: hanya untuk lingkup unitnya, tanpa harus ditugaskan
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
          creator_unit.nama_unit as unit_name,
          CASE 
            WHEN d.review_status = 'submitted_for_review' THEN 'Reviewer'
            WHEN d.review_status = 'reviewer_approved' THEN 'Approver'
            ELSE NULL
          END as my_role
        FROM sop_documents d
        LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
        LEFT JOIN users creator ON creator_role.user_id = creator.id
        LEFT JOIN units creator_unit ON creator.unit = creator_unit.id
        LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
        LEFT JOIN units unit_scope ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope.id
        WHERE COALESCE(d.unit_scope, sca.unit_scope) = ?
          AND d.review_status IN ('submitted_for_review','reviewer_approved')
        ORDER BY d.updated_at DESC
      `;
      params = [req.user.unit];
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
          creator_unit.nama_unit as unit_name,
          ar.role as my_role
        FROM sop_documents d
        JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id 
        LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
  LEFT JOIN users creator ON creator_role.user_id = creator.id
  LEFT JOIN units creator_unit ON creator.unit = creator_unit.id
  -- Gunakan unit_scope dari dokumen jika ada, jika tidak pakai dari penugasan penyusun (via assignment)
  LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
        LEFT JOIN units unit_scope ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope.id
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
        -- Gunakan unit_scope dari dokumen jika ada, jika tidak pakai dari penugasan penyusun
          unit_scope.nama_unit as unit_scope_name,
          creator_unit.nama_unit as unit_name,
        creator.name as creator_name,
        reviewer.name as reviewer_name,
        approver.name as approver_name
      FROM sop_documents d
  LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
      LEFT JOIN units unit_scope ON COALESCE(d.unit_scope, sca.unit_scope) = unit_scope.id
      LEFT JOIN sop_approval_roles creator_role ON d.id = creator_role.sop_doc_id AND creator_role.role = 'Creator'
      LEFT JOIN users creator ON creator_role.user_id = creator.id
  LEFT JOIN units creator_unit ON creator.unit = creator_unit.id
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
        SELECT 
          d.id, d.sop_code, d.version, d.title, d.review_status, d.created_at, d.updated_at,
          d.unit_scope, d.revision_type, ar.role as user_role,
          COALESCE(d.unit_scope, sca.unit_scope) AS effective_unit_scope
        FROM sop_documents d
        LEFT JOIN sop_approval_roles ar ON d.id = ar.sop_doc_id AND ar.user_id = ?
        LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
        WHERE d.id = ?
      `,
        [userId, id]
      );

      if (sopRows.length === 0) {
        throw new Error("SOP not found or you don't have permission");
      }

      // If user has multiple roles (Reviewer & Approver), determine role to act as
      const roles = sopRows
        .map((r) => r.user_role)
        .filter((r) => r === "Reviewer" || r === "Approver");

      const sop = sopRows[0];
      let userRole = sop.user_role;
      if (roles.length > 1) {
        // Prefer explicit role provided by client
        const requestedRole = req.body?.act_as;
        if (requestedRole && roles.includes(requestedRole)) {
          userRole = requestedRole;
        } else {
          // Infer based on current review status
          if (sop.review_status === "submitted_for_review") {
            userRole = "Reviewer";
          } else if (sop.review_status === "reviewer_approved") {
            userRole = "Approver";
          }
        }
      } else if (
        !userRole &&
        (req.user.role === "admin" || req.user.role === "admin_unit")
      ) {
        // Izinkan admin/admin_unit bertindak sesuai status SOP saat ini
        if (sop.review_status === "submitted_for_review") {
          userRole = "Reviewer";
        } else if (sop.review_status === "reviewer_approved") {
          userRole = "Approver";
        }
      }
      // revision_type is no longer used here; versioning handled elsewhere

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
          const err = new Error(
            "Tanggal efektif harus diisi untuk pengesahan SOP"
          );
          err.httpStatus = 400;
          throw err;
        }

        // Validasi tanggal efektif tidak boleh di masa lalu
        const today = new Date().toISOString().split("T")[0];
        if (effective_date < today) {
          const err = new Error("Tanggal efektif tidak boleh di masa lalu");
          err.httpStatus = 400;
          throw err;
        }

        // Validasi unit_scope (gunakan fallback dari assignment)
        const effectiveUnitScope = sop.effective_unit_scope;
        if (!effectiveUnitScope) {
          const err = new Error("Unit scope tidak ditemukan pada SOP ini");
          err.httpStatus = 400;
          throw err;
        }

        // Pastikan unit_scope pada dokumen terisi untuk konsistensi data
        await connection.query(
          "UPDATE sop_documents SET unit_scope = ? WHERE id = ? AND unit_scope IS NULL",
          [effectiveUnitScope, id]
        );

        // Jika ini revisi MAJOR (ditandai oleh revision_type = 'major'), naikan versi MAJOR sekarang
        if (sop.revision_type === "major") {
          try {
            const verStr = (sop.version || "").replace(/^V\./, "");
            const [majStr] = verStr.split(".");
            const maj = parseInt(majStr || "1", 10);
            const bumped = `V.${isNaN(maj) ? 1 : maj + 1}.0`;
            await connection.query(
              "UPDATE sop_documents SET version = ?, revision_type = NULL WHERE id = ?",
              [bumped, id]
            );
          } catch (e) {
            const err = new Error(
              "Gagal menaikkan versi major saat pengesahan"
            );
            err.httpStatus = 400;
            throw err;
          }
        }

        // Generate sop_code HANYA sekali (saat pertama kali disahkan). Jika sudah ada, jangan diubah.
        if (!sop.sop_code) {
          let sopCode;
          try {
            sopCode = await generateSopCode(
              effectiveUnitScope,
              new Date(effective_date)
            );
          } catch (genErr) {
            const msg =
              genErr.message ||
              "Gagal membuat Kode SOP. Cek Unit Scope dan tanggal efektif.";
            const err = new Error(msg);
            err.httpStatus = 400;
            throw err;
          }

          // Set sop_code pertama kali dengan retry jika duplicate
          let updated = false;
          let attempt = 0;
          let currentCode = sopCode;
          while (!updated && attempt < 3) {
            try {
              await connection.query(
                "UPDATE sop_documents SET sop_code = ?, sop_applicable = ? WHERE id = ?",
                [currentCode, effective_date, id]
              );
              updated = true;
            } catch (e) {
              if (e && (e.code === "ER_DUP_ENTRY" || e.errno === 1062)) {
                attempt += 1;
                const parts = currentCode.split("/");
                const last = parts.pop();
                const next = String((parseInt(last, 10) || 0) + 1).padStart(
                  2,
                  "0"
                );
                parts.push(next);
                currentCode = parts.join("/");
              } else {
                throw e;
              }
            }
          }
          if (!updated) {
            const err = new Error(
              "Gagal menetapkan Kode SOP unik setelah beberapa percobaan"
            );
            err.httpStatus = 409;
            throw err;
          }
        } else {
          // Sudah punya sop_code: hanya update tanggal efektif
          await connection.query(
            "UPDATE sop_documents SET sop_applicable = ? WHERE id = ?",
            [effective_date, id]
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
        const err = new Error(
          `Alur persetujuan tidak valid untuk status saat ini: ${sop.review_status}`
        );
        err.httpStatus = 400;
        throw err;
      }

      // Update review status dan status SOP ketika approved
      if (newStatus === "approved") {
        // Ketika SOP disahkan, ubah status dari draft ke unpublished dan set approval_date
        await connection.query(
          "UPDATE sop_documents SET review_status = ?, status = 'unpublished', approval_date = NOW() WHERE id = ?",
          [newStatus, id]
        );
      } else {
        // Update review status saja untuk step lainnya
        await connection.query(
          "UPDATE sop_documents SET review_status = ? WHERE id = ?",
          [newStatus, id]
        );
      }

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
    const status = error.httpStatus || 500;
    res.status(status).json({
      success: false,
      message: error.message || "Error approving SOP",
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
