// Import model Feedback untuk operasi database feedback
const Feedback = require("../models/Feedback");
// Import model SopDoc untuk operasi database dokumen SOP
const SopDoc = require("../models/SopDoc");

/**
 * Controller untuk membuat feedback baru pada dokumen SOP
 * @param {Object} req - Request object dari Express (berisi data feedback)
 * @param {Object} res - Response object dari Express
 */
exports.createFeedback = async (req, res) => {
  try {
    // Ekstrak data feedback dari request body
    const { sop_id, user_name, user_email, rating, comment } = req.body;

    // Validasi input - field wajib harus ada
    if (!sop_id || !user_name || !user_email || !rating) {
      return res.status(400).json({
        message: "SOP ID, nama, email, dan rating wajib diisi",
      });
    }

    // Validasi rating - harus antara 1-5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating harus antara 1-5",
      });
    }

    // Cek apakah user sudah memberikan feedback untuk SOP ini
    const existingFeedback = await Feedback.checkExistingFeedback(
      sop_id,
      user_email
    );

    // Jika sudah ada feedback dari email yang sama, tolak request
    if (existingFeedback) {
      return res.status(400).json({
        message: "Anda sudah memberikan feedback untuk SOP ini",
      });
    }

    // Siapkan data feedback yang akan disimpan
    const feedbackData = {
      sop_id,
      user_name,
      user_email,
      rating: parseInt(rating), // Pastikan rating dalam format integer
      comment: comment || "", // Comment opsional, default empty string
    };

    // Simpan feedback ke database
    const result = await Feedback.create(feedbackData);

    // Kirim response sukses dengan data feedback yang baru dibuat
    res.status(201).json({
      message: "Feedback berhasil disimpan",
      data: result,
    });
  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan feedback berdasarkan SOP ID
 * @param {Object} req - Request object (berisi sop_id di params)
 * @param {Object} res - Response object dari Express
 */
exports.getFeedbackBySopId = async (req, res) => {
  try {
    // Ekstrak sop_id dari parameter URL
    const { sop_id } = req.params;

    // Ambil semua feedback untuk SOP tertentu
    const feedback = await Feedback.findBySopId(sop_id);

    // Ambil statistik rating (rata-rata dan total) untuk SOP
    const stats = await Feedback.getAverageRating(sop_id);

    // Kirim response dengan feedback dan statistik
    res.status(200).json({
      feedback,
      stats: {
        average_rating: parseFloat(stats.average_rating || 0).toFixed(1), // Format rata-rata dengan 1 desimal
        total_feedback: stats.total_feedback || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mendapatkan semua feedback dengan informasi SOP dan uploader
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.getAllFeedback = async (req, res) => {
  try {
    // Ambil semua feedback beserta informasi SOP
    const feedback = await Feedback.getAllFeedbackWithSOP();

    // Dapatkan daftar SOP ID yang unik dari feedback
    const uniqueSopIds = [...new Set(feedback.map((f) => f.sop_id))];
    const sopUploaderInfo = {};

    // Loop untuk mengambil informasi uploader setiap SOP
    for (let sopId of uniqueSopIds) {
      // Ambil dokumen SOP berdasarkan ID (sudah include uploader info)
      const sopDoc = await SopDoc.findById(sopId);
      if (sopDoc) {
        // Simpan informasi uploader untuk SOP ini
        sopUploaderInfo[sopId] = {
          uploader_name: sopDoc.uploader_name,
          uploader_email: sopDoc.uploader_email,
        };
      }
    }

    // Gabungkan informasi uploader dengan data feedback
    const feedbackWithUploader = feedback.map((f) => ({
      ...f,
      uploader_name: sopUploaderInfo[f.sop_id]?.uploader_name || null,
      uploader_email: sopUploaderInfo[f.sop_id]?.uploader_email || null,
    }));

    // Kirim response dengan data feedback yang sudah dilengkapi info uploader
    res.status(200).json(feedbackWithUploader);
  } catch (error) {
    console.error("Error fetching all feedback:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk menghapus feedback berdasarkan ID
 * @param {Object} req - Request object (berisi id feedback di params)
 * @param {Object} res - Response object dari Express
 */
exports.deleteFeedback = async (req, res) => {
  try {
    // Ekstrak id feedback dari parameter URL
    const { id } = req.params;

    // Hapus feedback dari database
    await Feedback.deleteFeedback(id);

    // Kirim response sukses
    res.status(200).json({ message: "Feedback berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Controller untuk mengupdate feedback berdasarkan ID
 * @param {Object} req - Request object (berisi id feedback dan data update)
 * @param {Object} res - Response object dari Express
 */
exports.updateFeedback = async (req, res) => {
  try {
    // Ekstrak id feedback dari parameter URL
    const { id } = req.params;
    // Ekstrak data update dari request body
    const { rating, comment } = req.body;

    // Validasi input - rating wajib ada
    if (!rating) {
      return res.status(400).json({
        message: "Rating wajib diisi",
      });
    }

    // Validasi rating - harus antara 1-5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating harus antara 1-5",
      });
    }

    // Siapkan data feedback yang akan diupdate
    const feedbackData = {
      rating: parseInt(rating), // Pastikan rating dalam format integer
      comment: comment || "", // Comment opsional, default empty string
    };

    // Update feedback di database
    const result = await Feedback.updateFeedback(id, feedbackData);

    // Kirim response sukses dengan data feedback yang sudah diupdate
    res.status(200).json({
      message: "Feedback berhasil diperbarui",
      data: result,
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ message: error.message });
  }
};
