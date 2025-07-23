const pool = require("../config/db");

class Auth {
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
}

module.exports = Auth;
