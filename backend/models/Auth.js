const pool = require("../config/db");

/**
 * Model Auth untuk operasi autentikasi dan verifikasi email
 * Menangani proses login, register, dan verifikasi OTP
 */
class Auth {
  /**
   * Constructor untuk membuat instance Auth
   * @param {string} email - Email pengguna untuk autentikasi
   * @param {string} accessCode - Kode OTP untuk verifikasi email
   * @param {Date} expiredAt - Waktu kadaluarsa OTP
   */
  constructor(email, accessCode, expiredAt) {
    // Menyimpan email pengguna untuk proses autentikasi
    this.email = email;
    // Menyimpan kode akses OTP untuk verifikasi
    this.access_code = accessCode;
    // Menyimpan waktu kadaluarsa OTP
    this.expired_at = expiredAt;
  }

  /**
   * Method static untuk mencari user berdasarkan ID
   * @param {number} id - ID user yang dicari
   * @returns {Promise<Object|undefined>} - Object user atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  }

  static async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async findByEmailVerify(email) {
    const [rows] = await pool.query(
      "SELECT * FROM email_verification WHERE (email, expired_at) IN (SELECT email, MAX(expired_at) FROM email_verification WHERE email = ? GROUP BY email)",
      [email]
    );
    return rows[0];
  }

  static async findByAccessCode(access_code) {
    const [rows] = await pool.query(
      "SELECT * FROM email_verification WHERE access_code = ?",
      [access_code]
    );
    return rows[0];
  }

  // static async getReqCount(email) {
  //   const [rows] = await pool.query(
  //     "SELECT email, COUNT(*) AS count FROM email_verification WHERE email = ?",
  //     [email]
  //   );
  //   return rows[0];
  // }

  static async createOtp(email, access_code, expired_at) {
    const [result] = await pool.query(
      "INSERT INTO email_verification (email, access_code, expired_at) VALUES (?, ?, ?)",
      [email, access_code, expired_at]
    );

    if (result.affectedRows === 1) {
      return {
        email: email,
        access_code: access_code,
        expired_at: expired_at,
        success: true,
      };
    } else {
      throw new Error("Gagal membuat OTP");
    }
  }

  static async usedOtp(email) {
    const [result] = await pool.query(
      "DELETE FROM email_verification WHERE email = ?",
      [email]
    );

    if (result.affectedRows > 0) {
      return {
        email: email,
        success: true,
      };
    } else {
      throw new Error("Gagal mengubah status OTP");
    }
  }

  static async updateToken(email, remember_token) {
    const [result] = await pool.query(
      "UPDATE users SET remember_token = ? WHERE email = ?",
      [remember_token, email]
    );
    if (result.affectedRows > 0) {
      return {
        email: email,
        remember_token: remember_token,
        success: true,
      };
    } else {
      throw new Error("Gagal memperbarui token");
    }
  }

  static async register(email, data) {
    const { name, role, organization, position, accessToken } = data;

    const [result] = await pool.query(
      "INSERT INTO users (email, name, role, organization, position, remember_token) VALUES (?, ?, ?, ?, ?, ?)",
      [email, name, role, organization, position, accessToken]
    );

    if (result.affectedRows > 0) {
      return {
        id: result.insertId,
        ...data,
        email: email,
        success: true,
      };
    } else {
      throw new Error("Gagal menyimpan data");
    }
  }

  static async logout(email) {
    const [result] = await pool.query(
      "UPDATE users SET remember_token = NULL WHERE email = ?",
      [email]
    );

    if (result.affectedRows > 0) {
      return {
        email: email,
        success: true,
      };
    } else {
      throw new Error("Gagal menghapus token");
    }
  }

  /**
   * Simpan reset token ke database
   * @param {string} email - Email user
   * @param {string} resetToken - Token untuk reset password
   * @param {Date} expiry - Waktu kadaluarsa token
   */
  static async saveResetToken(email, resetToken, expiry) {
    // Hapus token lama jika ada
    await pool.query("DELETE FROM password_resets WHERE email = ?", [email]);

    // Simpan token baru
    const [result] = await pool.query(
      "INSERT INTO password_resets (email, reset_token, reset_token_expiry, created_at) VALUES (?, ?, ?, NOW())",
      [email, resetToken, expiry]
    );

    if (result.affectedRows === 1) {
      return {
        email: email,
        reset_token: resetToken,
        success: true,
      };
    } else {
      throw new Error("Gagal menyimpan reset token");
    }
  }

  /**
   * Verifikasi reset token
   * @param {string} email - Email user
   * @param {string} resetToken - Token yang akan diverifikasi
   */
  static async verifyResetToken(email, resetToken) {
    const [rows] = await pool.query(
      "SELECT * FROM password_resets WHERE email = ? AND reset_token = ?",
      [email, resetToken]
    );
    return rows[0];
  }

  /**
   * Hapus reset token setelah digunakan atau expired
   * @param {string} email - Email user
   */
  static async deleteResetToken(email) {
    const [result] = await pool.query(
      "DELETE FROM password_resets WHERE email = ?",
      [email]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Auth;
