const express = require("express");
const router = express.Router();
const QRCodeService = require("../services/qrCodeService");
const pool = require("../config/db");

/**
 * GET /api/qr/test
 * Test endpoint untuk memastikan routing berfungsi
 */
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "QR routes working without auth",
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/qr/validate
 * Endpoint untuk validasi QR code SOP
 */
router.post("/validate", async (req, res) => {
  try {
    const { qr_code_data } = req.body;

    if (!qr_code_data) {
      return res.status(400).json({
        success: false,
        message: "QR code data is required",
      });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qr_code_data);
    } catch (parseError) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code format",
      });
    }

    // Validate required fields
    if (!parsedData.sop_id || !parsedData.checksum) {
      return res.status(400).json({
        success: false,
        message: "QR code missing required data",
      });
    }

    // Check if SOP exists and checksum matches
    const [sopRows] = await pool.execute(
      "SELECT id, title, qr_checksum, review_status FROM sop_documents WHERE id = ?",
      [parsedData.sop_id]
    );

    if (sopRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "SOP document not found",
      });
    }

    const sop = sopRows[0];

    if (sop.qr_checksum !== parsedData.checksum) {
      return res.status(400).json({
        success: false,
        message: "Invalid QR code - checksum mismatch",
      });
    }

    res.status(200).json({
      success: true,
      message: "QR code valid - SOP document verified",
      data: {
        sop_id: sop.id,
        title: sop.title,
        review_status: sop.review_status,
        verified_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error validating QR code:", error);
    res.status(500).json({
      success: false,
      message: "Server error during QR code validation",
      error: error.message,
    });
  }
});

/**
 * GET /api/qr/verify/:sopId/:checksum
 * PUBLIC endpoint for QR scanner apps - no authentication required
 */
