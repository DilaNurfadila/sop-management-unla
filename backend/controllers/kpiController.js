const pool = require("../config/db");
const SopArchive = require("../models/SopArchive");
const ActivityLog = require("../models/ActivityLog");

/**
 * GET /api/kpi/summary
 * Mengembalikan ringkasan KPI untuk Dashboard.
 * - SOP counts (total, published, unpublished, draft, archived)
 * - Archive stats (total_archived, total_active, documents_with_archives)
 * - Feedback stats (total_feedback, average_rating, pending_feedback)
 * - User stats (hanya untuk superadmin/admin)
 * - Activity stats (hanya untuk superadmin)
 */
exports.getKpiSummary = async (req, res) => {
  try {
    const role = req.user?.role || "user";
    const unitId = req.user?.unit || null;
    const userId = req.user?.id || null;

    // Helper untuk menambahkan filter per role
    // KPI dihitung dari seluruh SOP tanpa pembatasan role/unit
    const scope = {
      where: "",
      params: [],
    };

    // SOP counts
    const sopCountsQuery = `
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN d.status = 'published' THEN 1 ELSE 0 END) AS published,
        SUM(CASE WHEN d.status = 'unpublished' THEN 1 ELSE 0 END) AS unpublished,
        SUM(CASE WHEN d.status = 'draft' THEN 1 ELSE 0 END) AS draft,
        SUM(CASE WHEN d.status = 'archived' THEN 1 ELSE 0 END) AS archived
      FROM sop_documents d
      ${scope.where}
    `;
    const [sopCountsRows] = await pool.query(sopCountsQuery, scope.params);
    const sop = sopCountsRows[0] || {
      total: 0,
      published: 0,
      unpublished: 0,
      draft: 0,
      archived: 0,
    };

    // Archive stats: gunakan ruang lingkup global (semua SOP)
    const archivesStats = await SopArchive.getArchiveStats("admin", null);

    // Feedback stats
    const feedbackCountsQuery = `
      SELECT 
        COUNT(*) AS total_feedback,
        AVG(f.rating) AS average_rating,
        SUM(CASE WHEN COALESCE(f.status, 'pending') = 'pending' THEN 1 ELSE 0 END) AS pending_feedback
      FROM sop_feedback f
      LEFT JOIN sop_documents d ON f.sop_id = d.id
      ${scope.where}
    `;
    const [feedbackRows] = await pool.query(feedbackCountsQuery, scope.params);
    const feedback = {
      total_feedback: feedbackRows[0]?.total_feedback || 0,
      average_rating: parseFloat(feedbackRows[0]?.average_rating || 0).toFixed(
        1
      ),
      pending_feedback: feedbackRows[0]?.pending_feedback || 0,
    };

    // User stats (only for superadmin/admin)
    let users = null;
    if (role === "superadmin" || role === "admin") {
      const [userStatsRows] = await pool.query(
        `SELECT 
            SUM(CASE WHEN u.role = 'admin' THEN 1 ELSE 0 END) AS admin,
            SUM(CASE WHEN u.role = 'admin_unit' THEN 1 ELSE 0 END) AS admin_unit,
            SUM(CASE WHEN u.role = 'user' THEN 1 ELSE 0 END) AS user,
            SUM(CASE WHEN u.role NOT LIKE 'disabled:%' AND u.role != 'superadmin' THEN 1 ELSE 0 END) AS total
         FROM users u`
      );
      users = userStatsRows[0];
    }

    // Overall completion KPI (global, tanpa due date)
    const [overallRows] = await pool.query(
      `SELECT 
         AVG(TIMESTAMPDIFF(DAY, sd.created_at, sd.published_at)) AS avg_completion_days,
         COUNT(*) AS completed_docs
       FROM sop_documents sd
       WHERE sd.created_at IS NOT NULL AND sd.published_at IS NOT NULL`
    );
    const overall = {
      avg_completion_days: overallRows[0]?.avg_completion_days
        ? Number(parseFloat(overallRows[0].avg_completion_days).toFixed(1))
        : 0,
      completed_docs: overallRows[0]?.completed_docs || 0,
    };

    // Activity stats (only for superadmin)
    let activity = null;
    if (role === "superadmin") {
      const stats = await ActivityLog.getStats(7);
      activity = {
        last_7_days_total: stats?.total || 0,
        by_module: stats?.by_module || [],
      };
    }

    // SLA / Time-based KPIs untuk seluruh SOP (tanpa pembatasan role/unit)
    let assignmentWhere = "";
    const assignmentParams = [];

    const dueSoonDays = 7;

    // Active, overdue, due soon counts
    const assignmentCountsQuery = `
      SELECT 
        SUM(CASE WHEN sca.status IN ('pending','accepted') THEN 1 ELSE 0 END) AS active_assignments,
        SUM(CASE WHEN sca.status IN ('pending','accepted') AND sca.due_date IS NOT NULL AND sca.due_date < NOW() THEN 1 ELSE 0 END) AS overdue_assignments,
        SUM(CASE WHEN sca.status IN ('pending','accepted') AND sca.due_date IS NOT NULL AND sca.due_date >= NOW() AND sca.due_date < DATE_ADD(NOW(), INTERVAL ? DAY) THEN 1 ELSE 0 END) AS due_soon_assignments
      FROM sop_creator_assignments sca
      ${assignmentWhere}
    `;
    const [assignmentCountsRows] = await pool.query(assignmentCountsQuery, [
      dueSoonDays,
      ...assignmentParams,
    ]);
    const assignmentCounts = assignmentCountsRows[0] || {
      active_assignments: 0,
      overdue_assignments: 0,
      due_soon_assignments: 0,
    };

    // Lead time averages (days)
    const leadTimesQuery = `
      SELECT 
        AVG(CASE WHEN sd.created_at IS NOT NULL THEN TIMESTAMPDIFF(DAY, sca.created_at, sd.created_at) END) AS avg_creation_days,
        AVG(CASE WHEN sd.approval_date IS NOT NULL THEN TIMESTAMPDIFF(DAY, sca.created_at, sd.approval_date) END) AS avg_approval_days,
        AVG(CASE WHEN sd.published_at IS NOT NULL THEN TIMESTAMPDIFF(DAY, sca.created_at, sd.published_at) END) AS avg_publish_days,
        AVG(CASE WHEN sca.due_date IS NOT NULL AND sd.created_at IS NOT NULL THEN TIMESTAMPDIFF(DAY, sca.due_date, sd.created_at) END) AS avg_creation_delta_days
      FROM sop_creator_assignments sca
      JOIN sop_documents sd ON sd.assignment_id = sca.id
      ${assignmentWhere}
    `;
    const [leadRows] = await pool.query(leadTimesQuery, assignmentParams);
    const lead = leadRows[0] || {};

    // SLA compliance for creation relative to due_date
    const creationSlaQuery = `
      SELECT 
        SUM(CASE WHEN sca.due_date IS NOT NULL AND sd.created_at IS NOT NULL THEN 1 ELSE 0 END) AS total,
        SUM(CASE WHEN sca.due_date IS NOT NULL AND sd.created_at IS NOT NULL AND sd.created_at <= sca.due_date THEN 1 ELSE 0 END) AS on_time
      FROM sop_creator_assignments sca
      LEFT JOIN sop_documents sd ON sd.assignment_id = sca.id
      ${assignmentWhere}
    `;
    const [slaRows] = await pool.query(creationSlaQuery, assignmentParams);
    const slaTotal = slaRows[0]?.total || 0;
    const slaOnTime = slaRows[0]?.on_time || 0;
    const creationSlaRate =
      slaTotal > 0 ? Number(((slaOnTime / slaTotal) * 100).toFixed(1)) : 0;

    res.status(200).json({
      success: true,
      data: {
        sop,
        archives: {
          total_archived: archivesStats.total_archived || 0,
          total_active: archivesStats.total_active || 0,
          documents_with_archives: archivesStats.documents_with_archives || 0,
        },
        feedback,
        users, // can be null if not authorized
        activity, // can be null if not authorized
        overall, // global rata-rata penyelesaian (created->published)
        sla: {
          active_assignments: assignmentCounts.active_assignments || 0,
          overdue_assignments: assignmentCounts.overdue_assignments || 0,
          due_soon_assignments: assignmentCounts.due_soon_assignments || 0,
          avg_creation_days: lead.avg_creation_days
            ? Number(parseFloat(lead.avg_creation_days).toFixed(1))
            : 0,
          avg_approval_days: lead.avg_approval_days
            ? Number(parseFloat(lead.avg_approval_days).toFixed(1))
            : 0,
          avg_publish_days: lead.avg_publish_days
            ? Number(parseFloat(lead.avg_publish_days).toFixed(1))
            : 0,
          avg_creation_delta_days:
            lead.avg_creation_delta_days !== null &&
            lead.avg_creation_delta_days !== undefined
              ? Number(parseFloat(lead.avg_creation_delta_days).toFixed(1))
              : 0,
          creation_sla: {
            on_time: slaOnTime,
            total: slaTotal,
            rate_percent: creationSlaRate,
          },
          due_soon_days: dueSoonDays,
        },
      },
    });
  } catch (error) {
    console.error("Error building KPI summary:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil ringkasan KPI",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
