/**
 * Model: SopResponsiblePerson
 *
 * Mencatat penanggung jawab pada aktivitas SOP (role/jabatan dan identitas).
 */
const pool = require("../config/db");

/**
 * Model SopResponsiblePerson untuk operasi database tabel sop_responsible_person
 * Menangani CRUD operations untuk pelaksana/penanggung jawab SOP
 */
class SopResponsiblePerson {
  /**
   * Constructor untuk membuat instance SopResponsiblePerson
   * @param {number} userId - ID user dari tabel users
   * @param {number} sopDocId - ID dokumen SOP yang terkait
   * @param {string} role - Role dalam SOP (optional)
   */
  constructor(userId, sopDocId, role = null) {
    this.user_id = userId;
    this.sop_doc_id = sopDocId;
    this.role = role;
  }

  /**
   * Method untuk menyimpan data pelaksana baru ke database
   * @returns {Object} - Hasil insert dengan ID baru
   */
  async save() {
    const [result] = await pool.query(
      "INSERT INTO sop_responsible_person (user_id, sop_doc_id, role, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [this.user_id, this.sop_doc_id, this.role]
    );
    return { id: result.insertId, ...this };
  }

  /**
   * Method static untuk mengambil semua data pelaksana
   * @returns {Array} - Array semua data pelaksana
   */
  static async findAll() {
    const [rows] = await pool.query("SELECT * FROM sop_responsible_person");
    return rows;
  }

  /**
   * Method static untuk mengambil data pelaksana berdasarkan SOP Document ID
   * dengan informasi lengkap dari tabel users (nama, unit kerja, posisi)
   * @param {number} sopDocId - ID dokumen SOP
   * @returns {Array} - Array data pelaksana dengan info user lengkap
   */
  static async findBySopDocId(sopDocId) {
    const [rows] = await pool.query(
      `SELECT 
        srp.id,
        srp.user_id,
        srp.sop_doc_id,
        srp.role,
        srp.created_at,
        srp.updated_at,
        u.name as user_name,
        u.email as user_email,
        u.position as user_position,
        u.unit as user_unit
      FROM sop_responsible_person srp
      LEFT JOIN users u ON srp.user_id = u.id
      WHERE srp.sop_doc_id = ?
      ORDER BY srp.created_at ASC`,
      [sopDocId]
    );
    return rows;
  }

  /**
   * Method static untuk mengambil data pelaksana berdasarkan ID
   * @param {number} id - ID pelaksana
   * @returns {Object|null} - Data pelaksana atau null jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM sop_responsible_person WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Method static untuk mengupdate data pelaksana berdasarkan ID
   * @param {number} id - ID pelaksana yang akan diupdate
   * @param {Object} data - Data baru untuk pelaksana
   * @returns {boolean} - True jika berhasil
   */
  static async updateById(id, data) {
    const { user_id, role } = data;
    await pool.query(
      "UPDATE sop_responsible_person SET user_id = ?, role = ?, updated_at = NOW() WHERE id = ?",
      [user_id, role, id]
    );
    return true;
  }

  /**
   * Method static untuk mengambil semua users yang bisa menjadi responsible person
   * @returns {Array} - Array data users dengan nama, unit kerja, dan posisi
   */
  static async getAvailableUsers() {
    const [rows] = await pool.query(
      `SELECT 
        id,
        name,
        email,
        position,
        unit,
        role
      FROM users
      WHERE role IN ('user', 'admin_unit', 'admin')
      ORDER BY unit ASC, name ASC`
    );
    return rows;
  }

  /**
   * Method static untuk menghapus data pelaksana berdasarkan ID
   * @param {number} id - ID pelaksana yang akan dihapus
   * @returns {boolean} - True jika berhasil
   */
  static async deleteById(id) {
    await pool.query("DELETE FROM sop_responsible_person WHERE id = ?", [id]);
    return true;
  }

  /**
   * Method static untuk menghapus semua data pelaksana berdasarkan SOP Document ID
   * @param {number} sopDocId - ID dokumen SOP
   * @returns {boolean} - True jika berhasil
   */
  static async deleteBySopDocId(sopDocId) {
    await pool.query(
      "DELETE FROM sop_responsible_person WHERE sop_doc_id = ?",
      [sopDocId]
    );
    return true;
  }
}

module.exports = SopResponsiblePerson;
