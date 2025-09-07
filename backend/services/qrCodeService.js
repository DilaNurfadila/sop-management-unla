const QRCode = require("qrcode");
const crypto = require("crypto");

/**
 * Service untuk generate QR Code bukti pengesahan SOP
 */
class QRCodeService {
  /**
   * Generate data pengesahan SOP dengan checksum SHA-256
   * @param {Object} sopData - Data SOP yang sudah disahkan
   * @returns {Object} Data yang akan di-encode ke QR code
   */
  static generateValidationData(sopData) {
    // Data pengesahan yang akan disimpan di QR code
    const validationData = {
      sop_code: sopData.sop_code,
      title: sopData.title,
      version: sopData.version,
      effective_date: sopData.effective_date,
      approval_date: sopData.approval_date,
      approved_by: sopData.approved_by_name,
      approved_by_email: sopData.approved_by_email || sopData.approved_by_id,
      unit_scope: sopData.unit_scope_name,
      generated_at: new Date().toISOString(),
      doc_id: sopData.id,
    };

    // Generate checksum SHA-256 dari data pengesahan
    const dataString = JSON.stringify(validationData);
    const checksum = crypto
      .createHash("sha256")
      .update(dataString)
      .digest("hex");

    // Tambahkan checksum ke data
    validationData.checksum = checksum;

    return validationData;
  }

  /**
   * Generate QR code image dari data pengesahan
   * @param {Object} sopData - Data SOP yang sudah disahkan
   * @returns {Promise<string>} Base64 string dari QR code image
   */
  static async generateQRCode(sopData) {
    try {
      // Generate data dengan checksum
      const validationData = this.generateValidationData(sopData);

      // Convert data ke JSON string untuk QR code
      const qrCodeData = JSON.stringify(validationData);

      // Generate QR code sebagai base64 image
      const qrCodeOptions = {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 200,
      };

      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, qrCodeOptions);

      return {
        qr_code_base64: qrCodeBase64,
        validation_data: validationData,
        qr_code_data: qrCodeData,
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Gagal generate QR code: " + error.message);
    }
  }

  /**
   * Validate QR code data dengan checksum SHA-256
   * @param {string} qrCodeData - JSON string dari QR code
   * @returns {Object} Hasil validasi
   */
  static validateQRCode(qrCodeData) {
    try {
      // Parse JSON data dari QR code
      const data = JSON.parse(qrCodeData);

      // Ambil checksum dari data
      const providedChecksum = data.checksum;
      delete data.checksum;

      // Generate checksum SHA-256 dari data (tanpa checksum)
      const dataString = JSON.stringify(data);
      const calculatedChecksum = crypto
        .createHash("sha256")
        .update(dataString)
        .digest("hex");

      // Bandingkan checksum
      const isValid = providedChecksum === calculatedChecksum;

      // Restore checksum ke data
      data.checksum = providedChecksum;

      return {
        is_valid: isValid,
        data: data,
        error: isValid
          ? null
          : "Checksum tidak valid - QR code mungkin sudah dimodifikasi",
      };
    } catch (error) {
      return {
        is_valid: false,
        data: null,
        error: "QR code tidak valid: " + error.message,
      };
    }
  }

  /**
   * Generate checksum untuk SOP yang sudah approved dan simpan ke database
   * @param {number} sopId - ID dokumen SOP
   * @param {Object} dbConnection - Database connection (pool atau connection transaksi)
   * @returns {Promise<string>} Checksum SHA-256
   */
  static async generateChecksumForApprovedSOP(sopId, dbConnection) {
    try {
      // Query untuk mendapatkan data SOP lengkap dengan data approval
      const query = `
        SELECT 
          sd.id,
          sd.sop_code,
          sd.title,
          sd.version,
          sd.sop_applicable as effective_date,
          sd.approval_date,
          u_approved.name as approved_by_name,
          u_approved.email as approved_by_email,
          units.nama_unit as unit_scope_name,
          sd.review_status
        FROM sop_documents sd
        LEFT JOIN users u_approved ON sd.approved_by = u_approved.id
        LEFT JOIN units ON sd.unit_scope = units.id
        WHERE sd.id = ? AND sd.review_status = 'approved'
      `;

      const [rows] = await dbConnection.execute(query, [sopId]);

      if (rows.length === 0) {
        // Jika tidak ditemukan dengan approved, coba query tanpa status check
        const fallbackQuery = `
          SELECT 
            sd.id,
            sd.sop_code,
            sd.title,
            sd.version,
            sd.sop_applicable as effective_date,
            sd.approval_date,
            u_approved.name as approved_by_name,
            u_approved.email as approved_by_email,
            units.nama_unit as unit_scope_name,
            sd.review_status
          FROM sop_documents sd
          LEFT JOIN users u_approved ON sd.approved_by = u_approved.id
          LEFT JOIN units ON sd.unit_scope = units.id
          WHERE sd.id = ?
        `;

        const [fallbackRows] = await dbConnection.execute(fallbackQuery, [
          sopId,
        ]);

        if (fallbackRows.length === 0) {
          throw new Error("SOP tidak ditemukan");
        } else {
          // Use fallback data
          const sopData = fallbackRows[0];
          const validationData = this.generateValidationData(sopData);
          return {
            checksum: validationData.checksum,
            validation_data: validationData,
          };
        }
      }

      const sopData = rows[0];

      // Generate validation data dengan checksum
      const validationData = this.generateValidationData(sopData);

      return {
        checksum: validationData.checksum,
        validation_data: validationData,
      };
    } catch (error) {
      console.error("Error generating checksum for SOP:", error);
      throw error;
    }
  }

  /**
   * Generate QR code on-demand dari data SOP dan checksum
   * @param {Object} sopData - Data SOP dengan checksum
   * @returns {Promise<string>} Base64 QR code
   */
  static async generateQRCodeFromData(sopData) {
    try {
      // Convert data ke JSON string untuk QR code
      const qrCodeData = JSON.stringify(sopData);

      // Generate QR code sebagai base64 image
      const qrCodeOptions = {
        errorCorrectionLevel: "M",
        type: "image/png",
        quality: 0.92,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        width: 200,
      };

      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData, qrCodeOptions);

      return qrCodeBase64;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new Error("Gagal generate QR code: " + error.message);
    }
  }
}

module.exports = QRCodeService;
