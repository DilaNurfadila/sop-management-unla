// Import konfigurasi database connection pool
const pool = require("../config/db");

// Class untuk mengelola operasi database SOP Documents
class SopDoc {
  /**
   * Helper method untuk mendapatkan informasi user berdasarkan user_id
   * @param {number} userId - ID user yang akan dicari
   * @returns {Object|null} - Object user atau null jika tidak ditemukan
   */
  static async getUserById(userId) {
    // Jika userId tidak ada, langsung return null
    if (!userId) return null;

    try {
      // Query database untuk mencari user berdasarkan ID
      // Menggunakan destructuring untuk mengambil rows dari hasil query
      const [rows] = await pool.query(
        "SELECT id, name, email FROM users WHERE id = ?", // Query SQL dengan placeholder - menggunakan 'name' bukan 'username'
        [userId] // Parameter untuk mengganti placeholder (prepared statement)
      );

      // Return user pertama jika ada, atau null jika tidak ditemukan
      return rows[0] || null;
    } catch (error) {
      // Log error ke console untuk debugging
      console.error("Error fetching user:", error);
      // Return null jika terjadi error
      return null;
    }
  }

  /**
   * Helper method untuk menambahkan informasi uploader ke dokumen SOP
   * @param {Object|Array} sopDocs - Dokumen SOP (single object atau array)
   * @returns {Object|Array} - Dokumen SOP dengan informasi uploader
   */
  static async attachUploaderInfo(sopDocs) {
    // Cek apakah sopDocs adalah array atau single object
    if (!Array.isArray(sopDocs)) {
      // Jika single document dan memiliki user_id
      if (sopDocs && sopDocs.user_id) {
        // Ambil informasi user berdasarkan user_id
        const user = await this.getUserById(sopDocs.user_id);
        // Tambahkan property uploader_name dan uploader_email ke dokumen
        sopDocs.uploader_name = user?.name || null; // Gunakan optional chaining dengan 'name' bukan 'username'
        sopDocs.uploader_email = user?.email || null;
      }
      // Return dokumen yang sudah dimodifikasi
      return sopDocs;
    }

    // Jika sopDocs adalah array, loop melalui setiap dokumen
    for (let doc of sopDocs) {
      // Cek apakah dokumen memiliki user_id
      if (doc.user_id) {
        // Ambil informasi user untuk setiap dokumen
        const user = await this.getUserById(doc.user_id);
        // Tambahkan property uploader_name dan uploader_email
        doc.uploader_name = user?.name || null; // Gunakan 'name' bukan 'username'
        doc.uploader_email = user?.email || null;
      }
    }
    // Return array dokumen yang sudah dimodifikasi
    return sopDocs;
  }

  /**
   * Method untuk mengambil semua dokumen SOP dari database
   * @returns {Array} - Array dokumen SOP dengan informasi uploader
   */
  static async findAllSopDoc() {
    // Query database untuk mengambil semua dokumen SOP
    const [rows] = await pool.query("SELECT * FROM sop_documents");
    // Tambahkan informasi uploader ke setiap dokumen dan return
    return await this.attachUploaderInfo(rows);
  }

  /**
   * Method untuk mengambil dokumen SOP yang sudah dipublikasi
   * @returns {Array} - Array dokumen SOP published dengan informasi uploader
   */
  static async findPublishedSopDocs() {
    // Query database untuk mengambil dokumen dengan status 'published'
    // Diurutkan berdasarkan sop_code secara ascending
    const [rows] = await pool.query(
      "SELECT * FROM sop_documents WHERE status = 'published' ORDER BY sop_code ASC"
    );
    // Tambahkan informasi uploader ke dokumen published dan return
    return await this.attachUploaderInfo(rows);
  }

  /**
   * Method untuk mencari dokumen SOP berdasarkan ID
   * @param {number} id - ID dokumen yang akan dicari
   * @returns {Object|null} - Dokumen SOP dengan informasi uploader atau null
   */
  static async findById(id) {
    // Query database untuk mencari dokumen berdasarkan ID
    const [rows] = await pool.query(
      "SELECT * FROM sop_documents WHERE id = ?", // SQL query dengan placeholder
      [id] // Parameter ID untuk prepared statement
    );
    // Ambil dokumen pertama dari hasil query
    const doc = rows[0];
    // Jika dokumen ditemukan, tambahkan info uploader; jika tidak, return null
    return doc ? await this.attachUploaderInfo(doc) : null;
  }

