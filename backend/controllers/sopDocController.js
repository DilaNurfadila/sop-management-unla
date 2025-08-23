// Import model SopDoc untuk operasi database dokumen SOP
const SopDoc = require("../models/SopDoc");
// Import model SopArchive untuk operasi arsip dokumen
const SopArchive = require("../models/SopArchive");
// Import model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog");
// Import jsonwebtoken untuk verifikasi JWT token
const jwt = require("jsonwebtoken");
// Import konfigurasi dan method Firebase Storage
const {
  storage, // Instance Firebase Storage
  ref, // Method untuk membuat referensi file
  uploadBytes, // Method untuk upload file
  getDownloadURL, // Method untuk mendapatkan URL download
  deleteObject, // Method untuk menghapus file
} = require("../config/firebase");

/**
 * Helper function untuk logging aktivitas document
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (CREATE, UPDATE, DELETE, ARCHIVE)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logDocumentActivity = async (
  user,
  action,
  description,
  req,
  targetData = null
) => {
  try {
    // Pastikan semua parameter user ada, gunakan default jika undefined
    // Jika user_id null, gunakan system user (ID 32) untuk foreign key constraint
    const userId = user?.id || 32;
    const userName = user?.name || user?.email || "Unknown User";
    const userRole = user?.role || "user";

    // Pastikan parameter lain juga tidak undefined
    const actionStr = action || "UNKNOWN";
    const descriptionStr = description || "No description";

    await ActivityLog.logUserActivity(
      userId,
      userName,
      userRole,
      actionStr,
      "DOCUMENT",
      descriptionStr,
      req,
      targetData?.id || null,
      targetData ? "document" : null
    );
  } catch (error) {
    console.error("Error logging document activity:", error.message);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

/**
 * Controller untuk mendapatkan semua dokumen SOP
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getAllDocs = async (req, res) => {
  try {
    // Ambil semua dokumen SOP dari database (termasuk info uploader)
    const docs = await SopDoc.findAllSopDoc();
    // Kirim response dengan status 200 dan data dokumen
    res.status(200).json(docs);
  } catch (error) {
    // Jika terjadi error, kirim response error dengan pesan error
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan dokumen SOP yang sudah dipublikasi
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getPublishedDocs = async (req, res) => {
  try {
    // Ambil dokumen SOP dengan status 'published' dari database
    const docs = await SopDoc.findPublishedSopDocs();
    // Kirim response sukses dengan data dokumen published
    res.status(200).json(docs);
  } catch (error) {
    // Handle error dan kirim response error
    res.status(500).json({ message: error.message });
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
    const doc = await SopDoc.findById(req.params.id);

    // Jika dokumen tidak ditemukan, kirim error 404
    if (!doc) {
      return res.status(404).json({ message: "SOP document not found" });
    }

    // Log aktivitas melihat dokumen (jika user terautentikasi)
    if (req.user) {
      await logDocumentActivity(
        req.user,
        "VIEW",
        `${req.user.name} melihat dokumen SOP: ${doc.title}`,
        req,
        { id: doc.id }
      );
    }

    // Kirim response sukses dengan data dokumen
    res.status(200).json(doc);
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token provided" });

    // Verifikasi dan decode token JWT untuk mendapatkan data user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Buat object user berdasarkan data dari token
    const user = { id: decoded.id, email: decoded.email, registered: true };

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
    // Gabungkan data dari request body dengan user_id dari user yang authenticated
    const sopData = {
      ...req.body, // Spread semua data dari request body
      user_id: req.user.id, // Tambahkan user_id dari middleware authentication
    };

    // Simpan dokumen SOP baru ke database
    const newDoc = await SopDoc.createSopDoc(sopData);

    // Log aktivitas pembuatan dokumen
    await logDocumentActivity(
      req.user,
      "CREATE",
      `User ${req.user.name} membuat dokumen SOP baru: ${sopData.title}`,
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
    // Update dokumen berdasarkan ID dengan data baru
    const updatedDoc = await SopDoc.updateSopDoc(req.params.id, req.body);

    // Kirim response sukses dengan data dokumen yang sudah diupdate
    res
      .status(200)
      .json({ message: "SOP document updated successfully", updatedDoc });
  } catch (error) {
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
    // Ubah status dokumen menjadi 'published'
    await SopDoc.publishSopDoc(req.params.id);

    // Ambil data dokumen yang sudah dipublikasi
    const updatedDoc = await SopDoc.findById(req.params.id);

    // Kirim response sukses dengan status published
    res.status(200).json({
      message: "SOP document published successfully",
      status: "published",
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
    // Ubah status dokumen menjadi 'draft'
    await SopDoc.unpublishSopDoc(req.params.id);

    // Ambil data dokumen yang sudah di-unpublish
    const updatedDoc = await SopDoc.findById(req.params.id);

    // Kirim response sukses dengan status draft
    res.status(200).json({
      message: "SOP document unpublished successfully",
      status: "draft",
      updatedDoc,
    });
  } catch (error) {
    // Handle error dan kirim response error
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk mengupdate file dokumen SOP
 * Menangani update file ke Firebase Storage dan update metadata di database
 * @param {Object} req - Request object (berisi id, file, dan metadata)
 * @param {Object} res - Response object dari Express
 */
