const pool = require("../config/db");

/**
 * Function untuk generate kode SOP
 * Format: SOP-[nomor unit]/[kode unit]/[bulan efektif]/[tahun efektif]/[nomor urut SOP dengan 2 digit]
 * @param {number} unitId - ID unit yang mengeluarkan SOP
 * @param {Date} effectiveDate - Tanggal efektif SOP (default: tanggal hari ini)
 * @returns {string} - Kode SOP yang di-generate
 */
async function generateSopCode(unitId, effectiveDate = new Date()) {
  try {
    // Validasi input
    if (!unitId) {
      throw new Error("Unit ID is required for SOP code generation");
    }

    // Ambil data unit
    const [unitRows] = await pool.query(
      "SELECT id, nomor_unit, kode_unit FROM units WHERE id = ?",
      [unitId]
    );

    if (unitRows.length === 0) {
      throw new Error("Unit not found");
    }

    const unit = unitRows[0];
    const unitNumber = unit.nomor_unit; // Gunakan nomor_unit dari database
    const unitCode = unit.kode_unit;

    // Format tanggal efektif
    const month = String(effectiveDate.getMonth() + 1).padStart(2, "0");
    const year = effectiveDate.getFullYear();

    // Cari nomor urut SOP untuk unit dan periode yang sama
    const [sopRows] = await pool.query(
      `
      SELECT COUNT(*) as count 
      FROM sop_documents sd
      JOIN units u ON sd.unit_scope = u.id
      WHERE sd.unit_scope = ? 
        AND sd.sop_code IS NOT NULL
        AND sd.sop_code LIKE ?
        AND sd.review_status = 'approved'
    `,
      [unitId, `SOP-${unitNumber}/${unitCode}/${month}/${year}/%`]
    );

    const currentCount = sopRows[0].count;
    const nextNumber = String(currentCount + 1).padStart(2, "0");

    // Generate kode SOP
    const sopCode = `SOP-${unitNumber}/${unitCode}/${month}/${year}/${nextNumber}`;

    return sopCode;
  } catch (error) {
    console.error("Error generating SOP code:", error);
    throw error;
  }
}

module.exports = {
  generateSopCode,
};
