const db = require("../config/db");

/**
 * Model Unit untuk operasi database tabel units
 * Menangani CRUD operations untuk data unit organisasi
 */
class Unit {
  /**
   * Constructor untuk membuat instance Unit
   * @param {string} nomorUnit - Nomor urut unit dalam organisasi
   * @param {string} kodeUnit - Kode unik unit untuk identifikasi
   * @param {string} namaUnit - Nama lengkap unit organisasi
   */
  constructor(nomorUnit, kodeUnit, namaUnit) {
    // Menyimpan nomor urut unit dalam struktur organisasi
    this.nomor_unit = nomorUnit;
    // Menyimpan kode unik unit untuk identifikasi dan referensi
    this.kode_unit = kodeUnit;
    // Menyimpan nama lengkap unit organisasi
    this.nama_unit = namaUnit;
  }

  // Membuat unit baru
  static async create(unitData) {
    try {
      const { nomor_unit, kode_unit, nama_unit } = unitData;

      // Cek duplikasi - akan throw error jika ada duplikasi
      await this.checkDuplicate(nomor_unit, kode_unit);

      const [result] = await db.execute(
        "INSERT INTO units (nomor_unit, kode_unit, nama_unit) VALUES (?, ?, ?)",
        [nomor_unit, kode_unit, nama_unit]
      );

      return {
        id: result.insertId,
        nomor_unit,
        kode_unit,
        nama_unit,
      };
    } catch (error) {
      throw error;
    }
  }

  // Mengambil semua unit
  static async findAll() {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM units ORDER BY nomor_unit ASC"
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Mengambil unit berdasarkan ID
  static async findById(id) {
    try {
      const [rows] = await db.execute("SELECT * FROM units WHERE id = ?", [id]);
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Mengambil unit berdasarkan kode unit
  static async findByKode(kodeUnit) {
    try {
      const [rows] = await db.execute(
        "SELECT * FROM units WHERE kode_unit = ?",
        [kodeUnit]
      );
      return rows[0] || null;
    } catch (error) {
      throw error;
    }
  }

  // Update unit
  static async update(id, unitData) {
    try {
      const { nomor_unit, kode_unit, nama_unit } = unitData;

      // Cek duplikasi untuk update - akan throw error jika ada duplikasi
      await this.checkDuplicateForUpdate(id, nomor_unit, kode_unit);

      const [result] = await db.execute(
        "UPDATE units SET nomor_unit = ?, kode_unit = ?, nama_unit = ? WHERE id = ?",
        [nomor_unit, kode_unit, nama_unit, id]
      );

      if (result.affectedRows === 0) {
        throw new Error("Unit tidak ditemukan");
      }

      return await this.findById(id);
    } catch (error) {
      throw error;
    }
  }

  // Hapus unit
  static async delete(id) {
    try {
      const [result] = await db.execute("DELETE FROM units WHERE id = ?", [id]);

      if (result.affectedRows === 0) {
        throw new Error("Unit tidak ditemukan");
      }

      return { message: "Unit berhasil dihapus" };
    } catch (error) {
      throw error;
    }
  }

  // Cari unit berdasarkan kata kunci
  static async search(keyword) {
    try {
      const searchTerm = `%${keyword}%`;
      const [rows] = await db.execute(
        "SELECT * FROM units WHERE nomor_unit LIKE ? OR kode_unit LIKE ? OR nama_unit LIKE ? ORDER BY nomor_unit ASC",
        [searchTerm, searchTerm, searchTerm]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  }

  // Cek duplikasi untuk create
  static async checkDuplicate(nomorUnit, kodeUnit) {
    try {
      // Cek nomor unit terlebih dahulu
      const [nomorRows] = await db.execute(
        "SELECT nomor_unit FROM units WHERE nomor_unit = ? LIMIT 1",
        [nomorUnit]
      );

      if (nomorRows.length > 0) {
        throw new Error(`Nomor unit "${nomorUnit}" sudah digunakan`);
      }

      // Cek kode unit
      const [kodeRows] = await db.execute(
        "SELECT kode_unit FROM units WHERE kode_unit = ? LIMIT 1",
        [kodeUnit]
      );

      if (kodeRows.length > 0) {
        throw new Error(`Kode unit "${kodeUnit}" sudah digunakan`);
      }

      return false;
    } catch (error) {
      throw error;
    }
  }

  // Cek duplikasi untuk update
  static async checkDuplicateForUpdate(id, nomorUnit, kodeUnit) {
    try {
      // Cek nomor unit terlebih dahulu
      const [nomorRows] = await db.execute(
        "SELECT nomor_unit FROM units WHERE nomor_unit = ? AND id != ? LIMIT 1",
        [nomorUnit, id]
      );

      if (nomorRows.length > 0) {
        throw new Error(
          `Nomor unit "${nomorUnit}" sudah digunakan oleh unit lain`
        );
      }

      // Cek kode unit
      const [kodeRows] = await db.execute(
        "SELECT kode_unit FROM units WHERE kode_unit = ? AND id != ? LIMIT 1",
        [kodeUnit, id]
      );

      if (kodeRows.length > 0) {
        throw new Error(
          `Kode unit "${kodeUnit}" sudah digunakan oleh unit lain`
        );
      }

      return false;
    } catch (error) {
      throw error;
    }
  }

  // Mendapatkan statistik unit
  static async getStats() {
    try {
      const [totalResult] = await db.execute(
        "SELECT COUNT(*) as total FROM units"
      );

      return {
        total: totalResult[0].total,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Unit;
