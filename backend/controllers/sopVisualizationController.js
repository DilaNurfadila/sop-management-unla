const db = require("../config/db");
const { validationResult } = require("express-validator");

// GET by SOP document
exports.getBySopDocId = async (req, res) => {
  const { sopDocId } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT sv.id, sv.activity_id, sv.person_id, sv.status, sv.completeness, sv.time_required,
              sv.output, sv.notes, sv.return_to_activity_id,
              u.name AS person_name, sa.name AS activity_name
       FROM sop_visualization sv
       JOIN sop_activities sa ON sv.activity_id = sa.id
       LEFT JOIN users u ON sv.person_id = u.id
       WHERE sa.sop_doc_id = ?
       ORDER BY sv.id ASC`,
      [sopDocId]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// CREATE visualization
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    activity_id,
    person_id,
    status,
    completeness,
    time_required,
    output,
    notes,
    return_to_activity_id,
  } = req.body;

  try {
    const [existing] = await db.execute(
      "SELECT * FROM sop_visualization WHERE activity_id = ? AND person_id = ?",
      [activity_id, person_id]
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ success: false, message: "Visualization already exists" });

    const [result] = await db.execute(
      `INSERT INTO sop_visualization
       (activity_id, person_id, status, completeness, time_required, output, notes, return_to_activity_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity_id,
        person_id,
        status,
        completeness,
        time_required,
        output,
        notes,
        return_to_activity_id || null,
      ]
    );

    res
      .status(201)
      .json({
        success: true,
        id: result.insertId,
        message: "Visualization created successfully",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE visualization
exports.update = async (req, res) => {
  const { id } = req.params; // sekarang pakai id unik dari sop_visualization
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ success: false, errors: errors.array() });

  const {
    status,
    completeness,
    time_required,
    output,
    notes,
    return_to_activity_id,
  } = req.body;

  try {
    const [existing] = await db.execute(
      "SELECT id FROM sop_visualization WHERE id = ?",
      [id]
    );
    if (existing.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Visualization not found" });

    await db.execute(
      `UPDATE sop_visualization
       SET status = ?, completeness = ?, time_required = ?, output = ?, notes = ?, return_to_activity_id = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        status,
        completeness,
        time_required,
        output,
        notes,
        return_to_activity_id || null,
        id,
      ]
    );

    res.json({ success: true, message: "Visualization updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE visualization
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    const [existing] = await db.execute(
      "SELECT id FROM sop_visualization WHERE id = ?",
      [id]
    );
    if (existing.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Visualization not found" });

    await db.execute("DELETE FROM sop_visualization WHERE id = ?", [id]);
    res.json({ success: true, message: "Visualization deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
