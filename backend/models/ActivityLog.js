// Mengimpor konfigurasi database untuk koneksi MySQL
const db = require("../config/db");

/**
 * Kelas ActivityLog untuk mengelola logging aktivitas pengguna
 * Digunakan untuk mencatat semua aktivitas penting dalam sistem
 */
class ActivityLog {
  /**
   * Constructor untuk membuat instance ActivityLog
   * @param {number} userId - ID pengguna yang melakukan aktivitas
   * @param {string} userName - Nama pengguna yang melakukan aktivitas
   * @param {string} userRole - Role/peran pengguna (admin, user, dll)
   * @param {string} action - Jenis aksi yang dilakukan (CREATE, UPDATE, DELETE, VIEW)
   * @param {string} module - Modul sistem tempat aktivitas dilakukan (USER, DOCUMENT, ARCHIVE, dll)
   * @param {string} description - Deskripsi detail aktivitas
   * @param {number|null} targetId - ID target/objek yang dikenai aktivitas (opsional)
   * @param {string|null} targetType - Tipe target/objek (user, document, archive, dll) (opsional)
   * @param {string|null} ipAddress - Alamat IP pengguna yang melakukan aktivitas (opsional)
   * @param {string|null} userAgent - User agent browser pengguna (opsional)
   */
  constructor(
    userId,
    userName,
    userRole,
    action,
    module,
    description,
    targetId = null,
    targetType = null,
    ipAddress = null,
    userAgent = null
  ) {
    // Menyimpan ID pengguna yang melakukan aktivitas
    this.user_id = userId;
    // Menyimpan nama pengguna untuk kemudahan tracking
    this.user_name = userName;
    // Menyimpan role pengguna untuk kontrol akses dan audit
    this.user_role = userRole;
    // Menyimpan jenis aksi yang dilakukan
    this.action = action;
    // Menyimpan modul sistem tempat aktivitas terjadi
    this.module = module;
    // Menyimpan deskripsi lengkap aktivitas
    this.description = description;
    // Menyimpan ID target objek yang dikenai aktivitas (jika ada)
    this.target_id = targetId;
    // Menyimpan tipe target objek (jika ada)
    this.target_type = targetType;
    // Menyimpan alamat IP untuk tracking lokasi/security
    this.ip_address = ipAddress;
    // Menyimpan user agent untuk tracking browser/device
    this.user_agent = userAgent;
  }