exports.updateFile = async (req, res) => {
  try {
    // Ekstrak id dari parameter URL
    const { id } = req.params;

    // Ekstrak metadata dari request body
    const {
      code,
      title,
      organization,
      effective_date,
      version,
      archive_reason,
    } = req.body;

    // Logging untuk debugging proses update file
    console.log("=== UPDATE FILE DEBUG ===");
    console.log("Request body:", req.body);
    console.log("Archive reason received:", archive_reason);
    console.log("Has file?", !!req.file);
    console.log("========================");

    // Validasi field yang wajib ada
    if (!code || !title) {
      return res.status(400).json({ error: "Code and title are required" });
    }

    // Ambil dokumen yang sudah ada dari database
    const existingDoc = await SopDoc.findById(id);
    if (!existingDoc) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Set URL default dengan URL yang sudah ada (jika tidak upload file baru)
    let downloadURL = existingDoc.url;

    // Jika ada file baru yang diupload, arsipkan dokumen lama terlebih dahulu
    if (req.file) {
      try {
        // Log proses arsip untuk debugging
        console.log(
          "Attempting to archive document:",
          existingDoc.id,
          existingDoc.sop_title
        );
        console.log("Archive reason from request:", archive_reason);

        // Arsipkan dokumen yang sudah ada sebelum mengupdate dengan file baru
        const archiveResult = await SopArchive.archiveDocument(
          existingDoc,
          req.user.id,
          archive_reason || "Dokumen diganti dengan file baru"
        );
        console.log("Archive successful:", archiveResult);

        // Log aktivitas pengarsipan dokumen
        await logDocumentActivity(
          req.user,
          "ARCHIVE",
          `User ${req.user.name} mengarsipkan dokumen SOP: ${
            existingDoc.sop_title
          } dengan alasan: ${
            archive_reason || "Dokumen diganti dengan file baru"
          }`,
          req,
          { id: existingDoc.id }
        );
      } catch (archiveError) {
        console.error(
          "Error archiving document:",
          archiveError.message,
          archiveError
        );
        // Lanjutkan proses update meskipun arsip gagal
      }

      // Validasi tipe file - hanya PDF yang diizinkan
      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are allowed" });
      }

      // Validasi ukuran file - maksimal 10MB
      const maxSize = 10 * 1024 * 1024; // 10MB dalam bytes
      if (req.file.size > maxSize) {
        return res.status(400).json({ error: "File size exceeds 10MB limit" });
      }

      // Generate nama file unik dengan timestamp
      const timestamp = Date.now();
      const sanitizedName = req.file.originalname.replace(/\s+/g, "_");
      const fileName = `sop-documents/${timestamp}_${sanitizedName}`;

      // Buat referensi storage untuk file baru di Firebase
      const newStorageRef = ref(storage, fileName);

      // Upload file baru ke Firebase Storage dengan metadata
      const uploadResult = await uploadBytes(newStorageRef, req.file.buffer, {
        contentType: req.file.mimetype,
        customMetadata: {
          originalName: req.file.originalname,
          uploadedAt: new Date().toISOString(),
          code: code,
          title: title,
        },
      });

      // Dapatkan URL download untuk file baru
      downloadURL = await getDownloadURL(uploadResult.ref);

      // Catatan: File lama tidak dihapus dari Firebase Storage
      // karena masih diperlukan untuk akses arsip
    }

    // Siapkan data dokumen yang akan diupdate di database
    const sopData = {
      sop_code: code,
      sop_title: title,
      url: downloadURL, // URL baru atau URL yang sudah ada
      organization: organization || null,
      sop_applicable:
        effective_date && effective_date.trim() !== ""
          ? effective_date
          : existingDoc.sop_applicable, // Pertahankan tanggal lama jika tidak disediakan
      sop_version: version || null,
    };

    // Update dokumen di database
    const updatedDoc = await SopDoc.updateSopDoc(id, sopData);

    // Kirim response sukses dengan data dokumen yang diupdate
    res.status(200).json({
      message: req.file
        ? "Document and file updated successfully"
        : "Document updated successfully",
      id: id,
      url: downloadURL,
      ...sopData,
    });
  } catch (error) {
    console.error("Error updating file:", error);

    // Handle error validasi khusus
    if (
      error.message.includes("Only PDF files are allowed") ||
      error.message.includes("File size exceeds") ||
      error.message.includes("Kode SOP sudah digunakan")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    // Handle error umum
    res.status(500).json({
      error: "Failed to update file",
      details: error.message,
    });
  }
};

