/**
 * File: sopCreatorController.js
 * Ringkasan: Kelola penugasan penyusunan SOP dan peran reviewer/approver:
 * - Menyeleksi user menurut role admin/admin_unit
 * - Membuat penugasan (create/revise) beserta reviewer/approver dan due date
 * - Melihat penugasan untuk admin/assignee, memperbarui status, dan menghapus
 * - Email notifikasi penugasan (best-effort)
 */
// Import models
const User = require("../models/User");
const SopCreatorAssignment = require("../models/SopCreatorAssignment");
const SopDoc = require("../models/SopDoc");
const Unit = require("../models/Unit");
const ActivityLog = require("../models/ActivityLog");
const { sendAssignmentNotificationEmail } = require("../config/emailService");

/**
 * Controller untuk mengambil daftar pengguna berdasarkan role admin
 * - Admin penuh: Semua user dengan info unit
 * - Admin unit: Hanya user dalam unit yang sama
 * @param {Object} req - Request object dengan user info dari middleware auth
 * @param {Object} res - Response object
 */
exports.getUsersByAdminUnit = async (req, res) => {
  try {
    // Ambil user_id dan role dari JWT token
    const adminUserId = req.user.id;
    const adminRole = req.user.role;

    let users;

    if (adminRole === "admin") {
      // Admin penuh: ambil semua user dengan info unit
      users = await User.findAllUsersWithUnit();
    } else if (adminRole === "admin_unit") {
      // Admin unit: ambil user dalam unit yang sama saja
      users = await User.findByAdminUnit(adminUserId);
    } else {
      return res.status(403).json({
        message:
          "Access denied. Only admin or admin_unit can access this endpoint.",
      });
    }

    // Kirim response sukses
    res.status(200).json({
      message: "Users retrieved successfully",
      data: users,
      count: users.length,
      admin_user_id: adminUserId,
      admin_role: adminRole,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving users",
      error: error.message,
    });
  }
};

/**
 * Controller untuk menugaskan pengguna sebagai creator SOP
 * @param {Object} req - Request object dengan data penugasan
 * @param {Object} res - Response object
 */