  /**
   * Method untuk mencari dokumen SOP berdasarkan kode SOP
   * @param {string} sop_code - Kode SOP yang akan dicari
   * @param {number|null} excludeId - ID dokumen yang akan dikecualikan dari pencarian
   * @returns {Object|undefined} - Dokumen SOP pertama yang ditemukan
   */
  static async findBySopCode(sop_code, excludeId = null) {
    // Membuat query dasar untuk mencari berdasarkan sop_code
    let query = "SELECT * FROM sop_documents WHERE sop_code = ?";
    // Array parameter dimulai dengan sop_code
    const params = [sop_code];

    // Jika ada excludeId, tambahkan kondisi untuk mengecualikan ID tersebut
    if (excludeId) {
      query += " AND id != ?"; // Tambahkan kondisi WHERE
      params.push(excludeId); // Tambahkan excludeId ke parameter
    }

    // Eksekusi query dengan parameter yang sudah disiapkan
    const [rows] = await pool.query(query, params);
    // Return dokumen pertama yang ditemukan
    return rows[0];
  }

  /**
   * Method untuk membuat dokumen SOP baru
   * @param {Object} sopData - Data dokumen SOP yang akan dibuat
   * @returns {Object} - Hasil pembuatan dokumen dengan ID baru
   */
  static async createSopDoc(sopData) {
    // Destructuring data dari parameter sopData
    const {
      sop_code, // Kode SOP
      sop_title, // Judul SOP
      url, // URL file SOP di Firebase Storage
      status = "draft", // Status dokumen (default: draft)
      organization, // Organisasi/unit
      sop_applicable, // Tanggal berlaku
      sop_version, // Versi SOP
      user_id, // ID user yang membuat dokumen
    } = sopData;

    // Cek apakah kode SOP sudah digunakan oleh dokumen lain
    const existingDoc = await this.findBySopCode(sop_code);
    if (existingDoc) {
      // Jika sudah ada, lempar error
      throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
    }

    // Pastikan sop_applicable memiliki nilai tanggal yang valid
    // Jika tidak ada, gunakan tanggal hari ini dalam format YYYY-MM-DD
    const validApplicableDate =
      sop_applicable || new Date().toISOString().split("T")[0];

    // Insert dokumen baru ke database
    const [result] = await pool.query(
      "INSERT INTO sop_documents (sop_code, sop_title, url, status, organization, sop_applicable, sop_version, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        sop_code, // Parameter 1: Kode SOP
        sop_title, // Parameter 2: Judul SOP
        url, // Parameter 3: URL file
        status, // Parameter 4: Status dokumen
        organization, // Parameter 5: Organisasi
        validApplicableDate, // Parameter 6: Tanggal berlaku yang valid
        sop_version, // Parameter 7: Versi SOP
        user_id, // Parameter 8: ID user pembuat
      ]
    );

    // Cek apakah insert berhasil (affectedRows = 1 berarti 1 row berhasil diinsert)
    if (result.affectedRows === 1) {
      // Return object dengan ID yang baru dibuat dan data lainnya
      return {
        id: result.insertId, // ID auto-increment dari database
        sop_code: sop_code, // Kode SOP yang baru dibuat
        ...sopData, // Spread operator untuk menyertakan semua data asli
        success: true, // Flag sukses
      };
    } else {
      // Jika insert gagal, lempar error
      throw new Error("Gagal menyimpan data");
    }
  }

  /**
   * Method untuk mengupdate dokumen SOP berdasarkan ID
   * @param {number} id - ID dokumen yang akan diupdate
   * @param {Object} sopData - Data baru untuk dokumen SOP
   * @returns {Object} - Data dokumen yang sudah diupdate
   */
  static async updateSopDoc(id, sopData) {
    // Destructuring data yang akan diupdate
    const {
      sop_code, // Kode SOP baru
      sop_title, // Judul SOP baru
      url, // URL file baru
      organization, // Organisasi baru
      sop_applicable, // Tanggal berlaku baru
      sop_version, // Versi SOP baru
    } = sopData;

    // Check for duplicate SOP code, excluding the current document
    const existingDoc = await this.findBySopCode(sop_code, id);
    if (existingDoc) {
      throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
    }

    await pool.query(
      "UPDATE sop_documents SET sop_code = ?, sop_title = ?, url = ?, organization = ?, sop_applicable = ?, sop_version = ? WHERE id = ?",
      [sop_code, sop_title, url, organization, sop_applicable, sop_version, id]
    );
    return { id, ...sopData };
  }

  static async publishSopDoc(id) {
    await pool.query("UPDATE sop_documents SET status = ? WHERE id = ?", [
      "published",
      id,
    ]);
    return true;
  }

  static async unpublishSopDoc(id) {
    await pool.query("UPDATE sop_documents SET status = ? WHERE id = ?", [
      "draft",
      id,
    ]);
    return true;
  }

  static async delete(id) {
    await pool.query("DELETE FROM sop_documents WHERE id = ?", [id]);
    return true;
  }
}

module.exports = SopDoc;
