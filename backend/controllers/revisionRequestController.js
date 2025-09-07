const pool = require("../config/db");
const { logDocumentActivity } = require("./activityLogController");

/**
 * Controller untuk mengajukan revision request
 */
exports.submitRevisionRequest = async (req, res) => {
  try {
    const { id } = req.params; // SOP document ID
    const { request_reason } = req.body;
    const requester_id = req.user.id; // Validasi SOP exists and is approved
    const [sopRows] = await pool.query(
      `SELECT id, title, review_status, status 
       FROM sop_documents 
       WHERE id = ? AND review_status = 'approved'`,
      [id]
    );

    if (sopRows.length === 0) {
      return res.status(404).json({
        message: "SOP document not found or not approved yet",
      });
    }

    const sopDoc = sopRows[0];

    // Check if there's already a pending revision request
    const [existingRequest] = await pool.query(
      `SELECT id, status FROM revision_requests 
       WHERE sop_doc_id = ? AND status = 'pending'`,
      [id]
    );

    if (existingRequest.length > 0) {
      return res.status(400).json({
        message: "There is already a pending revision request for this SOP",
        existing_request_id: existingRequest[0].id,
      });
    }

    // Create new revision request
    const [requestResult] = await pool.query(
      `INSERT INTO revision_requests (sop_doc_id, requester_id, request_reason) 
       VALUES (?, ?, ?)`,
      [id, requester_id, request_reason]
    );

    const revision_request_id = requestResult.insertId;

    // Log activity
    await logDocumentActivity(
      req.user,
      "REVISION_REQUEST",
      `User ${req.user.name} submitted revision request for SOP "${sopDoc.title}"`,
      req,
      {
        id: id,
        revision_request_id: revision_request_id,
        reason: request_reason,
      }
    );

    res.status(201).json({
      message: "Revision request submitted successfully",
      revision_request_id: revision_request_id,
      sop_doc_id: id,
      status: "pending",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error submitting revision request",
      error: error.message,
    });
  }
};

/**
 * Controller untuk approve revision request
 */
exports.approveRevisionRequest = async (req, res) => {
  try {
    const { id } = req.params; // revision_request ID
    const { notes } = req.body;
    const approver_id = req.user.id; // Get revision request details
    const [requestRows] = await pool.query(
      `SELECT rr.*, d.title as sop_title, u.name as requester_name
       FROM revision_requests rr
       JOIN sop_documents d ON rr.sop_doc_id = d.id
       JOIN users u ON rr.requester_id = u.id
       WHERE rr.id = ? AND rr.status = 'pending'`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Revision request not found or already processed",
      });
    }

    const request = requestRows[0];

    // Update revision request status
    await pool.query(
      `UPDATE revision_requests 
       SET status = 'approved', approved_by = ?, approved_date = NOW(), notes = ?
       WHERE id = ?`,
      [approver_id, notes, id]
    );

    // Update SOP document to reference this approved revision request
    await pool.query(
      `UPDATE sop_documents 
       SET current_revision_request_id = ?
       WHERE id = ?`,
      [id, request.sop_doc_id]
    );

    // Log activity
    await logDocumentActivity(
      req.user,
      "REVISION_APPROVED",
      `Admin ${req.user.name} approved revision request for SOP "${request.sop_title}"`,
      req,
      {
        id: request.sop_doc_id,
        revision_request_id: id,
        requester: request.requester_name,
      }
    );

    res.status(200).json({
      message: "Revision request approved successfully",
      revision_request_id: id,
      sop_doc_id: request.sop_doc_id,
      status: "approved",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error approving revision request",
      error: error.message,
    });
  }
};

/**
 * Controller untuk reject revision request
 */
exports.rejectRevisionRequest = async (req, res) => {
  try {
    const { id } = req.params; // revision_request ID
    const { notes } = req.body;
    const approver_id = req.user.id; // Get revision request details
    const [requestRows] = await pool.query(
      `SELECT rr.*, d.title as sop_title, u.name as requester_name
       FROM revision_requests rr
       JOIN sop_documents d ON rr.sop_doc_id = d.id
       JOIN users u ON rr.requester_id = u.id
       WHERE rr.id = ? AND rr.status = 'pending'`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Revision request not found or already processed",
      });
    }

    const request = requestRows[0];

    // Update revision request status
    await pool.query(
      `UPDATE revision_requests 
       SET status = 'rejected', approved_by = ?, approved_date = NOW(), notes = ?
       WHERE id = ?`,
      [approver_id, notes, id]
    );

    // Log activity
    await logDocumentActivity(
      req.user,
      "REVISION_REJECTED",
      `Admin ${req.user.name} rejected revision request for SOP "${request.sop_title}"`,
      req,
      {
        id: request.sop_doc_id,
        revision_request_id: id,
        requester: request.requester_name,
      }
    );

    res.status(200).json({
      message: "Revision request rejected",
      revision_request_id: id,
      sop_doc_id: request.sop_doc_id,
      status: "rejected",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error rejecting revision request",
      error: error.message,
    });
  }
};

/**
 * Controller untuk get pending revision requests
 */
exports.getPendingRevisionRequests = async (req, res) => {
  try {
    const [requests] = await pool.query(`
      SELECT 
        rr.*,
        d.title as sop_title,
        d.sop_code,
        u.name as requester_name,
        u.email as requester_email
      FROM revision_requests rr
      JOIN sop_documents d ON rr.sop_doc_id = d.id
      JOIN users u ON rr.requester_id = u.id
      WHERE rr.status = 'pending'
      ORDER BY rr.request_date DESC
    `);

    res.status(200).json({
      message: "Pending revision requests retrieved successfully",
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting pending revision requests",
      error: error.message,
    });
  }
};

/**
 * Controller untuk get revision request history for a SOP
 */
exports.getRevisionRequestHistory = async (req, res) => {
  try {
    const { id } = req.params; // SOP document ID

    const [history] = await pool.query(
      `
      SELECT 
        rr.*,
        requester.name as requester_name,
        approver.name as approver_name
      FROM revision_requests rr
      JOIN users requester ON rr.requester_id = requester.id
      LEFT JOIN users approver ON rr.approved_by = approver.id
      WHERE rr.sop_doc_id = ?
      ORDER BY rr.request_date DESC
    `,
      [id]
    );

    res.status(200).json({
      message: "Revision request history retrieved successfully",
      data: history,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error getting revision request history",
      error: error.message,
    });
  }
};