exports.assignSopCreator = async (req, res) => {
  try {
    // Ambil data dari request body
    const {
      assigned_to,
      notes,
      due_date,
      task_type,
      sop_to_revise,
      reviewer_id,
      approver_id,
      unit_scope,
    } = req.body;
    const assignedBy = req.user.id;

    // Validasi input
    if (!assigned_to || !notes || !reviewer_id || !approver_id || !unit_scope) {
      return res.status(400).json({
        message:
          "assigned_to, notes, reviewer_id, approver_id, and unit_scope are required",
      });
    }

    // Validasi bahwa penyusun tidak sama dengan pemeriksa atau pengesah
    if (assigned_to === reviewer_id || assigned_to === approver_id) {
      return res.status(400).json({
        message: "Creator cannot be the same as reviewer or approver",
      });
    }

    // Validasi task_type
    const validTaskTypes = ["create", "revise"];
    const taskType = task_type || "create";
    if (!validTaskTypes.includes(taskType)) {
      return res.status(400).json({
        message: "task_type must be 'create' or 'revise'",
      });
    }

    // Validasi sop_to_revise jika task_type adalah 'revise'
    if (taskType === "revise") {
      if (!sop_to_revise) {
        return res.status(400).json({
          message: "sop_to_revise is required when task_type is 'revise'",
        });
      }

      // Cek apakah SOP yang akan direvisi ada dan sudah approved
      const sopToRevise = await SopDoc.findById(sop_to_revise);
      if (!sopToRevise) {
        return res.status(404).json({
          message: "SOP to revise not found",
        });
      }

      if (sopToRevise.review_status !== "approved") {
        return res.status(400).json({
          message: "Only approved SOPs can be assigned for revision",
        });
      }
    }

    // Cek apakah user yang ditugaskan ada
    const targetUser = await User.findById(assigned_to);
    if (!targetUser) {
      return res.status(404).json({
        message: "Target user not found",
      });
    }

    // Cek apakah reviewer ada
    const reviewerUser = await User.findById(reviewer_id);
    if (!reviewerUser) {
      return res.status(404).json({
        message: "Reviewer user not found",
      });
    }

    // Cek apakah approver ada
    const approverUser = await User.findById(approver_id);
    if (!approverUser) {
      return res.status(404).json({
        message: "Approver user not found",
      });
    }

    // Validasi unit hanya untuk admin_unit, admin penuh bisa assign ke siapa saja
    if (req.user.role === "admin_unit") {
      const adminUser = await User.findById(assignedBy);
      if (adminUser.unit !== targetUser.unit) {
        return res.status(403).json({
          message: "Admin unit can only assign users within the same unit",
        });
      }
    }
    // Admin penuh tidak perlu validasi unit - bisa assign ke user manapun

    // Proses due_date: jika kosong atau tidak valid, set ke null
    let processedDueDate = null;
    if (due_date && due_date.trim() !== "") {
      processedDueDate = due_date;
    }

    // Buat penugasan baru
    const assignment = new SopCreatorAssignment(
      assignedBy,
      assigned_to,
      notes,
      "pending",
      processedDueDate,
      taskType,
      taskType === "revise" ? sop_to_revise : null,
      reviewer_id,
      approver_id,
      unit_scope
    );

    const result = await assignment.save();

    // Activity log (best-effort)
    try {
      await ActivityLog.logUserActivity(
        req.user.id,
        req.user.name || "",
        req.user.role || "",
        "CREATE",
        "ASSIGNMENT",
        `Membuat penugasan ${taskType} SOP untuk ${targetUser.name} sebagai Penyusun (Reviewer: ${reviewerUser.name}, Pengesah: ${approverUser.name})`,
        req,
        result.id,
        "sop_creator_assignment"
      );
    } catch (e) {}

    // Kirim email notifikasi (best-effort, non-blocking)
    const frontendUrl = process.env.FRONTEND_URL;
    // Get unit scope name if available (best-effort)
    let unitScopeName = undefined;
    try {
      if (unit_scope) {
        const unitInfo = await Unit.findById(unit_scope);
        unitScopeName = unitInfo?.nama_unit;
      }
    } catch (e) {}

    const safeSend = async (payload) => {
      if (!payload?.to) return; // skip if no recipient email
      try {
        await sendAssignmentNotificationEmail(payload);
      } catch (e) {
        // Do not block on email failure
      }
    };

    // Prepare target SOP meta once if revise
    let targetSopData = undefined;
    if (taskType === "revise" && sop_to_revise) {
      try {
        const rev = await SopDoc.findById(sop_to_revise);
        if (rev) {
          targetSopData = {
            title: rev.title,
            sop_code: rev.sop_code,
            version: rev.version,
          };
        }
      } catch (e) {}
    }

    // Notify creator
    safeSend({
      to: targetUser.email,
      userName: targetUser.name,
      role: "creator",
      assignedByName: req.user.name || "Admin",
      notes,
      dueDate: processedDueDate || undefined,
      taskType,
      targetSop: targetSopData,
      unitScopeName,
      frontendUrl,
    });

    // Notify reviewer
    safeSend({
      to: reviewerUser.email,
      userName: reviewerUser.name,
      role: "reviewer",
      assignedByName: req.user.name || "Admin",
      taskType,
      targetSop: targetSopData,
      unitScopeName,
      frontendUrl,
    });

    // Notify approver (skip if approver is the assigner)
    if (approverUser.id !== assignedBy) {
      safeSend({
        to: approverUser.email,
        userName: approverUser.name,
        role: "approver",
        assignedByName: req.user.name || "Admin",
        taskType,
        targetSop: targetSopData,
        unitScopeName,
        frontendUrl,
      });
    }

    // Kirim response sukses
    res.status(201).json({
      message: `SOP ${taskType} assignment created successfully`,
      data: result,
      assigned_to: targetUser.name,
      task_type: taskType,
      sop_to_revise: taskType === "revise" ? sop_to_revise : null,
      notes: notes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating SOP creator assignment",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil daftar penugasan yang dibuat oleh admin
 * @param {Object} req - Request object dengan user info dari middleware auth
 * @param {Object} res - Response object
 */
exports.getAssignmentsByAdmin = async (req, res) => {
  try {
    const adminUserId = req.user.id;

    // Ambil penugasan yang dibuat oleh admin
    const assignments = await SopCreatorAssignment.findByAssigner(adminUserId);

    // Kirim response sukses
    res.status(200).json({
      message: "Assignments retrieved successfully",
      data: assignments,
      count: assignments.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving assignments",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil daftar penugasan untuk user yang login
 * @param {Object} req - Request object dengan user info dari middleware auth
 * @param {Object} res - Response object
 */
exports.getAssignmentsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil penugasan untuk user
    const assignments = await SopCreatorAssignment.findByAssignee(userId);

    // Kirim response sukses
    res.status(200).json({
      message: "User assignments retrieved successfully",
      data: assignments,
      count: assignments.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving user assignments",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengupdate status penugasan
 * @param {Object} req - Request object dengan assignment_id dan status baru
 * @param {Object} res - Response object
 */
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, response } = req.body;
    const userId = req.user.id;

    // Validasi input
    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    // Cek apakah penugasan ada dan user berhak mengupdate
    const assignment = await SopCreatorAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // Cek apakah user yang login adalah assignee
    if (assignment.assigned_to !== userId) {
      return res.status(403).json({
        message: "You can only update your own assignments",
      });
    }

    // Update status
    await SopCreatorAssignment.updateStatus(id, status, response);

    // Activity log (best-effort)
    try {
      await ActivityLog.logUserActivity(
        req.user.id,
        req.user.name || "",
        req.user.role || "",
        "UPDATE",
        "ASSIGNMENT",
        `Update status penugasan menjadi '${status}'`,
        req,
        assignment.id,
        "sop_creator_assignment"
      );
    } catch (e) {}

    // Kirim response sukses
    res.status(200).json({
      message: "Assignment status updated successfully",
      assignment_id: id,
      new_status: status,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating assignment status",
      error: error.message,
    });
  }
};

/**
 * Controller untuk menghapus penugasan (hanya oleh admin yang membuat)
 * @param {Object} req - Request object dengan assignment_id
 * @param {Object} res - Response object
 */
exports.deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Cek apakah penugasan ada dan user berhak menghapus
    const assignment = await SopCreatorAssignment.findById(id);
    if (!assignment) {
      return res.status(404).json({
        message: "Assignment not found",
      });
    }

    // Cek apakah user yang login adalah yang membuat penugasan
    if (assignment.assigned_by !== userId) {
      return res.status(403).json({
        message: "You can only delete assignments you created",
      });
    }

    // Hapus penugasan
    await SopCreatorAssignment.delete(id);

    // Kirim response sukses
    res.status(200).json({
      message: "Assignment deleted successfully",
      assignment_id: id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting assignment",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil daftar SOP yang sudah disahkan berdasarkan unit kerja admin
 * @param {Object} req - Request object dengan user info dari middleware auth
 * @param {Object} res - Response object
 */
exports.getApprovedSopsByAdminUnit = async (req, res) => {
  try {
    const adminUserId = req.user.id;
    const adminRole = req.user.role;

    // Validasi role - bisa admin atau admin_unit
    if (adminRole !== "admin_unit" && adminRole !== "admin") {
      return res.status(403).json({
        message: "Access denied. This endpoint is for admin or admin_unit only",
      });
    }

    // Ambil informasi admin untuk mendapatkan unit
    const adminInfo = await User.findById(adminUserId);
    if (!adminInfo) {
      return res.status(400).json({
        message: "Admin information not found",
      });
    }

    let sopDocuments;

    if (adminRole === "admin_unit") {
      // Admin unit: filter berdasarkan unit
      if (!adminInfo.unit) {
        return res.status(400).json({
          message: "Admin unit information not found",
        });
      }
      // adminInfo.unit sudah berupa ID unit, langsung gunakan
      sopDocuments = await SopDoc.findByUnitAndStatus(
        adminInfo.unit,
        "approved"
      );
    } else {
      // Admin biasa: ambil semua SOP approved (fallback ke method lama)
      sopDocuments = await SopDoc.findAllApprovedSops();
    }

    // Kirim response sukses
    res.status(200).json({
      message: "Approved SOPs retrieved successfully",
      data: sopDocuments,
      count: sopDocuments.length,
      unit: adminInfo.unit || "all",
      admin_role: adminRole,
    });
  } catch (error) {
    console.error("❌ Error in getApprovedSopsByAdminUnit:", error);
    res.status(500).json({
      message: "Error retrieving approved SOPs",
      error: error.message,
    });
  }
};

module.exports = exports;
