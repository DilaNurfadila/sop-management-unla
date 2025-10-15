/**
 * File: sopDocController.js
 * Ringkasan: Controller untuk semua operasi terkait dokumen SOP:
 * - CRUD dokumen SOP (create, read, update, delete → dipindah ke arsip, bukan hard delete)
 * - Submit SOP untuk pemeriksaan (review workflow)
 * - Publish/unpublish SOP (termasuk pengaturan visibilitas publik dan QR checksum)
 * - Akses konten SOP (private/public) dengan aturan visibilitas dan peran
 * - Validasi kelengkapan SOP sebelum diajukan untuk pemeriksaan
 * - Pencatatan aktivitas pengguna (ActivityLog) untuk audit trail
 * Ketergantungan & efek samping:
 * - Akses DB melalui model dan query langsung (pool)
 * - Mengirim email via emailService untuk event workflow (best-effort)
 * - Generate checksum QR untuk SOP yang disahkan (tanpa menyimpan gambar)
 * - Menggunakan JWT untuk mengambil profil pengguna di salah satu endpoint
 * Catatan keamanan:
 * - Endpoint tertentu membutuhkan autentikasi dan otorisasi (role admin/admin_unit/creator)
 * - Endpoint publik memiliki filter visibilitas yang ketat
 */
// Import model SopDoc untuk operasi database dokumen SOP
const SopDoc = require("../models/SopDoc"); // Model utama untuk data dokumen SOP
// Import model SopArchive untuk operasi arsip dokumen
const SopArchive = require("../models/SopArchive"); // Untuk memindahkan dokumen yang dihapus ke tabel arsip
// Import model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog"); // Mencatat jejak aktivitas pengguna
// Import jsonwebtoken untuk verifikasi JWT token
const jwt = require("jsonwebtoken"); // Digunakan pada getUserProfile untuk decode token
// Import QR Code service untuk generate QR code pengesahan
const QRCodeService = require("../services/qrCodeService"); // Generate checksum QR untuk SOP yang disahkan

/**
 * Helper function untuk logging aktivitas document
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (CREATE, UPDATE, DELETE, ARCHIVE)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logDocumentActivity = async (
  user, // Object user yang melakukan aksi (bisa dari req.user)
  action, // String nama aksi (CREATE, UPDATE, DELETE/ARCHIVE, VIEW, dsb.)
  description, // Deskripsi aktivitas yang human-readable
  req, // Request object untuk mengambil IP, user-agent, dll.
  targetData = null // Data target terkait aktivitas (mis. { id: <docId> })
) => {
  try {
    // Siapkan data user dengan fallback agar logging tetap jalan meski user tidak lengkap
    const userId = user?.id || 32; // Fallback: 32 sebagai "system user" untuk menjaga foreign key
    const userName = user?.name || user?.email || "Unknown User"; // Nama atau email, atau fallback
    const userRole = user?.role || "user"; // Peran user, fallback ke 'user'

    // Normalisasi aksi dan deskripsi dengan default supaya tidak undefined
    const actionStr = action || "UNKNOWN"; // Aksi default 'UNKNOWN'
    const descriptionStr = description || "No description"; // Deskripsi default

    // Tulis catatan aktivitas ke ActivityLog (audit trail)
    await ActivityLog.logUserActivity(
      userId, // ID pengguna
      userName, // Nama pengguna
      userRole, // Role pengguna
      actionStr, // Aksi dilakukan
      "SOP_DOCUMENT", // Kategori/entitas
      descriptionStr, // Deskripsi aktivitas
      req, // Untuk metadata request (IP, agent)
      targetData?.id || null, // ID target (jika ada)
      targetData ? "sop_document" : null // Jenis target (opsional)
    );
  } catch (error) {
    console.error("❌ Error logging document activity:", error.message); // Log error ringkas
    console.error("Full error:", error); // Log error lengkap untuk debugging
    // Jangan throw agar tidak mengganggu flow utama endpoint
  }
};

/**
 * Controller untuk mendapatkan semua dokumen SOP
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getAllDocs = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null; // Ambil ID user dari auth middleware (jika ada)
    const userRole = req.user ? req.user.role : null; // Ambil role user (jika ada)

    // Jika user tidak terautentikasi, hanya tampilkan published docs
    if (!userId) {
      const publishedDocs = await SopDoc.findPublishedSopDocs(); // Ambil semua SOP berstatus published
      return res.status(200).json(publishedDocs); // Kirim hanya yang published ke publik
    }

    // Ambil semua dokumen SOP dari database dengan filter berdasarkan permission
    const docs = await SopDoc.findAllSopDocWithPermission(userId, userRole); // Query mempertimbangkan hak akses

    // Kirim response dengan status 200 dan data dokumen
    res.status(200).json(docs);
  } catch (error) {
    // Jika terjadi error, kirim response error dengan pesan error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan dokumen SOP yang sudah dipublikasi
 * Menerapkan aturan visibilitas:
 * - Dokumen dengan unit_scope = 1 (Universitas) → terlihat semua orang
 * - Dokumen dengan unit_scope lain → hanya terlihat oleh user dari unit yang sama
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getPublishedDocs = async (req, res) => {
  try {
    // Ambil dokumen SOP dengan status 'published' dari database
    const allDocs = await SopDoc.findPublishedSopDocs(); // Semua SOP published (tanpa filter visibilitas)

    // Aturan baru: halaman /sop hanya menampilkan dokumen yang dipublikasi untuk SEMUA ORANG (public_visibility = 'everyone').
    // Dokumen dengan visibility 'unit' tidak boleh tampil di sini meskipun user login.
    const filteredDocs = allDocs.filter((doc) => {
      const visibility = doc.public_visibility || null; // Ambil visibilitas publik jika ada
      if (visibility) {
        return visibility === "everyone"; // Hanya tampilkan yang untuk semua orang
      }
      // Fallback jika kolom belum ada: gunakan aturan lama berbasis ruang lingkup
      // unit_scope = 1 (Universitas) => treated as public/everyone
      return Number(doc.unit_scope) === 1; // Anggap unit_scope=1 sebagai publik
    });

    res.status(200).json(filteredDocs); // Kembalikan daftar yang telah difilter
  } catch (error) {
    // Handle error dan kirim response error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan konten SOP yang sudah dipublikasi (public endpoint)
 * @param {Object} req - Request object (berisi params.id)
 * @param {Object} res - Response object dari Express
 */
