const pool = require("../config/db");

class User {
  static async findAllUsers() {
    const [rows] = await pool.query("SELECT * FROM users");
    return rows;
  }

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

  // static async create(sopData) {
  //   const { name, email, role } = sopData;

  //   // Check for duplicate SOP code
  //   const existingDoc = await this.findBySopCode(sop_code);
  //   if (existingDoc) {
  //     throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
  //   }

  //   const [result] = await pool.query(
  //     "INSERT INTO users (sop_code, sop_title, sop_value, status, organization, sop_created, sop_version) VALUES (?, ?, ?, ?, ?, ?, ?)",
  //     [
  //       sop_code,
  //       sop_title,
  //       sop_value,
  //       status,
  //       organization,
  //       sop_created,
  //       sop_version,
  //     ]
  //   );

  //   if (result.affectedRows === 1) {
  //     return {
  //       sop_code: sop_code,
  //       ...sopData,
  //       success: true,
  //     };
  //   } else {
  //     throw new Error("Gagal menyimpan data");
  //   }
  // }

  // static async updateSopDoc(id, sopData) {
  //   const {
  //     sop_code,
  //     sop_title,
  //     sop_value,
  //     organization,
  //     sop_created,
  //     sop_version,
  //   } = sopData;

  //   // Check for duplicate SOP code, excluding the current document
  //   const existingDoc = await this.findBySopCode(sop_code, id);
  //   if (existingDoc) {
  //     throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
  //   }

  //   await pool.query(
  //     "UPDATE users SET sop_code = ?, sop_title = ?, sop_value = ?, organization = ?, sop_created = ?, sop_version = ? WHERE id = ?",
  //     [
  //       sop_code,
  //       sop_title,
  //       sop_value,
  //       organization,
  //       sop_created,
  //       sop_version,
  //       id,
  //     ]
  //   );
  //   return { id, ...sopData };
  // }

  // static async delete(id) {
  //   await pool.query("DELETE FROM users WHERE id = ?", [id]);
  //   return true;
  // }
}

module.exports = User;
