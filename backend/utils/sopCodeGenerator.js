/**
 * Utils: sopCodeGenerator
 *
 * Menghasilkan kode SOP unik/terstruktur (mis. berdasarkan unit/tanggal/urutan).
 * Kontrak:
 * - generate(unit): mengembalikan string kode SOP baru yang unik
 * - validate(code): validasi format kode SOP
 */
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

    // Cari suffix terbesar yang sudah terpakai untuk pola dan periode yang sama (tanpa batasan status)
    const likePattern = `SOP-${unitNumber}/${unitCode}/${month}/${year}/%`;
    const [sopRows] = await pool.query(
      `
      SELECT 
        MAX(CAST(SUBSTRING_INDEX(sd.sop_code, '/', -1) AS UNSIGNED)) AS max_suffix
      FROM sop_documents sd
      WHERE sd.unit_scope = ? 
        AND sd.sop_code IS NOT NULL
        AND sd.sop_code LIKE ?
    `,
      [unitId, likePattern]
    );

    const maxSuffix = sopRows[0]?.max_suffix || 0;
    const nextNumber = String(Number(maxSuffix) + 1).padStart(2, "0");

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