exports.getPublishedSopContent = async (req, res) => {
  try {
    // Ambil dokumen berdasarkan ID dari parameter URL
    const doc = await SopDoc.findById(req.params.id); // Query detail SOP berdasarkan ID

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "SOP document not found",
      });
    }

    // Akses publik:
    // - published & visibility = 'everyone' => selalu boleh
    // - published & visibility = 'unit' => TIDAK boleh via public endpoint
    // - unpublished + approved => boleh untuk creator/admin/admin_unit (via token jika ada)
    if (doc.status !== "published") {
      const role = req.user?.role; // Peran user (jika ada token)
      const userId = req.user?.id; // ID user (jika ada token)
      const allowedRoles = ["admin", "admin_unit"]; // Peran yang diperbolehkan
      const isCreator =
        userId && doc.creator_id && Number(doc.creator_id) === Number(userId); // Pengecekan pemilik/penyusun
      const isAllowedRole = role && allowedRoles.includes(role); // Pengecekan role

      if (!(doc.review_status === "approved" && (isCreator || isAllowedRole))) {
        return res.status(403).json({
          success: false,
          message: "SOP document is not accessible",
        });
      }
    } else {
      // Published
      const visibility = doc.public_visibility || null; // Ambil visibilitas publik jika tersedia
      // Jika ada kolom visibility dan diset 'unit', blokir akses public endpoint
      if (visibility && visibility === "unit") {
        return res.status(403).json({
          success: false,
          message: "SOP ini hanya tersedia untuk internal unit",
        });
      }
      // Fallback: jika kolom belum ada, gunakan aturan lama berbasis unit_scope
      // unit_scope = 1 dianggap public, selain itu tolak di endpoint public
      if (!visibility && Number(doc.unit_scope) !== 1) {
        return res.status(403).json({
          success: false,
          message: "SOP ini hanya tersedia untuk internal unit",
        });
      }
    }

    // Kirim response sukses dengan data konten SOP
    const sopContent = {
      id: doc.id, // ID dokumen SOP
      sop_code: doc.sop_code, // Kode SOP
      sop_title: doc.title, // Judul SOP
      version: doc.version, // Versi dokumen
      goals: doc.goals, // Tujuan
      scope: doc.scope, // Ruang lingkup
      definition: doc.definition, // Definisi
      sop_reference: doc.sop_reference, // Referensi SOP
      procedure_description: doc.procedure_description, // Deskripsi prosedur
      status: doc.status, // Status dokumen (draft/published)
      review_status: doc.review_status, // Status review
      created_at: doc.created_at, // Tanggal dibuat
      updated_at: doc.updated_at, // Tanggal diperbarui
      approval_date: doc.approval_date, // Tanggal pengesahan (level dokumen)
      // role-based approval timestamps for traceability
      creator_approval_date: doc.creator_approval_date || null, // Waktu persetujuan penyusun
      reviewer_approval_date: doc.reviewer_approval_date || null, // Waktu persetujuan pemeriksa
      approver_approval_date: doc.approver_approval_date || null, // Waktu persetujuan pengesah
      revision_date: doc.revision_date, // Tanggal revisi (jika ada)
      sop_applicable: doc.sop_applicable, // Pihak yang terkait
      creator_name: doc.uploader_name, // Nama penyusun/uploader
      unit_name: doc.unit_name, // Nama unit
      reviewer_name: doc.reviewer_name, // Nama pemeriksa
      approver_name: doc.approver_name, // Nama pengesah
      approver_position: doc.approver_position, // Jabatan pengesah
      organization: doc.organization, // Organisasi
      unit_scope: doc.unit_scope, // ID ruang lingkup unit
      unit_scope_name: doc.unit_scope_name, // Nama ruang lingkup unit
      public_visibility: doc.public_visibility, // Visibilitas publik: everyone/unit
      qr_checksum: doc.qr_checksum, // Checksum QR jika tersedia
    };

    res.status(200).json({
      success: true,
      data: sopContent,
    });
  } catch (error) {
    console.error("❌ Error in getPublishedSopContent:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Controller untuk mendapatkan dokumen SOP berdasarkan ID
 * @param {Object} req - Request object (berisi params.id)
 * @param {Object} res - Response object dari Express
 */
exports.getDocById = async (req, res) => {
  try {
    // Ambil dokumen berdasarkan ID dari parameter URL
    const doc = await SopDoc.findById(req.params.id); // Query SOP by ID

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Tidak ada logging di sini untuk menghindari duplikasi
    // Logging hanya dilakukan di endpoint khusus /view/:id

    // Kirim response sukses dengan data dokumen (termasuk role-based approval dates bila ada)
    res.status(200).json({
      ...doc,
      creator_approval_date: doc.creator_approval_date || null,
      reviewer_approval_date: doc.reviewer_approval_date || null,
      approver_approval_date: doc.approver_approval_date || null,
    });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan profil user dari token JWT
 * @param {Object} req - Request object (berisi authorization header)
 * @param {Object} res - Response object dari Express
 */
exports.getUserProfile = async (req, res) => {
  try {
    // Ekstrak token dari Authorization header
    const token = req.headers.authorization?.split(" ")[1]; // Ambil token setelah "Bearer "
    if (!token) return res.status(401).json({ message: "No token provided" }); // Jika tidak ada token

    // Verifikasi dan decode token JWT untuk mendapatkan data user
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode dan validasi JWT
    // Buat object user berdasarkan data dari token
    const user = { id: decoded.id, email: decoded.email, registered: true }; // Bentuk profil sederhana

    // Kirim response sukses dengan data user
    res.status(200).json(user);
  } catch (error) {
    // Jika token invalid, kirim error 401
    res.status(401).json({ message: "Invalid token or user not registered" });
  }
};

/**
 * Controller untuk membuat dokumen SOP baru
 * @param {Object} req - Request object (berisi data dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.createDoc = async (req, res) => {
  try {
    // Gabungkan data dari request body dengan user_id dan versioning info
    const sopData = {
      ...req.body,
      user_id: req.user.id, // Simpan pemilik/penyusun dokumen
      version_mode: req.body.version_mode, // 'auto' atau 'manual'
      version_type: req.body.version_type, // 'minor' atau 'major' jika auto
    };

    // Simpan dokumen SOP baru ke database (dengan versioning logic)
    const newDoc = await SopDoc.createSopDoc(sopData); // Insert ke DB sesuai logic versi

    // Log aktivitas pembuatan dokumen
    await logDocumentActivity(
      req.user,
      "CREATE",
      `User ${req.user.name} membuat dokumen SOP baru: ${
        sopData.sop_title || sopData.sop_code || "Unknown Document"
      }`,
      req,
      { id: newDoc.id }
    );

    // Kirim response sukses dengan data dokumen baru
    res
      .status(201)
      .json({ message: "SOP document created successfully", newDoc });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk mengupdate dokumen SOP
 * @param {Object} req - Request object (berisi id dokumen dan data update)
 * @param {Object} res - Response object dari Express
 */
exports.updateDoc = async (req, res) => {
  try {
    // Ambil data dokumen sebelum update untuk logging
    const oldDoc = await SopDoc.findById(req.params.id); // Snapshot sebelum update

    // Gabungkan versioning info jika ada
    const sopData = {
      ...req.body,
      version_mode: req.body.version_mode, // 'auto' atau 'manual'
      version_type: req.body.version_type, // 'minor' atau 'major' jika auto
    };

    // Update dokumen berdasarkan ID dengan data baru (dengan versioning logic)
    const updatedDoc = await SopDoc.updateSopDoc(req.params.id, sopData); // Update DB dengan aturan versi

    // Log aktivitas update dokumen
    await logDocumentActivity(
      req.user,
      "UPDATE",
      `User ${req.user.name} mengubah data dokumen SOP: ${
        oldDoc?.sop_title || oldDoc?.sop_code || "Unknown Document"
      }`,
      req,
      { id: req.params.id }
    );

    // Kirim response sukses dengan data dokumen yang sudah diupdate
    res
      .status(200)
      .json({ message: "SOP document updated successfully", updatedDoc });
  } catch (error) {
    console.error(`❌ Error in updateDoc controller:`, error);
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk mempublikasi dokumen SOP
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.publishDoc = async (req, res) => {
  try {
    // Ambil data dokumen sebelum publish untuk logging
    const doc = await SopDoc.findById(req.params.id); // Ambil SOP yang akan dipublish

    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Cek aturan akses publikasi: hanya admin_unit yang bisa publikasi,
    // kecuali untuk SOP unit universitas langlangbuana
    const userRole = req.user.role; // Role user yang login
    const userId = req.user.id; // ID user yang login

    // Ambil data unit dari SOP dan user
    const pool = require("../config/db"); // Koneksi pool database
    const [unitData] = await pool.query(
      `
      SELECT 
        unit_scope_tbl.nama_unit as sop_unit_name,
        user_unit.nama_unit as user_unit_name
      FROM sop_documents d
      LEFT JOIN units unit_scope_tbl ON d.unit_scope = unit_scope_tbl.id
      LEFT JOIN users u ON u.id = ?
      LEFT JOIN units user_unit ON u.unit = user_unit.id
      WHERE d.id = ?
    `,
      [userId, req.params.id]
    );

    if (!unitData.length) {
      return res.status(404).json({ message: "Data unit tidak ditemukan" });
    }

    const { sop_unit_name, user_unit_name } = unitData[0]; // Nama unit SOP dan unit user

    // Aturan akses publikasi:
    // 1. admin hanya bisa publikasi SOP dengan ruang lingkup "Universitas Langlangbuana"
    // 2. admin_unit hanya bisa publikasi SOP dari unit mereka sendiri
    const isUniversitasScope =
      sop_unit_name &&
      sop_unit_name.toLowerCase().includes("universitas langlangbuana");

    const canPublish =
      (userRole === "admin" && isUniversitasScope) || // Admin hanya bisa publikasi SOP universitas
      (userRole === "admin_unit" && sop_unit_name === user_unit_name); // Admin unit hanya bisa publikasi SOP unit mereka

    if (!canPublish) {
      let message = "";
      if (userRole === "admin" && !isUniversitasScope) {
        message =
          "Admin hanya dapat mempublikasi SOP dengan ruang lingkup Universitas Langlangbuana.";
      } else if (
        userRole === "admin_unit" &&
        sop_unit_name !== user_unit_name
      ) {
        message =
          "Admin unit hanya dapat mempublikasi SOP dari unit kerja mereka sendiri.";
      } else {
        message = "Anda tidak memiliki akses untuk mempublikasi SOP ini.";
      }

      return res.status(403).json({ message });
    }

    // Ubah status dokumen menjadi 'published'
    await SopDoc.publishSopDoc(req.params.id); // Update status ke published

    // Simpan pilihan visibilitas jika dikirim dari frontend
    const visibility = req.body?.public_visibility; // everyone | unit (opsional dari frontend)
    if (visibility === "everyone" || visibility === "unit") {
      try {
        const pool = require("../config/db"); // Reuse koneksi DB
        await pool.query(
          "UPDATE sop_documents SET public_visibility = ? WHERE id = ?",
          [visibility, req.params.id]
        );
      } catch (e) {
        // Jika kolom belum ada, jangan gagalkan publish
        console.warn(
          "public_visibility column missing or update failed, continuing publish",
          e.message
        );
      }
    }

    // Pastikan checksum QR untuk bukti pengesahan SOP tersedia (tanpa menyimpan gambar base64 ke DB)
    try {
      const pool = require("../config/db"); // Pool DB untuk operasi cepat
      // Cek apakah qr_checksum sudah ada
      const [qrRows] = await pool.execute(
        "SELECT qr_checksum FROM sop_documents WHERE id = ?",
        [req.params.id]
      );

      const alreadyHasChecksum =
        Array.isArray(qrRows) && qrRows[0] && qrRows[0].qr_checksum;

      if (!alreadyHasChecksum) {
        // Generate checksum untuk dokumen ini (akan fallback jika belum approved)
        const { checksum } = await QRCodeService.generateChecksumForApprovedSOP(
          req.params.id,
          pool
        );

        // Simpan checksum ke database
        await pool.execute(
          "UPDATE sop_documents SET qr_checksum = ? WHERE id = ?",
          [checksum, req.params.id]
        );
      }
    } catch (qrError) {
      console.error("Error generating QR code:", qrError);
      // QR code generation error tidak menggagalkan proses publish
    }

    // Ambil data dokumen yang sudah dipublikasi
    const updatedDoc = await SopDoc.findById(req.params.id); // Refresh data terbaru

    // Log aktivitas publish dokumen
    await logDocumentActivity(
      req.user,
      "PUBLISH",
      `User ${req.user.name} mempublikasi dokumen SOP: ${
        updatedDoc?.title || updatedDoc?.sop_title || "Unknown Document"
      } (Kode: ${updatedDoc?.sop_code || "-"})`,
      req,
      { id: req.params.id }
    );

    // Kirim email publish (tanpa in-app) - best-effort
    try {
      const { sendSopPublishedEmail } = require("../config/emailService");
      const vis =
        req.body?.public_visibility || updatedDoc?.public_visibility || null; // Tentukan visibilitas final
      const title = updatedDoc?.title || updatedDoc?.sop_title || "SOP"; // Judul untuk email
      const pool = require("../config/db"); // DB untuk ambil penerima
      const [stakeRows] = await pool.query(
        `SELECT u.email FROM sop_approval_roles ar JOIN users u ON ar.user_id = u.id
         WHERE ar.sop_doc_id = ? AND ar.role IN ('Creator','Reviewer','Approver')`,
        [updatedDoc.id]
      );
      const recipients = stakeRows.map((r) => r.email).filter(Boolean); // Ambil email unik
      if (recipients.length) {
        await sendSopPublishedEmail({
          recipients,
          docTitle: title,
          sopCode: updatedDoc?.sop_code,
          version: updatedDoc?.version,
          unitScopeName: unitData[0]?.sop_unit_name,
          visibility: vis || undefined,
          frontendUrl: process.env.FRONTEND_URL,
        });
      }
    } catch (e) {
      // abaikan error email
    }

    // Kirim response sukses agar frontend bisa menutup modal dan refresh daftar
    return res.status(200).json({
      message: "SOP document published successfully",
      status: "published",
      visibility:
        req.body?.public_visibility || updatedDoc?.public_visibility || null,
      updatedDoc,
    });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk unpublish dokumen SOP (kembali ke draft)
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.unpublishDoc = async (req, res) => {
  try {
    // Ambil data dokumen sebelum unpublish untuk logging
    const doc = await SopDoc.findById(req.params.id); // SOP target unpublish

    // Ubah status dokumen menjadi 'draft'
    await SopDoc.unpublishSopDoc(req.params.id); // Set kembali ke draft

    // Ambil data dokumen yang sudah di-unpublish
    const updatedDoc = await SopDoc.findById(req.params.id); // Refresh data terbaru

    // Log aktivitas unpublish dokumen
    await logDocumentActivity(
      req.user,
      "UNPUBLISH",
      `User ${req.user.name} membatalkan publikasi dokumen SOP: ${
        doc?.sop_title || doc?.title || "Unknown Document"
      }`,
      req,
      { id: req.params.id }
    );

    // Kirim response sukses dengan status unpublished
    res.status(200).json({
      message: "SOP document unpublished successfully",
      status: "unpublished",
      updatedDoc,
    });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk menghapus dokumen SOP
 * Memindahkan dokumen ke arsip instead of hard delete
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.deleteDoc = async (req, res) => {
  try {
    // Ambil dokumen terlebih dahulu untuk cek apakah ada URL file
    const doc = await SopDoc.findById(req.params.id); // Dapatkan dokumen sebelum pindah ke arsip
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Pindahkan dokumen ke arsip (move dari sop_documents ke sop_archive)
    let archiveResult = null;
    try {
      const SopArchive = require("../models/SopArchive"); // Lazy require untuk konsistensi
      archiveResult = await SopArchive.moveToArchiveOnDelete(
        doc,
        req.user.id,
        "Document archived by user"
      );
    } catch (archiveError) {
      console.error("❌ Error moving document to archive:", archiveError);
      // Jika gagal arsip, jangan lanjutkan
      return res.status(500).json({
        message: "Failed to archive document",
        error: archiveError.message,
      });
    }

    // Catatan: saat ini tidak ada penghapusan file dari storage eksternal
    // TIDAK PERLU UPDATE STATUS karena data sudah dipindah ke arsip

    // Log aktivitas pemindahan ke arsip (bukan penghapusan permanen)
    await logDocumentActivity(
      req.user,
      "ARCHIVE",
      `User ${req.user.name} memindahkan dokumen SOP ke arsip: ${
        doc.sop_title || doc.sop_code || "Unknown Document"
      }`,
      req,
      { id: doc.id }
    );

    // Kirim response sukses
    res.status(200).json({
      message:
        "SOP document moved to archive successfully. The document has been removed from the active list and moved to archive.",
      archived: true,
      archiveId: archiveResult?.id,
      originalDocId: doc.id,
      note: "Document data has been moved from main table to archive table",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk view/membuka dokumen SOP (dengan logging aktivitas)
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.viewDoc = async (req, res) => {
  try {
    const doc = await SopDoc.findById(req.params.id); // Dapatkan SOP untuk ditampilkan
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // cek apakah user login = penyusun
    const isOwner = req.user && doc.user_id === req.user.id; // Flag pemilik dokumen

    // Log aktivitas: hanya tampilkan keterangan judul SOP dan kode SOP
    const logTitle = doc.title || doc.sop_title || "(tanpa judul)";
    const logCode = doc.sop_code || "-";
    await logDocumentActivity(
      req.user,
      "VIEW",
      `User ${req.user.name} melihat dokumen "${logTitle}", kode SOP: ${logCode}`,
      req,
      { id: doc.id }
    );

    res.status(200).json({
      ...doc,
      isOwner, // 🔑 tambahkan flag ini
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mengambil SOP berdasarkan unit kerja pengguna yang login
 * @param {Object} req - Request object dengan user info dari middleware auth
 * @param {Object} res - Response object
 */
exports.getSopByUserUnit = async (req, res) => {
  try {
    // Ambil user_id dari JWT token yang sudah di-decode di middleware
    const userId = req.user.id; // ID user dari middleware auth

    // Ambil SOP berdasarkan unit kerja user
    const sopDocuments = await SopDoc.findByUserUnit(userId); // Query SOP sesuai unit user

    // Kirim response sukses dengan data SOP
    res.status(200).json({
      message: "SOP documents retrieved successfully based on user unit",
      data: sopDocuments,
      count: sopDocuments.length,
      user_id: userId,
    });
  } catch (error) {
    console.error("❌ Error getting SOP by user unit:", error);
    res.status(500).json({
      message: "Error retrieving SOP documents by user unit",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil SOP berdasarkan unit tertentu (dengan parameter unit_id)
 * @param {Object} req - Request object dengan parameter unit_id
 * @param {Object} res - Response object
 */
exports.getSopByUnit = async (req, res) => {
  try {
    // Ambil unit_id dari parameter URL
    const { unit_id } = req.params; // unit ID dari route param

    // Validasi unit_id
    if (!unit_id) {
      return res.status(400).json({
        message: "Unit ID is required",
      });
    }

    // Ambil SOP berdasarkan unit
    const sopDocuments = await SopDoc.findByUnit(unit_id); // Query SOP by unit ID

    // Kirim response sukses dengan data SOP
    res.status(200).json({
      message: "SOP documents retrieved successfully based on unit",
      data: sopDocuments,
      count: sopDocuments.length,
      unit_id: unit_id,
    });
  } catch (error) {
    console.error("❌ Error getting SOP by unit:", error);
    res.status(500).json({
      message: "Error retrieving SOP documents by unit",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengambil SOP berdasarkan nama unit tertentu
 * @param {Object} req - Request object dengan parameter unit_name
 * @param {Object} res - Response object
 */
exports.getSopByUnitName = async (req, res) => {
  try {
    // Ambil unit_name dari parameter URL
    const { unit_name } = req.params; // Nama unit dari route param

    // Validasi unit_name
    if (!unit_name) {
      return res.status(400).json({
        message: "Unit name is required",
      });
    }

    // Ambil SOP berdasarkan nama unit
    const sopDocuments = await SopDoc.findByUnitName(unit_name); // Query SOP by unit name

    // Kirim response sukses dengan data SOP
    res.status(200).json({
      message: "SOP documents retrieved successfully based on unit name",
      data: sopDocuments,
      count: sopDocuments.length,
      unit_name: unit_name,
    });
  } catch (error) {
    console.error("❌ Error getting SOP by unit name:", error);
    res.status(500).json({
      message: "Error retrieving SOP documents by unit name",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mengajukan SOP untuk pemeriksaan
 * @param {Object} req - Request object (berisi sop_doc_id)
 * @param {Object} res - Response object dari Express
 */
exports.submitSopForReview = async (req, res) => {
  try {
    const { id } = req.params; // ID SOP dari URL
    const pool = require("../config/db"); // Pool koneksi DB
    const {
      sendSopWorkflowNotificationEmail,
    } = require("../config/emailService"); // Service email untuk notifikasi workflow

    // Validasi apakah SOP ada dan milik user yang login
    const [sopRows] = await pool.query(
      "SELECT id, sop_code, title, review_status, created_at, updated_at FROM sop_documents WHERE id = ?",
      [id]
    );

    if (sopRows.length === 0) {
      return res.status(404).json({
        message: "SOP document not found",
      });
    }

    const sopDoc = sopRows[0]; // Data SOP minimal untuk logging

    // Cek apakah sudah ada reviewer dan approver yang dipilih
    const [approvalRoles] = await pool.query(
      "SELECT * FROM sop_approval_roles WHERE sop_doc_id = ? AND role IN ('Reviewer', 'Approver')",
      [id]
    );

    const hasReviewer = approvalRoles.some((role) => role.role === "Reviewer"); // Apakah reviewer sudah ditetapkan
    const hasApprover = approvalRoles.some((role) => role.role === "Approver"); // Apakah approver sudah ditetapkan

    if (!hasReviewer || !hasApprover) {
      return res.status(400).json({
        message:
          "Harus pilih pemeriksa dan pengesah terlebih dahulu sebelum mengajukan pemeriksaan",
        missing: {
          reviewer: !hasReviewer,
          approver: !hasApprover,
        },
      });
    }

    // Update status review menjadi submitted_for_review (tanpa update updated_at)
    await pool.query(
      "UPDATE sop_documents SET review_status = 'submitted_for_review' WHERE id = ?",
      [id]
    );

    // Log aktivitas
    await logDocumentActivity(
      req.user,
      "SUBMIT_REVIEW",
      `User ${req.user.name} mengajukan SOP "${sopDoc.title}" untuk pemeriksaan`,
      req,
      { id: id }
    );

    // Ambil data untuk notifikasi reviewer
    try {
      const [docRows] = await pool.query(
        `SELECT d.title, d.sop_code, d.version,
                COALESCE(d.unit_scope, sca.unit_scope) AS unit_scope_id,
                u.nama_unit AS unit_scope_name
         FROM sop_documents d
         LEFT JOIN sop_creator_assignments sca ON d.assignment_id = sca.id
         LEFT JOIN units u ON COALESCE(d.unit_scope, sca.unit_scope) = u.id
         WHERE d.id = ?`,
        [id]
      );
      const meta = docRows && docRows[0] ? docRows[0] : {}; // Metadata SOP untuk email
      // Ambil reviewer
      const [reviewerRows] = await pool.query(
        `SELECT u.id, u.name, u.email
         FROM sop_approval_roles ar
         JOIN users u ON ar.user_id = u.id
         WHERE ar.sop_doc_id = ? AND ar.role = 'Reviewer' LIMIT 1`,
        [id]
      );
      const reviewer = reviewerRows && reviewerRows[0] ? reviewerRows[0] : null; // Reviewer aktif
      if (reviewer && reviewer.email) {
        // Kirim email notifikasi ke reviewer
        await sendSopWorkflowNotificationEmail({
          to: reviewer.email,
          userName: reviewer.name,
          eventType: "submitted_for_review",
          docTitle: meta.title,
          sopCode: meta.sop_code,
          version: meta.version,
          unitScopeName: meta.unit_scope_name,
          requesterName: req.user?.name,
          frontendUrl: process.env.FRONTEND_URL,
        });
        // In-app notification removed
      }
    } catch (e) {
      // best-effort only; ignore errors
    }

    res.status(200).json({
      message: "SOP berhasil diajukan untuk pemeriksaan",
      sop_doc_id: id,
      review_status: "submitted_for_review",
    });
  } catch (error) {
    console.error("❌ Error submitting SOP for review:", error);
    res.status(500).json({
      message: "Error submitting SOP for review",
      error: error.message,
    });
  }
};

/**
 * Controller untuk mendapatkan data content SOP (bukan PDF)
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.getSopContent = async (req, res) => {
  try {
    // Ambil dokumen berdasarkan ID dari parameter URL
    const doc = await SopDoc.findById(req.params.id); // Dapatkan detail SOP lengkap

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Log aktivitas: hanya tampilkan keterangan judul SOP dan kode SOP
    const logTitle = doc.title || doc.sop_title || "(tanpa judul)";
    const logCode = doc.sop_code || "-";
    await logDocumentActivity(
      req.user,
      "VIEW_CONTENT",
      `User ${req.user.name} melihat dokumen "${logTitle}", kode SOP: ${logCode}`,
      req,
      { id: doc.id }
    );

    // Kirim response sukses dengan data dokumen tanpa URL
    const sopContent = {
      id: doc.id, // ID SOP
      sop_code: doc.sop_code, // Kode SOP
      sop_title: doc.title, // Gunakan field 'title' dari database
      version: doc.version, // Versi dokumen
      goals: doc.goals, // Tujuan
      scope: doc.scope, // Ruang lingkup
      definition: doc.definition, // Definisi
      sop_reference: doc.sop_reference, // Referensi
      procedure_description: doc.procedure_description, // Deskripsi prosedur
      status: doc.status, // Status (draft/published)
      review_status: doc.review_status, // Status review
      created_at: doc.created_at, // Tanggal dibuat
      updated_at: doc.updated_at, // Tanggal diperbarui
      approval_date: doc.approval_date, // Tanggal pengesahan
      revision_date: doc.revision_date, // Tanggal revisi (jika ada)
      sop_applicable: doc.sop_applicable, // Pihak terkait
      creator_name: doc.uploader_name, // Nama penyusun/uploader dari join query
      unit_name: doc.unit_name, // Nama unit
      unit_scope_name: doc.unit_scope_name, // Nama ruang lingkup unit
      reviewer_name: doc.reviewer_name, // Nama reviewer
      approver_name: doc.approver_name, // Nama approver
      approver_position: doc.approver_position, // Jabatan approver
      reviewer_id: doc.reviewer_id, // ID reviewer
      approver_id: doc.approver_id, // ID approver
      organization: doc.organization, // Organisasi
      assignment_id: doc.assignment_id, // ID assignment penyusunan
      unit_scope: doc.unit_scope, // ID ruang lingkup unit
      qr_checksum: doc.qr_checksum, // Checksum QR jika ada
      public_visibility: doc.public_visibility, // Visibilitas publik (jika diset)
    };

    res.status(200).json({
      success: true,
      data: sopContent,
    });
  } catch (error) {
    console.error("❌ Error in getSopContent:", error);
    // Handle error dan kirim response error
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Controller untuk validasi SOP sebelum ajukan untuk pemeriksaan
 * Memastikan semua field dokumen SOP lengkap, ada pemeriksa/pengesah, dan ada visualisasi flowchart
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.validateBeforeSubmit = async (req, res) => {
  try {
    const sopId = req.params.id; // ID SOP dari URL

    // Ambil data SOP lengkap
    const sop = await SopDoc.findById(sopId); // Dapatkan data dokumen lengkap
    if (!sop) {
      return res.status(404).json({
        isValid: false,
        message: "SOP tidak ditemukan",
      });
    }

    const missingFields = []; // Menampung field yang belum lengkap
    let isValid = true; // Status validasi keseluruhan

    // Siapkan fallback dari assignment untuk reviewer/approver/unit_scope
    const pool = require("../config/db"); // Pool DB
    let assignment = null; // Fallback assignment (jika ada)
    if (sop.assignment_id) {
      const [assignRows] = await pool.query(
        `SELECT reviewer_id, approver_id, unit_scope FROM sop_creator_assignments WHERE id = ?`,
        [sop.assignment_id]
      );
      assignment = assignRows[0] || null; // Ambil assignment terkait SOP
    }

    // Validasi field wajib SOP
    if (!sop.title || sop.title.trim() === "") {
      missingFields.push("Judul SOP");
      isValid = false;
    }

    const effectiveUnitScope = sop.unit_scope || assignment?.unit_scope; // Gunakan unit_scope dari SOP, fallback ke assignment
    if (!effectiveUnitScope) {
      missingFields.push("Ruang Lingkup Unit Kerja");
      isValid = false;
    }

    if (!sop.goals || sop.goals.trim() === "") {
      missingFields.push("Tujuan");
      isValid = false;
    }

    if (!sop.scope || sop.scope.trim() === "") {
      missingFields.push("Ruang Lingkup");
      isValid = false;
    }

    // Definisi dan Referensi tidak wajib untuk pengajuan

    if (!sop.procedure_description || sop.procedure_description.trim() === "") {
      missingFields.push("Deskripsi Prosedur");
      isValid = false;
    }

    // Validasi pemeriksa dan pengesah
    const effectiveReviewerId = sop.reviewer_id || assignment?.reviewer_id; // Fallback ke assignment jika reviewer_id kosong
    if (!effectiveReviewerId) {
      missingFields.push("Pemeriksa");
      isValid = false;
    }

    const effectiveApproverId = sop.approver_id || assignment?.approver_id; // Fallback approver dari assignment
    if (!effectiveApproverId) {
      missingFields.push("Pengesah");
      isValid = false;
    }

    // Validasi visualisasi flowchart - cek sop_activities dan sop_visualization
    // pool sudah di-import di atas

    // 1. Cek apakah ada activities
    const [activities] = await pool.query(
      "SELECT id FROM sop_activities WHERE sop_doc_id = ?",
      [sopId]
    );

    if (activities.length === 0) {
      missingFields.push("Visualisasi SOP");
      isValid = false;
    } else {
      // 2. Cek setiap activity harus ada visualisasinya yang lengkap
      let incompleteActivities = []; // Menampung activity yang belum lengkap

      for (const activity of activities) {
        const [visualization] = await pool.query(
          `SELECT person_id, completeness, time_required, output 
           FROM sop_visualization 
           WHERE activity_id = ?`,
          [activity.id]
        );

        if (visualization.length === 0) {
          incompleteActivities.push(`Activity ${activity.id}`);
        } else {
          const viz = visualization[0];
          const missingVizFields = [];

          if (!viz.person_id) missingVizFields.push("pelaksana");
          if (!viz.completeness || viz.completeness.trim() === "")
            missingVizFields.push("kelengkapan");
          if (!viz.time_required || viz.time_required.trim() === "")
            missingVizFields.push("waktu");
          if (!viz.output || viz.output.trim() === "")
            missingVizFields.push("output");

          if (missingVizFields.length > 0) {
            incompleteActivities.push(`Activity ${activity.id}`);
          }
        }
      }

      if (incompleteActivities.length > 0) {
        missingFields.push("Visualisasi SOP");
        isValid = false;
      }
    }

    const hasVisualization =
      activities.length > 0 &&
      missingFields.filter((f) => f.includes("Visualisasi")).length === 0;

    // Kategorikan missing fields
    const documentFields = [
      "Judul SOP",
      "Ruang Lingkup Unit Kerja",
      "Tujuan",
      "Ruang Lingkup",
      "Deskripsi Prosedur",
      "Pemeriksa",
      "Pengesah",
    ];
    const visualizationFields = ["Visualisasi SOP"];

    const missingDocumentFields = missingFields.filter((field) =>
      documentFields.includes(field)
    );
    const missingVisualizationFields = missingFields.filter((field) =>
      visualizationFields.includes(field)
    );

    let message = "SOP siap untuk diajukan"; // Pesan default jika valid
    if (!isValid) {
      const messages = [];
      if (missingDocumentFields.length > 0) {
        messages.push("Dokumen");
      }
      if (missingVisualizationFields.length > 0) {
        messages.push("Visualisasi SOP");
      }
      message = messages.join(" dan ") + " belum lengkap";
    }

    res.status(200).json({
      isValid,
      hasDocument:
        sop.procedure_description && sop.procedure_description.trim() !== "",
      hasVisualization,
      missingFields,
      message,
    });
  } catch (error) {
    console.error("❌ Error in validateBeforeSubmit:", error);
    res.status(500).json({
      isValid: false,
      message: "Error validating SOP: " + error.message,
    });
  }
};

module.exports = exports;
