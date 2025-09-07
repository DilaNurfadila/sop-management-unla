// Import konfigurasi database connection pool
const pool = require("../config/db");

/**
 * Class untuk mengelola operasi database SOP Creator Assignments
 * Menangani penugasan creator untuk membuat SOP dengan catatan
 */
class SopCreatorAssignment {
  /**
   * Constructor untuk membuat instance SopCreatorAssignment
   * @param {number} assignedBy - ID admin yang memberikan tugas
   * @param {number} assignedTo - ID user yang ditugaskan sebagai creator
   * @param {string} notes - Catatan mengenai SOP yang ingin dibuat
   * @param {string} status - Status tugas (pending, accepted, completed, rejected)
   * @param {Date} dueDate - Tanggal deadline (opsional)
   * @param {string} taskType - Jenis tugas: 'create' atau 'revise'
   * @param {number} sopToRevise - ID SOP yang akan direvisi (jika task_type = revise)
   */
  constructor(
    assignedBy,
    assignedTo,
    notes,
    status = "pending",
    dueDate = null,
    taskType = "create",
    sopToRevise = null
  ) {
    this.assigned_by = assignedBy;
    this.assigned_to = assignedTo;
    this.notes = notes;
    this.status = status;
    this.due_date = dueDate;
    this.task_type = taskType;
    this.sop_to_revise = sopToRevise;
  }

  /**
   * Method untuk menyimpan penugasan creator baru ke database
   * @returns {Object} - Hasil insert dengan ID baru
   */
  async save() {
    const [result] = await pool.query(
      `INSERT INTO sop_creator_assignments 
       (assigned_by, assigned_to, notes, task_type, sop_to_revise, status, due_date, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        this.assigned_by,
        this.assigned_to,
        this.notes,
        this.task_type,
        this.sop_to_revise,
        this.status,
        this.due_date,
      ]
    );
    return { id: result.insertId, ...this };
  }

  /**
   * Method untuk mengambil semua penugasan creator
   * @returns {Array} - Array berisi semua penugasan
   */
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT 
        sca.*,
        assigner.name AS assigner_name,
        assignee.name AS assignee_name,
        assignee.email AS assignee_email,
        assignee.position AS assignee_position,
        u.nama_unit AS unit_name
      FROM sop_creator_assignments sca
      LEFT JOIN users assigner ON sca.assigned_by = assigner.id
      LEFT JOIN users assignee ON sca.assigned_to = assignee.id
      LEFT JOIN units u ON assignee.unit = u.id
      ORDER BY sca.created_at DESC
    `);
    return rows;
  }

  /**
   * Method untuk mengambil penugasan berdasarkan admin yang memberikan tugas
   * @param {number} adminId - ID admin
   * @returns {Array} - Array berisi penugasan yang dibuat oleh admin
   */
  static async findByAssigner(adminId) {
    const [rows] = await pool.query(
      `
      SELECT 
        sca.*,
        assigner.name AS assigner_name,
        assignee.name AS assignee_name,
        assignee.email AS assignee_email,
        assignee.position AS assignee_position,
        u.nama_unit AS unit_name,
        sd.id AS sop_document_id,
        sd.review_status AS sop_review_status,
        sd.sop_code AS sop_code,
        CASE WHEN sd.id IS NOT NULL THEN 1 ELSE 0 END AS has_sop_created,
        CASE WHEN sd.review_status = 'approved' THEN 1 ELSE 0 END AS sop_approved
      FROM sop_creator_assignments sca
      LEFT JOIN users assigner ON sca.assigned_by = assigner.id
      LEFT JOIN users assignee ON sca.assigned_to = assignee.id
      LEFT JOIN units u ON assignee.unit = u.id
      LEFT JOIN sop_documents sd ON sd.assignment_id = sca.id
      WHERE sca.assigned_by = ?
      ORDER BY sca.created_at DESC
    `,
      [adminId]
    );
    return rows;
  }

  /**
   * Method untuk mengambil penugasan berdasarkan user yang ditugaskan
   * @param {number} userId - ID user yang ditugaskan
   * @returns {Array} - Array berisi penugasan untuk user tersebut
   */
  static async findByAssignee(userId) {
    const [rows] = await pool.query(
      `
      SELECT 
        sca.*,
        assigner.name AS assigner_name,
        assignee.name AS assignee_name,
        assignee.email AS assignee_email,
        assignee.position AS assignee_position,
        u.nama_unit AS unit_name,
        sd.id AS sop_document_id,
        sd.review_status AS sop_review_status,
        sd.sop_code AS sop_code,
        CASE WHEN sd.id IS NOT NULL THEN 1 ELSE 0 END AS has_sop_created,
        CASE WHEN sd.review_status = 'approved' THEN 1 ELSE 0 END AS sop_approved,
        -- Informasi SOP yang akan direvisi
        target_sop.title AS target_sop_title,
        target_sop.sop_code AS target_sop_code,
        target_sop.version AS target_sop_version
      FROM sop_creator_assignments sca
      LEFT JOIN users assigner ON sca.assigned_by = assigner.id
      LEFT JOIN users assignee ON sca.assigned_to = assignee.id
      LEFT JOIN units u ON assignee.unit = u.id
      LEFT JOIN sop_documents sd ON sd.assignment_id = sca.id
      LEFT JOIN sop_documents target_sop ON sca.sop_to_revise = target_sop.id
      WHERE sca.assigned_to = ?
      ORDER BY sca.created_at DESC
    `,
      [userId]
    );
    return rows;
  }

  /**
   * Method untuk mengupdate status penugasan
   * @param {number} id - ID penugasan
   * @param {string} status - Status baru
   * @param {string} response - Respon dari assignee (opsional)
   * @returns {boolean} - True jika berhasil
   */
  static async updateStatus(id, status, response = null) {
    await pool.query(
      `UPDATE sop_creator_assignments 
       SET status = ?, assignee_response = ?, updated_at = NOW() 
       WHERE id = ?`,
      [status, response, id]
    );
    return true;
  }

  /**
   * Method untuk menghapus penugasan
   * @param {number} id - ID penugasan
   * @returns {boolean} - True jika berhasil
   */
  static async delete(id) {
    await pool.query("DELETE FROM sop_creator_assignments WHERE id = ?", [id]);
    return true;
  }

  /**
   * Method untuk mengambil penugasan berdasarkan ID
   * @param {number} id - ID penugasan
   * @returns {Object|null} - Object penugasan atau null
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `
      SELECT 
        sca.*,
        assigner.name AS assigner_name,
        assignee.name AS assignee_name,
        assignee.email AS assignee_email,
        assignee.position AS assignee_position,
        u.nama_unit AS unit_name
      FROM sop_creator_assignments sca
      LEFT JOIN users assigner ON sca.assigned_by = assigner.id
      LEFT JOIN users assignee ON sca.assigned_to = assignee.id
      LEFT JOIN units u ON assignee.unit = u.id
      WHERE sca.id = ?
    `,
      [id]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Method untuk update status assignment menjadi completed berdasarkan assignment_id
   * @param {number} assignmentId - ID assignment yang akan diupdate
   * @returns {Object} - Hasil update
   */
  static async markAsCompleted(assignmentId) {
    const [result] = await pool.query(
      "UPDATE sop_creator_assignments SET status = 'completed' WHERE id = ?",
      [assignmentId]
    );
    return result;
  }
}

module.exports = SopCreatorAssignment;
