const db = require("../config/db");

/**
 * Model PasswordReset untuk operasi reset password
 * Menangani pembuatan dan validasi token reset password
 */
class PasswordReset {
  /**
   * Constructor untuk membuat instance PasswordReset
   * @param {string} email - Email pengguna yang request reset password
   * @param {string} token - Token unik untuk proses reset password
   * @param {Date} expiresAt - Waktu kadaluarsa token reset
   */
  constructor(email, token, expiresAt) {
    // Menyimpan email pengguna yang request reset password
    this.email = email;
    // Menyimpan token unik untuk validasi reset password
    this.token = token;
    // Menyimpan waktu kadaluarsa token untuk keamanan
    this.expires_at = expiresAt;
  }

  /**
   * Create a new password reset token
   * @param {string} email - User email
   * @param {string} token - Reset token
   * @param {Date} expiresAt - Expiration date
   * @returns {Promise} Database result
   */
  static async create(email, token, expiresAt) {
    const query = `
      INSERT INTO password_resets (email, token, expires_at)
      VALUES (?, ?, ?)
    `;
    return db.execute(query, [email, token, expiresAt]);
  }

  /**
   * Find password reset by token
   * @param {string} token - Reset token
   * @returns {Promise} Password reset record
   */
  static async findByToken(token) {
    const query = `
      SELECT * FROM password_resets 
      WHERE token = ? AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const [rows] = await db.execute(query, [token]);
    return rows[0] || null;
  }

  /**
   * Delete password reset token
   * @param {string} token - Reset token
   * @returns {Promise} Database result
   */
  static async deleteByToken(token) {
    const query = "DELETE FROM password_resets WHERE token = ?";
    return db.execute(query, [token]);
  }

  /**
   * Delete all password reset tokens for an email
   * @param {string} email - User email
   * @returns {Promise} Database result
   */
  static async deleteByEmail(email) {
    const query = "DELETE FROM password_resets WHERE email = ?";
    return db.execute(query, [email]);
  }

  /**
   * Clean up expired tokens
   * @returns {Promise} Database result
   */
  static async cleanupExpired() {
    const query = "DELETE FROM password_resets WHERE expires_at < NOW()";
    return db.execute(query);
  }
}

module.exports = PasswordReset;
