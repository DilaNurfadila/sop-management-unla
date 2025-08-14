// Import koneksi database dari config
const pool = require("../config/db");

/**
 * Model User untuk operasi database tabel users
 * Menangani CRUD operations untuk data user
 */
class User {
  /**
   * Function untuk mengambil semua data user
   * @returns {Promise<Array>} - Array berisi semua user
   */
  static async findAllUsers() {
    // Query untuk select semua user dari tabel users
    const [rows] = await pool.query("SELECT * FROM users");
    return rows;
  }

  /**
   * Function untuk mencari user berdasarkan ID
   * @param {number} id - ID user yang dicari
   * @returns {Promise<Object|undefined>} - Object user atau undefined jika tidak ditemukan
   */
  static async findById(id) {
    // Query untuk select user berdasarkan ID dengan prepared statement
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0]; // Return first result atau undefined jika tidak ada
  }

  /**
   * Function untuk mencari user berdasarkan email
   * @param {string} email - Email user yang dicari
   * @returns {Promise<Object|undefined>} - Object user atau undefined jika tidak ditemukan
   */
  static async findByEmail(email) {
    // Query untuk select user berdasarkan email dengan prepared statement
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0]; // Return first result atau undefined jika tidak ada
  }

  // Catatan: Function create di-comment karena tidak digunakan saat ini
  // Function ini adalah template untuk membuat user baru jika diperlukan
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