/**
 * Controller untuk menghapus dokumen SOP
 * Menghapus file dari Firebase Storage dan record dari database
 * @param {Object} req - Request object (berisi id dokumen)
 * @param {Object} res - Response object dari Express
 */
exports.deleteDoc = async (req, res) => {
  try {
    // Ambil dokumen terlebih dahulu untuk cek apakah ada URL file
    const doc = await SopDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Jika dokumen memiliki URL file, coba hapus dari Firebase Storage
    if (doc.url) {
      try {
        // Ekstrak path file dari URL Firebase
        const urlPattern = /\/o\/(.+?)\?/;
        const match = doc.url.match(urlPattern);
        if (match) {
          // Decode path file dan buat referensi Firebase
          const filePath = decodeURIComponent(match[1]);
          const fileRef = ref(storage, filePath);
          // Hapus file dari Firebase Storage
          await deleteObject(fileRef);
        }
      } catch (firebaseError) {
        console.error("Error deleting file from Firebase:", firebaseError);
        // Lanjutkan penghapusan database meskipun Firebase gagal
      }
    }

    // Hapus record dari database
    await SopDoc.delete(req.params.id);

    // Log aktivitas penghapusan dokumen
    await logDocumentActivity(
      req.user,
      "DELETE",
      `User ${req.user.name} menghapus dokumen SOP: ${doc.title}`,
      req,
      { id: doc.id }
    );

    // Kirim response sukses
    res.status(200).json({ message: "SOP document deleted successfully" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mengupload file SOP baru
 * Menghandle upload file ke Firebase Storage dan simpan metadata ke database
 * @param {Object} req - Request object (berisi file dan metadata)
 * @param {Object} res - Response object dari Express
 */
exports.uploadFile = async (req, res) => {
  try {
    // Validasi apakah file diupload
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Ekstrak metadata dari request body
    const { code, title, organization, effective_date, version } = req.body;

    // Validasi field yang wajib ada
    if (!code || !title) {
      return res.status(400).json({ error: "Code and title are required" });
    }

    // Validasi tipe file - hanya PDF yang diizinkan
    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    // Validasi ukuran file - maksimal 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB dalam bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ error: "File size exceeds 10MB limit" });
    }

    // Generate nama file unik dengan timestamp
    const timestamp = Date.now();
    const sanitizedName = req.file.originalname.replace(/\s+/g, "_");
    const fileName = `sop-documents/${timestamp}_${sanitizedName}`;

    // Buat referensi storage Firebase untuk file
    const storageRef = ref(storage, fileName);

    // Upload file ke Firebase Storage dengan metadata
    const uploadResult = await uploadBytes(storageRef, req.file.buffer, {
      contentType: req.file.mimetype,
      customMetadata: {
        originalName: req.file.originalname,
        uploadedAt: new Date().toISOString(),
        code: code,
        title: title,
      },
    });

    // Dapatkan URL download dari Firebase Storage
    const downloadURL = await getDownloadURL(uploadResult.ref);

    // Siapkan data untuk disimpan ke database
    // Handle tanggal efektif - gunakan tanggal hari ini jika kosong
    const finalDate =
      effective_date && effective_date.trim() !== ""
        ? effective_date
        : new Date().toISOString().split("T")[0];

    // Data dokumen SOP yang akan disimpan ke database
    const sopData = {
      sop_code: code,
      sop_title: title,
      url: downloadURL,
      status: "draft", // Status default adalah draft
      organization: organization || null,
      sop_applicable: finalDate,
      sop_version: version || null,
      user_id: req.user.id, // Tambahkan user_id dari user yang authenticated
    };

    // Simpan dokumen SOP ke database
    const newDoc = await SopDoc.createSopDoc(sopData);

    // Kirim response sukses dengan data dokumen yang baru dibuat
    res.status(201).json({
      message: "PDF file uploaded and saved successfully",
      id: newDoc.id,
      url: downloadURL,
      ...sopData,
    });
  } catch (error) {
    console.error("Error uploading file:", error);

    // Handle error validasi khusus
    if (
      error.message.includes("Only PDF files are allowed") ||
      error.message.includes("File size exceeds") ||
      error.message.includes("Kode SOP sudah digunakan")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    // Handle error umum
    res.status(500).json({
      error: "Failed to upload file",
      details: error.message,
    });
  }
};
