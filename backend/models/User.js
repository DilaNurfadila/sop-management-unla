// Import koneksi database dari config
const pool = require("../config/db");

/**
 * Model User untuk operasi database tabel users
 * Menangani CRUD operations untuk data user
 */
class User {
  /**
   * Constructor untuk membuat instance User
   * @param {string} name - Nama lengkap pengguna
   * @param {string} email - Email pengguna (harus unik)
   * @param {string} password - Password pengguna (akan di-hash)
   * @param {string} position - Jabatan/posisi pengguna dalam organisasi
   * @param {string} unit - Unit kerja pengguna
   * @param {string} role - Role pengguna (admin, moderator, user)
   * @param {boolean} emailVerified - Status verifikasi email (default: false)
   */
  constructor(name, email, password, position, unit, role = "user", emailVerified = false) {
    // Menyimpan nama lengkap pengguna
    this.name = name;
    // Menyimpan alamat email pengguna (sebagai identifier unik)
    this.email = email;
    // Menyimpan password yang akan di-hash untuk keamanan
    this.password = password;
    // Menyimpan jabatan/posisi pengguna dalam organisasi
    this.position = position;
    // Menyimpan unit kerja tempat pengguna bertugas
    this.unit = unit;
    // Menyimpan role pengguna untuk sistem authorization
    this.role = role;
    // Menyimpan status verifikasi email untuk keamanan akun
    this.email_verified = emailVerified;
  }

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

  /**
   * Function untuk membuat user baru
   * @param {Object} userData - Data user yang akan dibuat
   * @returns {Promise<Object>} - Object user yang berhasil dibuat dengan ID
   */
  static async createUser(userData) {
    const {
      name,
      email,
      password,
      position,
      unit,
      role = "user",
      email_verified = false,
    } = userData;

    // Query untuk insert user baru dengan prepared statement
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password, position, unit, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, password, position, unit, role, email_verified]
    );

    // Return object user dengan ID yang baru dibuat
    return {
      id: result.insertId,
      name,
      email,
      position,
      unit,
      role,
      email_verified,
    };
  }

  /**
   * Function untuk mengupdate data profil user
   * @param {number} id - ID user yang akan diupdate
   * @param {Object} userData - Data user yang akan diupdate
   * @returns {Promise<boolean>} - true jika berhasil
   */
  static async updateUser(id, userData) {
    const { name, email, position, unit } = userData;

    // Query untuk update user berdasarkan ID dengan prepared statement
    await pool.query(
      "UPDATE users SET name = ?, email = ?, position = ?, unit = ? WHERE id = ?",
      [name, email, position, unit, id]
    );
    return true;
  }

  /**
   * Function untuk mengupdate password user
   * @param {number} id - ID user yang akan diupdate
   * @param {string} hashedPassword - Password yang sudah di-hash
   * @returns {Promise<boolean>} - true jika berhasil
   */
  static async updatePassword(id, hashedPassword) {
    // Query untuk update password berdasarkan ID dengan prepared statement
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);
    return true;
  }

  /**
   * Function untuk menghapus user berdasarkan ID
   * @param {number} id - ID user yang akan dihapus
   * @returns {Promise<boolean>} - true jika berhasil
   */
  static async deleteUser(id) {
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return true;
  }

  /**
   * Function untuk mengupdate role user
   * @param {number} id - ID user yang akan diupdate
   * @param {string} role - Role baru untuk user
   * @returns {Promise<boolean>} - true jika berhasil
   */
  static async updateUserRole(id, role) {
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    return true;
  }

  /**
   * Function untuk mencari user berdasarkan nama atau email
   * @param {string} query - Query pencarian
   * @returns {Promise<Array>} - Array berisi user yang sesuai pencarian
   */
  static async searchUsers(query) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE name LIKE ? OR email LIKE ?",
      [`%${query}%`, `%${query}%`]
    );
    return rows;
  }
}

module.exports = User;
