/**
 * Model: PublicVerify
 *
 * Menyimpan atau menyediakan akses data yang dibutuhkan untuk halaman verifikasi publik
 * (scan QR, cek checksum/identitas SOP yang telah disetujui/published).
 */
const pool = require("../config/db");

class PublicVerify {
  static async findSopByChecksum(checksum) {
    const [rows] = await pool.execute(
      `SELECT 
        d.id,
        d.sop_code,
        d.title,
        d.qr_checksum,
        d.review_status,
        d.approval_date,
        d.sop_applicable,
        approver.name AS approver_name,
        unit.nama_unit AS unit_name
       FROM sop_documents d
       LEFT JOIN users approver ON d.approved_by = approver.id
       LEFT JOIN units unit ON d.unit_scope = unit.id
       WHERE d.qr_checksum = ?`,
      [checksum]
    );
    return rows;
  }
}

module.exports = PublicVerify;
