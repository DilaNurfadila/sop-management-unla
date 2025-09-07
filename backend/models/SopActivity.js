const pool = require("../config/db");

/**
 * Model SopActivity untuk operasi database tabel sop_activities
 * Menangani CRUD operations untuk aktivitas SOP
 */
class SopActivity {
  /**
   * Constructor untuk membuat instance SopActivity
   * @param {string} name - Nama aktivitas
   * @param {number} sopDocId - ID dokumen SOP yang terkait
   * @param {string} description - Deskripsi aktivitas (optional)
   * @param {number} order - Urutan aktivitas (optional)
   */
  constructor(name, sopDocId, description = null, order = null) {
    this.name = name;
    this.sop_doc_id = sopDocId;
    this.description = description;
    this.order = order;
  }

  /**
   * Method untuk menyimpan data aktivitas baru ke database
   * @returns {Object} - Hasil insert dengan ID baru
   */
  async save() {
    const [result] = await pool.query(
      "INSERT INTO sop_activities (name, sop_doc_id, description, order_index, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())",
      [this.name, this.sop_doc_id, this.description, this.order]
    );
    return {
      id: result.insertId,
      name: this.name,
      sop_doc_id: this.sop_doc_id,
      description: this.description,
      order_index: this.order,
      created_at: new Date(),
      updated_at: new Date(),
    };
  }

  /**
   * Method static untuk mengambil semua data aktivitas
   * @returns {Array} - Array semua data aktivitas
   */
  static async findAll() {
    const [rows] = await pool.query(
      "SELECT * FROM sop_activities ORDER BY created_at DESC"
    );
    return rows;
  }

  /**
   * Method static untuk mengambil data aktivitas berdasarkan SOP Document ID
   * @param {number} sopDocId - ID dokumen SOP
   * @returns {Array} - Array data aktivitas untuk SOP tertentu
   */
  static async findBySopDocId(sopDocId) {
    const [rows] = await pool.query(
      "SELECT * FROM sop_activities WHERE sop_doc_id = ? ORDER BY order_index ASC, created_at ASC",
      [sopDocId]
    );
    return rows;
  }

  /**
   * Method static untuk mengambil data aktivitas berdasarkan ID
   * @param {number} id - ID aktivitas
   * @returns {Object|null} - Data aktivitas atau null jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM sop_activities WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Method static untuk mengupdate data aktivitas berdasarkan ID
   * @param {number} id - ID aktivitas yang akan diupdate
   * @param {Object} data - Data baru untuk aktivitas
   * @returns {boolean} - True jika berhasil
   */
  static async updateById(id, data) {
    const { name, sop_doc_id, description, order } = data;
    const [result] = await pool.query(
      "UPDATE sop_activities SET name = ?, sop_doc_id = ?, description = ?, order_index = ?, updated_at = NOW() WHERE id = ?",
      [name, sop_doc_id, description, order, id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Method static untuk menghapus aktivitas berdasarkan ID
   * @param {number} id - ID aktivitas
   * @returns {boolean} - True jika berhasil dihapus
   */
  static async deleteById(id) {
    const [result] = await pool.query(
      "DELETE FROM sop_activities WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  }

  /**
   * Method static untuk menghapus semua data aktivitas berdasarkan SOP Document ID
   * @param {number} sopDocId - ID dokumen SOP
   * @returns {boolean} - True jika berhasil
   */
  static async deleteBySopDocId(sopDocId) {
    const [result] = await pool.query(
      "DELETE FROM sop_activities WHERE sop_doc_id = ?",
      [sopDocId]
    );
    return result.affectedRows > 0;
  }
}

module.exports = SopActivity;
