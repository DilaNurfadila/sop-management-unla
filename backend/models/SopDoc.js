const pool = require("../config/db");

class SopDoc {
  static async findAllSopDoc() {
    const [rows] = await pool.query("SELECT * FROM sop_documents");
    return rows;
  }

  static async findPublishedSopDocs() {
    const [rows] = await pool.query(
      "SELECT * FROM sop_documents WHERE status = 'published' ORDER BY sop_code ASC"
    );
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
      url,
      status = "draft",
      organization,
      sop_applicable,
      sop_version,
    } = sopData;

    // Check for duplicate SOP code
    const existingDoc = await this.findBySopCode(sop_code);
    if (existingDoc) {
      throw new Error("Kode SOP sudah digunakan oleh dokumen lain");
    }

    // Ensure sop_applicable has a valid date value
    const validApplicableDate =
      sop_applicable || new Date().toISOString().split("T")[0];

    const [result] = await pool.query(
      "INSERT INTO sop_documents (sop_code, sop_title, url, status, organization, sop_applicable, sop_version) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        sop_code,
        sop_title,
        url,
        status,
        organization,
        validApplicableDate,
        sop_version,
      ]
    );

    if (result.affectedRows === 1) {
      return {
        id: result.insertId,
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
      url,
      organization,
      sop_applicable,
      sop_version,
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