router.get("/verify/:sopId/:checksum", async (req, res) => {
  try {
    const { sopId, checksum } = req.params;

    // Check if SOP exists and checksum matches
    const [sopRows] = await pool.execute(
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
      WHERE d.id = ?`,
      [sopId]
    );

    if (sopRows.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SOP Verification - Document Not Found</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 50px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .icon { font-size: 48px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">❌</div>
              <h1>Dokumen SOP Tidak Ditemukan</h1>
            </div>
            <div class="content">
              <p>Dokumen SOP yang diminta tidak ada dalam sistem.</p>
              <p><strong>SOP ID:</strong> ${sopId}</p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Silakan hubungi administrator jika Anda yakin QR code ini valid.
              </p>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const sop = sopRows[0];

    if (sop.qr_checksum !== checksum) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SOP Verification - Invalid QR Code</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 50px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #ffc107; color: #212529; padding: 30px; text-align: center; }
            .content { padding: 30px; text-align: center; }
            .icon { font-size: 48px; margin-bottom: 20px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="icon">⚠️</div>
              <h1>QR Code Tidak Valid</h1>
            </div>
            <div class="content">
              <div class="warning">
                <p><strong>PERINGATAN:</strong> QR code ini tidak sesuai dengan catatan kami.</p>
                <p>Dokumen mungkin telah dimodifikasi atau rusak.</p>
              </div>
              <p><strong>SOP ID:</strong> ${sopId}</p>
              <p style="margin-top: 30px; color: #666; font-size: 14px;">
                Untuk keamanan, jangan gunakan dokumen ini tanpa verifikasi lebih lanjut.
              </p>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // QR code valid - tampilkan informasi lengkap
    res.send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SOP Verification - Document Verified</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            margin: 0; padding: 20px; min-height: 100vh; 
          }
          .container { 
            max-width: 700px; margin: 30px auto; background: white; 
            border-radius: 16px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
            overflow: hidden; 
          }
          .header { 
            background: linear-gradient(135deg, #28a745, #20c997); 
            color: white; padding: 40px 30px; text-align: center; 
          }
          .content { padding: 40px 30px; }
          .icon { font-size: 64px; margin-bottom: 15px; }
          .info-grid { 
            display: grid; grid-template-columns: 1fr 1fr; gap: 20px; 
            margin: 30px 0; 
          }
          .info-item { 
            background: #f8f9fa; border-radius: 8px; padding: 20px; 
            border-left: 4px solid #28a745; 
          }
          .info-label { 
            font-size: 12px; color: #666; text-transform: uppercase; 
            font-weight: 600; margin-bottom: 8px; 
          }
          .info-value { font-size: 16px; color: #212529; font-weight: 500; }
          .verification-badge { 
            background: #d4edda; border: 1px solid #c3e6cb; 
            border-radius: 50px; padding: 15px 25px; margin: 30px auto; 
            text-align: center; max-width: 300px; 
          }
          .footer { 
            text-align: center; padding: 20px; background: #f8f9fa; 
            color: #666; font-size: 14px; 
          }
          @media (max-width: 600px) {
            .info-grid { grid-template-columns: 1fr; }
            .container { margin: 10px; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">✅</div>
            <h1>Dokumen SOP Terverifikasi</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Dokumen ini telah diverifikasi dan asli</p>
          </div>
          
          <div class="content">
            <div class="verification-badge">
              <strong>🔒 DOKUMEN RESMI & TERVERIFIKASI</strong>
              <br>
              <small>Verified at ${new Date().toLocaleString("id-ID")}</small>
            </div>
            
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Kode SOP</div>
                <div class="info-value">${sop.sop_code || "N/A"}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Status Review</div>
                <div class="info-value">${
                  sop.review_status === "approved"
                    ? "✅ Disetujui"
                    : sop.review_status
                }</div>
              </div>
              
              <div class="info-item" style="grid-column: span 2;">
                <div class="info-label">Judul Dokumen</div>
                <div class="info-value">${sop.title}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Unit Kerja</div>
                <div class="info-value">${sop.unit_name || "N/A"}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Tanggal Pengesahan</div>
                <div class="info-value">${
                  sop.approval_date
                    ? new Date(sop.approval_date).toLocaleDateString("id-ID")
                    : "N/A"
                }</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Disahkan Oleh</div>
                <div class="info-value">${sop.approver_name || "N/A"}</div>
              </div>
              
              <div class="info-item">
                <div class="info-label">Berlaku Mulai</div>
                <div class="info-value">${
                  sop.sop_applicable
                    ? new Date(sop.sop_applicable).toLocaleDateString("id-ID")
                    : "N/A"
                }</div>
              </div>
            </div>
            
            <div style="background: #e9ecef; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
              <h4 style="margin: 0 0 10px 0; color: #495057;">Checksum Verifikasi</h4>
              <code style="font-size: 12px; color: #6c757d; word-break: break-all;">${checksum}</code>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 Universitas Langlangbuana - Sistem Manajemen SOP</p>
            <p>Dokumen ini telah diverifikasi menggunakan teknologi QR Code dengan enkripsi checksum</p>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Error verifying QR code:", error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SOP Verification - Server Error</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 50px auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background: #6c757d; color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; text-align: center; }
          .icon { font-size: 48px; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">🔧</div>
            <h1>Server Error</h1>
          </div>
          <div class="content">
            <p>Tidak dapat memverifikasi QR code saat ini.</p>
            <p>Silakan coba lagi nanti atau hubungi administrator sistem.</p>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

/**
 * GET /api/qr/generate/:sopId
 * Endpoint untuk generate QR code on-demand dari data SOP
 * PUBLIC endpoint untuk testing
 */
router.get("/generate/:sopId", async (req, res) => {
  try {
    const { sopId } = req.params;

    if (!sopId) {
      return res.status(400).json({
        success: false,
        message: "SOP ID is required",
      });
    }

    // Generate QR code dari database
    const checksumResult = await QRCodeService.generateChecksumForApprovedSOP(
      sopId,
      pool
    );

    const qrCodeBase64 = await QRCodeService.generateQRCodeFromData(
      checksumResult.validation_data
    );

    // Set proper headers untuk image
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Send image directly
    const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, "base64");

    res.send(imgBuffer);
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    res.status(500).json({
      success: false,
      message: "Server error during QR code generation",
      error: error.message,
    });
  }
});

/**
 * GET /api/qr/debug/:sopId
 * Debug endpoint yang mengembalikan JSON
 */
router.get("/debug/:sopId", async (req, res) => {
  try {
    const { sopId } = req.params;

    if (!sopId) {
      return res.status(400).json({
        success: false,
        message: "SOP ID is required",
      });
    }

    // Generate QR code dari database
    const checksumResult = await QRCodeService.generateChecksumForApprovedSOP(
      sopId,
      pool
    );
    const qrCodeBase64 = await QRCodeService.generateQRCodeFromData(
      checksumResult.validation_data
    );

    res.status(200).json({
      success: true,
      message: "QR code generated successfully",
      qr_code: qrCodeBase64,
      checksum: checksumResult.checksum,
      validation_data: checksumResult.validation_data,
    });
  } catch (error) {
    console.error("❌ Error generating QR code:", error);
    res.status(500).json({
      success: false,
      message: "Server error during QR code generation",
      error: error.message,
    });
  }
});

module.exports = router;
