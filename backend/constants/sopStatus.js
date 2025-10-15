/**
 * Constants: SOP Status & Review Status
 *
 * Referensi enum untuk status dokumen SOP, status review, dan tipe versioning.
 * Tujuan:
 * - Satu sumber kebenaran untuk nilai status agar konsisten di seluruh kode.
 * - Menghindari typo pada string literal (gunakan import STATUS/REVIEW_STATUS/VERSION_TYPE).
 */
/**
 * SOP STATUS & REVIEW STATUS REFERENCE
 *
 * STATUS VALUES:
 * - "draft"      : SOP baru/edit (hanya creator bisa lihat)
 * - "unpublished": Submit untuk review (creator+reviewer+approver bisa lihat)
 * - "published"  : Sudah disahkan (semua bisa lihat)
 * - "archived"   : Tidak aktif
 *
 * REVIEW_STATUS VALUES:
 * - NULL                 : Belum ada proses review
 * - "submitted_for_review": Menunggu reviewer
 * - "reviewer_approved"  : Menunggu approver
 * - "approved"           : Final approved
 * - "needs_revision"     : Perlu perbaikan
 * - "major_pending"      : Major revision menunggu publish (version naik saat publish)
 *
 * VERSIONING:
 * - Minor: Version naik immediately (V.1.0 → V.1.1), status→unpublished, review_status→approved
 * - Major: Version TIDAK naik saat update, status→draft, review_status→major_pending
 *          Saat publish: Version naik (V.1.0 → V.2.0), status→unpublished, review_status→submitted_for_review
 *
 * FLOW:
 * draft(NULL) → unpublished(submitted_for_review) → unpublished(reviewer_approved) → published(approved)
 *      ↑                                ↓                                                      ↓
 *      └── needs_revision ← ← ← ← ← ← ← ←                                         major_edit ←┘
 *                                                                                      ↓
 *                                                                          draft(major_pending)
 *                                                                                      ↓ (publish major)
 *                                                               unpublished(submitted_for_review) + version++
 *                                                                                      ↓ (approve ulang)
 *                                                                           published(approved)
 */

module.exports = {
  STATUS: {
    DRAFT: "draft",
    UNPUBLISHED: "unpublished",
    PUBLISHED: "published",
    ARCHIVED: "archived",
  },

  REVIEW_STATUS: {
    NONE: null,
    SUBMITTED_FOR_REVIEW: "submitted_for_review",
    REVIEWER_APPROVED: "reviewer_approved",
    APPROVED: "approved",
    NEEDS_REVISION: "needs_revision",
    MAJOR_PENDING: "major_pending",
  },

  VERSION_TYPE: {
    MINOR: "minor",
    MAJOR: "major",
  },
};
