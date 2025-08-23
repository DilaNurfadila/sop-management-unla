const pool = require("../config/db");

/**
 * Model Feedback untuk operasi database tabel sop_feedback
 * Menangani CRUD operations untuk feedback dokumen SOP
 */
class Feedback {
  /**
   * Constructor untuk membuat instance Feedback
   * @param {number} sopId - ID dokumen SOP yang diberi feedback
   * @param {string} userName - Nama pengguna yang memberikan feedback
   * @param {string} userEmail - Email pengguna yang memberikan feedback
   * @param {number} rating - Rating dokumen (1-5)
   * @param {string} comment - Komentar/ulasan dari pengguna
   */
  constructor(sopId, userName, userEmail, rating, comment) {
    // Menyimpan ID dokumen SOP yang diberi feedback
    this.sop_id = sopId;
    // Menyimpan nama pengguna yang memberikan feedback
    this.user_name = userName;
    // Menyimpan email pengguna untuk identifikasi
    this.user_email = userEmail;
    // Menyimpan rating dokumen (1-5 bintang)
    this.rating = rating;
    // Menyimpan komentar/ulasan dari pengguna
    this.comment = comment;
  }

  /**
   * Method static untuk membuat feedback baru
   * @param {Object} feedbackData - Data feedback yang akan disimpan
   * @returns {Promise<Object>} - Object feedback yang berhasil dibuat
   */
  static async create(feedbackData) {
    const { sop_id, user_name, user_email, rating, comment } = feedbackData;

    const [result] = await pool.query(
      "INSERT INTO sop_feedback (sop_id, user_name, user_email, rating, comment, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())",
      [sop_id, user_name, user_email, rating, comment]
    );

    if (result.affectedRows === 1) {
      return {
        id: result.insertId,
        ...feedbackData,
        success: true,
      };
    } else {
      throw new Error("Gagal menyimpan feedback");
    }
  }

  static async findBySopId(sop_id) {
    const [rows] = await pool.query(
      "SELECT * FROM sop_feedback WHERE sop_id = ? ORDER BY created_at DESC",
      [sop_id]
    );
    return rows;
  }

  static async getAverageRating(sop_id) {
    const [rows] = await pool.query(
      "SELECT AVG(rating) as average_rating, COUNT(*) as total_feedback FROM sop_feedback WHERE sop_id = ?",
      [sop_id]
    );
    return rows[0];
  }

  static async getAllFeedbackWithSOP() {
    const [rows] = await pool.query(`
      SELECT 
        f.*,
        s.sop_code,
        s.sop_title
      FROM sop_feedback f
      LEFT JOIN sop_documents s ON f.sop_id = s.id
      ORDER BY f.created_at DESC
    `);
    return rows;
  }

  static async deleteFeedback(id) {
    await pool.query("DELETE FROM sop_feedback WHERE id = ?", [id]);
    return true;
  }

  static async updateFeedback(id, feedbackData) {
    const { rating, comment } = feedbackData;

    await pool.query(
      "UPDATE sop_feedback SET rating = ?, comment = ?, updated_at = NOW() WHERE id = ?",
      [rating, comment, id]
    );
    return { id, ...feedbackData };
  }

  // Check if user has already given feedback for this SOP (by email)
  static async checkExistingFeedback(sop_id, user_email) {
    const [rows] = await pool.query(
      "SELECT id FROM sop_feedback WHERE sop_id = ? AND user_email = ?",
      [sop_id, user_email]
    );
    return rows.length > 0;
  }
}

module.exports = Feedback;
