import { dateFormatter } from "./dateFormatter";

/**
 * Tanggal Pembuatan: selalu dari approval_date (pengesahan), tidak pernah created_at
 * - Jika tidak ada approval_date: tampilkan "Belum disahkan"
 */
export function formatTanggalPembuatanFromSop(sop) {
  const approval = sop?.approval_date; // Only canonical field
  return approval ? dateFormatter(approval) : "Belum disahkan";
}

/**
 * Tanggal Revisi: tampilkan revision_date jika ada, jika tidak ada tampilkan "Belum ada revisi"
 * (Tidak memaksa terkait validasi > approval_date di sini; validasi semantik dapat diletakkan di tempat pemanggilan bila diperlukan)
 */
export function formatTanggalRevisiFromSop(sop) {
  const rev = sop?.revision_date;
  return rev ? dateFormatter(rev) : "Belum ada revisi";
}

/**
 * Tanggal Efektif: tampilkan jika SOP sudah disahkan (approval_date ada) dan review_status === 'approved'
 * - Gunakan hanya field sop_applicable (canonical)
 * - Jika belum memenuhi syarat atau kosong: "Belum ditetapkan"
 */
export function formatTanggalEfektifFromSop(sop) {
  const approved =
    Boolean(sop?.approval_date) && sop?.review_status === "approved";
  if (!approved) return "Belum ditetapkan";
  const eff = sop?.sop_applicable; // canonical field
  return eff ? dateFormatter(eff) : "Belum ditetapkan";
}
