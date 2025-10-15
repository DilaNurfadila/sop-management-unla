/**
 * File: publicVerifyController.js
 * Ringkasan: Endpoint publik untuk verifikasi dokumen SOP melalui QR checksum.
 * - Menampilkan halaman HTML statis dengan status verifikasi dan meta dokumen
 */
const PublicVerify = require("../models/PublicVerify");

exports.verifySopByChecksum = async (req, res) => {
  try {
    const { checksum } = req.params;
    const sopRows = await PublicVerify.findSopByChecksum(checksum);

    if (!sopRows || sopRows.length === 0) {
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
              <p>Dokumen SOP dengan checksum yang diminta tidak ditemukan dalam sistem.</p>
              <p><strong>Checksum:</strong> ${checksum.substring(0, 16)}...</p>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    const sop = sopRows[0];

    if (sop.review_status !== "approved") {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html lang="id">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SOP Verification - Not Approved</title>
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
              <h1>SOP Belum Disahkan</h1>
            </div>
            <div class="content">
              <div class="warning">
                <p><strong>PERINGATAN:</strong> Dokumen SOP ini belum mendapat pengesahan resmi.</p>
                <p>Status: ${sop.review_status}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

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
              <small>Dibuka pada ${new Date().toLocaleString("id-ID")}</small>
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
      </head>
      <body>
        <h2>❌ Server Error</h2>
        <p>Tidak dapat memverifikasi QR code saat ini.</p>
      </body>
      </html>
    `);
  }
};
