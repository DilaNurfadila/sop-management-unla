// controllers/flowchartController.js
const db = require("../config/db");

// ===============================
// SOP ACTIVITIES
// ===============================
exports.getSopActivities = async (req, res) => {
  const { sop_doc_id } = req.query;
  if (!sop_doc_id)
    return res.status(400).json({ message: "sop_doc_id is required" });
  const query =
    "SELECT id, name, sop_doc_id, order_index FROM sop_activities WHERE sop_doc_id = ? ORDER BY order_index ASC";
  try {
    const [rows] = await db.execute(query, [sop_doc_id]);
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving activities", error: error.message });
  }
};

exports.createSopActivity = async (req, res) => {
  const { name, sop_doc_id } = req.body;
  if (!name || !sop_doc_id)
    return res
      .status(400)
      .json({ message: "Name and sop_doc_id are required" });
  try {
    const [result] = await db.execute(
      "INSERT INTO sop_activities (name, sop_doc_id) VALUES (?, ?)",
      [name, sop_doc_id]
    );
    res
      .status(201)
      .json({ id: result.insertId, message: "Activity created successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating activity", error: error.message });
  }
};

exports.updateSopActivity = async (req, res) => {
  const { id } = req.params;
  const { name, order_index } = req.body;
  try {
    const [result] = await db.execute(
      "UPDATE sop_activities SET name = ?, order_index = ? WHERE id = ?",
      [name, order_index, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Activity not found" });
    res.json({ message: "Activity updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating activity", error: error.message });
  }
};

exports.deleteSopActivity = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute(
      "DELETE FROM sop_activities WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Activity not found" });
    res.json({ message: "Activity deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting activity", error: error.message });
  }
};

// ===============================
// SOP RESPONSIBLE PERSON
// ===============================
exports.getSopResponsiblePersons = async (req, res) => {
  const { sop_doc_id } = req.query;
  if (!sop_doc_id)
    return res.status(400).json({ message: "sop_doc_id is required" });

  const query = `
    SELECT rp.id, rp.user_id, rp.role, u.name AS user_name, u.position AS user_position, un.nama_unit AS user_unit
    FROM sop_responsible_person rp
    LEFT JOIN users u ON rp.user_id = u.id
    LEFT JOIN units un ON u.unit = un.id
    WHERE rp.sop_doc_id = ?
    ORDER BY rp.created_at ASC
  `;
  try {
    const [rows] = await db.execute(query, [sop_doc_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving responsible persons",
      error: error.message,
    });
  }
};

exports.getAvailableUsers = async (req, res) => {
  const query = `
    SELECT u.id, u.name, u.position, un.nama_unit AS unit
    FROM users u
    LEFT JOIN units un ON u.unit = un.id
    ORDER BY u.name ASC
  `;
  try {
    const [rows] = await db.execute(query);
    res.json(rows);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving users", error: error.message });
  }
};

exports.createSopResponsiblePerson = async (req, res) => {
  const { user_id, sop_doc_id } = req.body;
  if (!user_id || !sop_doc_id)
    return res
      .status(400)
      .json({ message: "user_id and sop_doc_id are required" });

  try {
    const [result] = await db.execute(
      "INSERT INTO sop_responsible_person (user_id, sop_doc_id) VALUES (?, ?)",
      [user_id, sop_doc_id]
    );
    res.status(201).json({
      id: result.insertId,
      message: "Responsible person created successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating responsible person",
      error: error.message,
    });
  }
};

exports.updateSopResponsiblePerson = async (req, res) => {
  const { id } = req.params;
  const { user_id, role = "Pelaksana" } = req.body;

  try {
    const [result] = await db.execute(
      "UPDATE sop_responsible_person SET user_id = ?, role = ? WHERE id = ?",
      [user_id, role, id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Responsible person not found" });
    res.json({ message: "Responsible person updated successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error updating responsible person",
      error: error.message,
    });
  }
};

exports.deleteSopResponsiblePerson = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.execute(
      "DELETE FROM sop_responsible_person WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Responsible person not found" });
    res.json({ message: "Responsible person deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting responsible person",
      error: error.message,
    });
  }
};

// ===============================
// SOP VISUALIZATION
// ===============================
exports.getSopVisualizations = async (req, res) => {
  const { sop_doc_id } = req.query;
  if (!sop_doc_id)
    return res.status(400).json({ message: "sop_doc_id is required" });

  const query = `
    SELECT sv.id, sv.activity_id, sv.person_id, sv.status, sv.completeness, sv.time_required,
           sv.output, sv.notes, sv.return_to_activity_id
    FROM sop_visualization sv
    JOIN sop_activities sa ON sv.activity_id = sa.id
    WHERE sa.sop_doc_id = ?
  `;
  try {
    const [rows] = await db.execute(query, [sop_doc_id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving visualization data",
      error: error.message,
    });
  }
};

exports.saveBulkVisualizations = async (req, res) => {
  const { visualizations, sop_doc_id } = req.body;
  if (!Array.isArray(visualizations) || !sop_doc_id)
    return res
      .status(400)
      .json({ message: "visualizations and sop_doc_id are required" });

  const connection = await db.getConnection();
  await connection.beginTransaction();
  try {
    await connection.execute(
      `DELETE FROM sop_visualization WHERE activity_id IN (SELECT id FROM sop_activities WHERE sop_doc_id = ?)`,
      [sop_doc_id]
    );

    const insertQuery = `
      INSERT INTO sop_visualization
      (activity_id, person_id, status, completeness, time_required, output, notes, return_to_activity_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const v of visualizations) {
      await connection.execute(insertQuery, [
        v.activity_id ?? null,
        v.person_id ?? null,
        v.status ?? null,
        v.completeness ?? null,
        v.time_required ?? null,
        v.output ?? null,
        v.notes ?? null,
        v.return_to_activity_id ?? null,
      ]);
    }

    await connection.commit();
    res.json({
      message: "Visualizations saved successfully",
      count: visualizations.length,
    });
  } catch (error) {
    await connection.rollback();
    res
      .status(500)
      .json({ message: "Error saving visualizations", error: error.message });
  } finally {
    connection.release();
  }
};