  /**
   * Method static untuk membuat log aktivitas baru di database
   * @param {Object} logData - Data log aktivitas yang akan disimpan
   * @returns {Promise<Object>} - Data log yang berhasil dibuat dengan ID
   */
  static async create(logData) {
    try {
      // Destruktur data log dari parameter input
      const {
        user_id, // ID pengguna yang melakukan aktivitas
        user_name, // Nama pengguna untuk tracking
        user_role, // Role pengguna untuk audit
        action, // Jenis aksi yang dilakukan
        module, // Modul sistem tempat aktivitas terjadi
        description, // Deskripsi detail aktivitas
        target_id = null, // ID target objek (opsional)
        target_type = null, // Tipe target objek (opsional)
        ip_address = null, // Alamat IP pengguna (opsional)
        user_agent = null, // User agent browser (opsional)
      } = logData;

      // Eksekusi query INSERT untuk menyimpan log ke database
      // Menggunakan prepared statement untuk keamanan dari SQL injection
      const [result] = await db.execute(
        `INSERT INTO activity_logs 
         (user_id, user_name, user_role, action, module, description, target_id, target_type, ip_address, user_agent) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user_id, // Parameter 1: ID pengguna
          user_name, // Parameter 2: Nama pengguna
          user_role, // Parameter 3: Role pengguna
          action, // Parameter 4: Jenis aksi
          module, // Parameter 5: Modul sistem
          description, // Parameter 6: Deskripsi aktivitas
          target_id, // Parameter 7: ID target objek
          target_type, // Parameter 8: Tipe target objek
          ip_address, // Parameter 9: Alamat IP
          user_agent, // Parameter 10: User agent browser
        ]
      );

      // Mengembalikan data log dengan ID yang baru dibuat
      return {
        id: result.insertId, // ID auto-increment dari database
        ...logData, // Spread semua data input
      };
    } catch (error) {
      // Meneruskan error ke caller untuk handling
      throw error;
    }
  }

  /**
   * Method untuk mengambil semua log aktivitas dengan pagination dan filter
   * @param {number} page - Halaman yang diminta (default: 1)
   * @param {number} limit - Jumlah record per halaman (default: 50)
   * @param {Object} filters - Filter untuk pencarian (opsional)
   * @returns {Promise<Object>} - Data logs dengan informasi pagination
   */
  static async findAll(page = 1, limit = 50, filters = {}) {
    try {
      // Menghitung offset untuk pagination
      const offset = (page - 1) * limit;
      // Inisialisasi clause WHERE dan parameter query
      let whereClause = "";
      let params = [];

      // Membangun kondisi WHERE berdasarkan filter yang diberikan
      const conditions = [];

      // Filter berdasarkan ID pengguna
      if (filters.user_id) {
        conditions.push("user_id = ?");
        params.push(filters.user_id);
      }

      // Filter berdasarkan jenis aksi
      if (filters.action) {
        conditions.push("action = ?");
        params.push(filters.action);
      }

      // Filter berdasarkan modul sistem
      if (filters.module) {
        conditions.push("module = ?");
        params.push(filters.module);
      }

      // Filter berdasarkan role pengguna
      if (filters.user_role) {
        conditions.push("user_role = ?");
        params.push(filters.user_role);
      }

      // Filter berdasarkan tanggal mulai (dari tanggal tertentu)
      if (filters.date_from) {
        conditions.push("DATE(created_at) >= ?");
        params.push(filters.date_from);
      }

      // Filter berdasarkan tanggal akhir (sampai tanggal tertentu)
      if (filters.date_to) {
        conditions.push("DATE(created_at) <= ?");
        params.push(filters.date_to);
      }

      // Menggabungkan semua kondisi filter menjadi WHERE clause
      if (conditions.length > 0) {
        whereClause = "WHERE " + conditions.join(" AND ");
      }

      // Query untuk mendapatkan total jumlah record (untuk pagination)
      const countQuery = `SELECT COUNT(*) as total FROM activity_logs ${whereClause}`;
      const [countResult] =
        params.length > 0
          ? await db.execute(countQuery, params) // Dengan parameter jika ada filter
          : await db.query(countQuery); // Tanpa parameter jika tidak ada filter

      // Query untuk mendapatkan data aktual dengan pagination
      // Diurutkan berdasarkan waktu pembuatan terbaru
      const dataQuery = `SELECT * FROM activity_logs ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
      const [rows] =
        params.length > 0
          ? await db.execute(dataQuery, params) // Dengan parameter jika ada filter
          : await db.query(dataQuery); // Tanpa parameter jika tidak ada filter

      // Mengembalikan data logs dan informasi pagination
      return {
        logs: rows, // Array data log aktivitas
        pagination: {
          current_page: page, // Halaman saat ini
          per_page: limit, // Jumlah record per halaman
          total: countResult[0].total, // Total semua record
          total_pages: Math.ceil(countResult[0].total / limit), // Total halaman
        },
      };
    } catch (error) {
      // Meneruskan error ke caller untuk handling
      throw error;
    }
  }

  /**
   * Method untuk mengambil log aktivitas berdasarkan ID
   * @param {number} id - ID log yang ingin diambil
   * @returns {Promise<Object|null>} - Data log atau null jika tidak ditemukan
   */
  static async findById(id) {
    try {
      // Query untuk mencari log berdasarkan ID
      const [rows] = await db.execute(
        "SELECT * FROM activity_logs WHERE id = ?",
        [id] // Parameter ID untuk mencegah SQL injection
      );

      // Cek apakah data ditemukan
      if (rows.length === 0) {
        return null; // Kembalikan null jika tidak ada data
      }

      // Ambil data log pertama (seharusnya hanya ada satu karena ID unik)
      const log = rows[0];
      return log;
    } catch (error) {
      // Meneruskan error ke caller untuk handling
      throw error;
    }
  }

  /**
   * Method untuk mencari log berdasarkan kata kunci
   * Pencarian dilakukan pada field user_name, description, action, dan module
   * @param {string} keyword - Kata kunci untuk pencarian
   * @param {number} page - Halaman yang diminta (default: 1)
   * @param {number} limit - Jumlah record per halaman (default: 50)
   * @returns {Promise<Object>} - Data hasil pencarian dengan pagination
   */
  static async search(keyword, page = 1, limit = 50) {
    try {
      // Menghitung offset untuk pagination
      const offset = (page - 1) * limit;
      // Menambahkan wildcard % untuk LIKE search
      const searchTerm = `%${keyword}%`;

      // Query untuk mendapatkan total jumlah hasil pencarian
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM activity_logs 
         WHERE user_name LIKE ? OR description LIKE ? OR action LIKE ? OR module LIKE ?`,
        [searchTerm, searchTerm, searchTerm, searchTerm] // Parameter yang sama untuk semua field
      );

      // Query untuk mendapatkan data hasil pencarian dengan pagination
      // Mencari di multiple field: user_name, description, action, module
      const searchQuery = `SELECT * FROM activity_logs 
         WHERE user_name LIKE ? OR description LIKE ? OR action LIKE ? OR module LIKE ?
         ORDER BY created_at DESC 
         LIMIT ${limit} OFFSET ${offset}`;
      const [rows] = await db.execute(searchQuery, [
        searchTerm, // Parameter untuk user_name
        searchTerm, // Parameter untuk description
        searchTerm, // Parameter untuk action
        searchTerm, // Parameter untuk module
      ]);

      // Mengembalikan hasil pencarian dengan informasi pagination
      return {
        logs: rows, // Array data log yang ditemukan
        pagination: {
          current_page: page, // Halaman saat ini
          per_page: limit, // Jumlah record per halaman
          total: countResult[0].total, // Total record yang ditemukan
          total_pages: Math.ceil(countResult[0].total / limit), // Total halaman
        },
      };
    } catch (error) {
      // Meneruskan error ke caller untuk handling
      throw error;
    }
  }

  /**
   * Method untuk mendapatkan statistik aktivitas dalam periode tertentu
   * @param {number} days - Jumlah hari ke belakang untuk analisis (default: 7)
   * @returns {Promise<Object>} - Data statistik aktivitas
   */
  static async getStats(days = 7) {
    try {
      // Query untuk mendapatkan total aktivitas dalam periode tertentu
      const [totalResult] = await db.execute(
        `SELECT COUNT(*) as total FROM activity_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days] // Parameter jumlah hari ke belakang
      );

      // Query untuk mendapatkan statistik aktivitas per modul sistem
      const [moduleResult] = await db.execute(
        `SELECT module, COUNT(*) as count FROM activity_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY module ORDER BY count DESC`,
        [days] // Parameter periode hari
      );

      // Query untuk mendapatkan statistik aktivitas per jenis aksi
      const [actionResult] = await db.execute(
        `SELECT action, COUNT(*) as count FROM activity_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY action ORDER BY count DESC`,
        [days] // Parameter periode hari
      );

      // Query untuk mendapatkan statistik aktivitas harian
      const [dailyResult] = await db.execute(
        `SELECT DATE(created_at) as date, COUNT(*) as count 
         FROM activity_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY DATE(created_at) 
         ORDER BY date DESC`,
        [days] // Parameter periode hari
      );

      // Query untuk mendapatkan pengguna paling aktif
      const [userResult] = await db.execute(
        `SELECT user_name, user_role, COUNT(*) as count 
         FROM activity_logs 
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY user_id, user_name, user_role 
         ORDER BY count DESC 
         LIMIT 10`, // Batasi hasil hanya 10 pengguna teratas
        [days] // Parameter periode hari
      );

      // Mengembalikan semua data statistik
      return {
        total: totalResult[0].total, // Total aktivitas dalam periode
        by_module: moduleResult, // Aktivitas per modul
        by_action: actionResult, // Aktivitas per jenis aksi
        by_day: dailyResult, // Aktivitas per hari
        top_users: userResult, // Pengguna paling aktif
        period_days: days, // Periode analisis (hari)
      };
    } catch (error) {
      // Meneruskan error ke caller untuk handling
      throw error;
    }
  }

  /**
   * Method untuk menghapus log lama (maintenance/cleanup)
   * Digunakan untuk membersihkan database dari log yang sudah terlalu lama
   * @param {number} days - Hapus log yang lebih lama dari jumlah hari ini (default: 90)
   * @returns {Promise<Object>} - Informasi hasil penghapusan
   */
  static async deleteOldLogs(days = 90) {
    try {
      // Query untuk menghapus log yang lebih lama dari periode yang ditentukan
      const [result] = await db.execute(
        `DELETE FROM activity_logs 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [days] // Parameter jumlah hari ke belakang
      );

      // Mengembalikan informasi hasil penghapusan
      return {
        deleted_count: result.affectedRows, // Jumlah record yang dihapus
        message: `Berhasil menghapus ${result.affectedRows} log aktivitas yang lebih dari ${days} hari`,
      };
    } catch (error) {
      // Meneruskan error ke caller untuk handling
      throw error;
    }
  }

  /**
   * Helper method untuk log aktivitas yang sering digunakan
   * Method ini menyederhanakan proses logging dengan mengekstrak informasi dari request
   * @param {number} userId - ID pengguna yang melakukan aktivitas
   * @param {string} userName - Nama pengguna
   * @param {string} userRole - Role pengguna
   * @param {string} action - Jenis aksi yang dilakukan
   * @param {string} module - Modul sistem tempat aktivitas terjadi
   * @param {string} description - Deskripsi detail aktivitas
   * @param {Object} req - Request object Express (opsional, untuk ekstrak IP dan User Agent)
   * @param {number} targetId - ID target objek (opsional)
   * @param {string} targetType - Tipe target objek (opsional)
   * @returns {Promise<Object>} - Data log yang berhasil dibuat
   */
  static async logUserActivity(
    userId,
    userName,
    userRole,
    action,
    module,
    description,
    req = null,
    targetId = null,
    targetType = null
  ) {
    // Ekstrak alamat IP dari request object (jika ada)
    const ipAddress = req ? req.ip || req.connection.remoteAddress : null;
    // Ekstrak User Agent dari request header (jika ada)
    const userAgent = req ? req.get("User-Agent") : null;

    // Memanggil method create dengan data yang sudah disiapkan
    return await this.create({
      user_id: userId, // ID pengguna
      user_name: userName, // Nama pengguna
      user_role: userRole, // Role pengguna
      action: action, // Jenis aksi
      module: module, // Modul sistem
      description: description, // Deskripsi aktivitas
      target_id: targetId, // ID target objek
      target_type: targetType, // Tipe target objek
      ip_address: ipAddress, // Alamat IP pengguna
      user_agent: userAgent, // User agent browser
    });
  }
}

// Ekspor kelas ActivityLog untuk digunakan di file lain
module.exports = ActivityLog;
