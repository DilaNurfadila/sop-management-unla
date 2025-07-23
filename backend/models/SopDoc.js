const pool = require("../config/db");

class SopDoc {
  static async findAllSopDoc() {
    const [rows] = await pool.query("SELECT * FROM sop_documents");
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      "SELECT * FROM sop_documents WHERE id = ?",
      [id]
    );
    return rows[0];
  }

  static async findBySopCode(sop_code, excludeId = null) {
    let query = "SELECT * FROM sop_documents WHERE sop_code = ?";
    const params = [sop_code];
    if (excludeId) {
      query += " AND id != ?";
      params.push(excludeId);
    }
    const [rows] = await pool.query(query, params);
    return rows[0];
  }

  static async createSopDoc(sopData) {
    const {
      sop_code,
      sop_title,
      sop_value,
      status = "draft",
      organization,
      sop_created,
      sop_version,
    } = sopData;

    // Check for duplicate SOP code
    const existingDoc = await this.findBySopCode(sop_code);
    if (existingDoc) {
      throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
    }

    const [result] = await pool.query(
      "INSERT INTO sop_documents (sop_code, sop_title, sop_value, status, organization, sop_created, sop_version) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        sop_code,
        sop_title,
        sop_value,
        status,
        organization,
        sop_created,
        sop_version,
      ]
    );

    if (result.affectedRows === 1) {
      return {
        sop_code: sop_code,
        ...sopData,
        success: true,
      };
    } else {
      throw new Error("Gagal menyimpan data");
    }
  }

  static async updateSopDoc(id, sopData) {
    const {
      sop_code,
      sop_title,
      sop_value,
      organization,
      sop_created,
      sop_version,
    } = sopData;

    // Check for duplicate SOP code, excluding the current document
    const existingDoc = await this.findBySopCode(sop_code, id);
    if (existingDoc) {
      throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
    }

    await pool.query(
      "UPDATE sop_documents SET sop_code = ?, sop_title = ?, sop_value = ?, organization = ?, sop_created = ?, sop_version = ? WHERE id = ?",
      [
        sop_code,
        sop_title,
        sop_value,
        organization,
        sop_created,
        sop_version,
        id,
      ]
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
