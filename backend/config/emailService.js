/**
 * Config/Service: emailService
 *
 * Menyediakan transporter Nodemailer untuk pengiriman email notifikasi.
 * Catatan:
 * - Kredensial SMTP diambil dari environment variable.
 * - Email in-app notification telah dihapus; hanya email yang aktif.
 */
/**
 * emailService.js — Abstraksi pengiriman email (Nodemailer)
 * Menyediakan helper: reset password, balasan feedback, penugasan,
 * notifikasi workflow SOP (submitted/needs_revision), approved, published.
 */
require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Helper: Format tanggal ke bahasa Indonesia, contoh: "1 Desember 2025"
function formatIndonesianDate(dateInput) {
  if (!dateInput) return "";
  try {
    // Terima string 'YYYY-MM-DD' atau Date
    let d;
    if (typeof dateInput === "string") {
      const m = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const da = parseInt(m[3], 10);
        d = new Date(y, mo, da);
      } else {
        d = new Date(dateInput);
      }
    } else if (dateInput instanceof Date) {
      d = dateInput;
    } else {
      return String(dateInput);
    }
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return String(dateInput);
  }
}

/**
 * Function untuk mengirim email reset password
 * @param {string} email - Email penerima
 * @param {string} resetLink - Link untuk reset password
 * @param {string} userName - Nama user
 */
const sendForgotPasswordEmail = async (email, resetLink, userName) => {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #3498db;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #3498db;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #2980b9;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SOP Management UNLA</div>
        </div>
        
        <h2>Reset Password</h2>
        
        <p>Halo ${userName || "User"},</p>
        
        <p>Kami menerima permintaan untuk reset password akun Anda. Klik tombol di bawah ini untuk membuat password baru:</p>
        
        <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
        </div>
        
        <p>Atau copy dan paste link berikut ke browser Anda:</p>
        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px;">
            ${resetLink}
        </p>
        
        <div class="warning">
            <strong>Penting:</strong>
            <ul>
                <li>Link ini akan kadaluarsa dalam 1 jam</li>
                <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
                <li>Password Anda tidak akan berubah sampai Anda membuat yang baru</li>
            </ul>
        </div>
        
        <p>Jika Anda mengalami masalah dengan link di atas, salin dan tempel URL lengkap ke browser Anda.</p>
        
        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon jangan membalas email ini.</p>
            <p>&copy; 2025 SOP Management UNLA. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Reset Password - SOP Management UNLA",
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Reset email sent successfully" };
  } catch (error) {
    throw new Error("Failed to send reset password email: " + error.message);
  }
};

/**
 * Function untuk mengirim email response feedback ke user
 * @param {Object} emailData - Data email yang berisi to, userName, sopTitle, dll
 */
const sendFeedbackResponse = async (emailData) => {
  const {
    to,
    userName,
    sopTitle,
    feedbackComment,
    adminResponse,
    respondedBy,
  } = emailData;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #3498db;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            color: #3498db;
        }
        .feedback-box {
            background-color: #f8f9fa;
            padding: 20px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
            border-radius: 5px;
        }
        .response-box {
            background-color: #e8f5e9;
            padding: 20px;
            border-left: 4px solid #27ae60;
            margin: 20px 0;
            border-radius: 5px;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #eee;
            margin-top: 30px;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">SOP Management UNLA</div>
            <h2>💬 Balasan untuk Feedback Anda</h2>
        </div>
        
        <p>Halo <strong>${userName}</strong>,</p>
        
        <p>Terima kasih atas feedback yang Anda berikan untuk dokumen SOP kami. Tim kami telah meninjau dan memberikan balasan untuk feedback Anda:</p>
        
        <h3>📄 Detail Dokumen SOP:</h3>
        <p><strong>Judul:</strong> ${sopTitle}</p>
        
        <h3>💭 Feedback Anda:</h3>
        <div class="feedback-box">
            <p>${feedbackComment}</p>
        </div>
        
        <h3>💌 Balasan dari Tim Admin:</h3>
        <div class="response-box">
            <p>${adminResponse}</p>
            <p style="margin-top: 15px; font-size: 14px; color: #666;">
                <strong>Dibalas oleh:</strong> ${respondedBy}
            </p>
        </div>
        
        <p>Kami menghargai kontribusi Anda dalam meningkatkan kualitas dokumen SOP kami. Feedback Anda sangat berharga untuk terus memperbaiki layanan kami.</p>
        
        <div class="footer">
            <p>Email ini dikirim secara otomatis oleh sistem SOP Management UNLA</p>
            <p>Universitas Langlangbuana</p>
        </div>
    </div>
</body>
</html>`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: to,
    subject: `💬 Balasan Feedback SOP: ${sopTitle}`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      success: true,
      message: "Feedback response email sent successfully",
    };
  } catch (error) {
    throw new Error("Failed to send feedback response email: " + error.message);
  }
};

/**
 * Kirim email notifikasi penugasan (creator/reviewer/approver)
 * @param {Object} data
 * @param {string} data.to - Email penerima
 * @param {string} data.userName - Nama penerima
 * @param {string} data.role - Peran yang ditugaskan: 'creator' | 'reviewer' | 'approver'
 * @param {string} data.assignedByName - Nama pemberi tugas
 * @param {string} [data.notes] - Catatan tugas (untuk creator)
 * @param {string} [data.dueDate] - Tanggal jatuh tempo (YYYY-MM-DD)
 * @param {string} [data.taskType] - 'create' | 'revise'
 * @param {Object} [data.targetSop] - Info SOP target bila revise { title, sop_code, version }
 * @param {string} [data.unitScopeName] - Nama unit ruang lingkup SOP
 * @param {string} [data.frontendUrl] - URL frontend untuk CTA
 */
const sendAssignmentNotificationEmail = async (data) => {
  const {
    to,
    userName,
    role,
    assignedByName,
    notes,
    dueDate,
    taskType = "create",
    targetSop,
    unitScopeName,
    frontendUrl,
  } = data;

  const prettyRole =
    role === "creator"
      ? "Penyusun"
      : role === "reviewer"
      ? "Pemeriksa"
      : role === "approver"
      ? "Pengesah"
      : role;

  const ctaHref = frontendUrl || process.env.FRONTEND_URL || "#";
  const titleText =
    taskType === "revise" && targetSop?.title
      ? `Revisi SOP: ${targetSop.title}`
      : taskType === "create"
      ? "Pembuatan SOP Baru"
      : "Penugasan SOP";

  const sopMeta =
    taskType === "revise" && targetSop
      ? `<ul>
                     <li><strong>Judul SOP:</strong> ${targetSop.title}</li>
                     ${
                       targetSop.sop_code
                         ? `<li><strong>Kode SOP:</strong> ${targetSop.sop_code}</li>`
                         : ""
                     }
                     ${
                       targetSop.version
                         ? `<li><strong>Versi:</strong> ${targetSop.version}</li>`
                         : ""
                     }
                 </ul>`
      : "";

  const creatorNotes =
    role === "creator" && notes
      ? `<div class="box">
                     <div class="box-title">Catatan Tugas</div>
                     <div>${notes}</div>
                 </div>`
      : "";

  const displayDueDate =
    dueDate && dueDate.trim() !== "" ? formatIndonesianDate(dueDate) : "";
  const dueDateHtml = displayDueDate
    ? `<div class="pill">Jatuh Tempo: ${displayDueDate}</div>`
    : "";

  const unitScopeHtml = unitScopeName
    ? `<div class="pill">Ruang Lingkup Unit: ${unitScopeName}</div>`
    : "";

  const deadlineLine = displayDueDate
    ? ` Batas waktu penugasan adalah <strong>${displayDueDate}</strong>.`
    : "";

  // Role-specific paragraphs and CTA
  let roleIntro = `Anda mendapatkan penugasan dalam proses SOP sebagai <strong>${prettyRole}</strong> oleh <strong>${assignedByName}</strong>.`;
  let ctaLabel = "Buka Aplikasi";
  let ctaSuffix = "";

  if (role === "creator") {
    roleIntro = `Anda ditugaskan sebagai <strong>Penyusun</strong> untuk <strong>${titleText}</strong> oleh <strong>${assignedByName}</strong>. Silakan mulai penyusunan di aplikasi.${deadlineLine}`;
    ctaLabel = "Lihat Penugasan Saya";
    ctaSuffix = "/my-assignments";
  } else if (role === "reviewer") {
    roleIntro = `Anda ditetapkan sebagai <strong>Pemeriksa</strong> untuk <strong>${titleText}</strong> oleh <strong>${assignedByName}</strong>. Anda akan menerima pemberitahuan saat draf SOP diajukan oleh Penyusun untuk ditinjau.`;
  } else if (role === "approver") {
    roleIntro = `Anda ditetapkan sebagai <strong>Pengesah</strong> untuk <strong>${titleText}</strong> oleh <strong>${assignedByName}</strong>. Anda akan menerima pemberitahuan ketika dokumen siap untuk disahkan.`;
  }

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
        .container { max-width: 640px; margin: 0 auto; padding: 20px; }
        .card { background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 24px; }
        .header { border-bottom: 2px solid #2563eb; margin-bottom: 18px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
        .logo { font-size: 18px; font-weight: 700; color: #2563eb; }
        .title { font-size: 20px; font-weight: 600; margin: 6px 0 0 0; }
        .meta { margin: 12px 0; }
        .pill { display: inline-block; background: #eef2ff; color: #3730a3; padding: 6px 10px; border-radius: 9999px; font-size: 12px; margin-right: 8px; margin-bottom: 6px; }
        .box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; border-radius: 6px; margin: 14px 0; }
        .box-title { font-weight: 600; margin-bottom: 6px; }
        .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px; }
        .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
        .btn:hover { background: #1d4ed8; }
    </style>
    <title>Notifikasi Penugasan SOP</title>
    <meta name="color-scheme" content="light only">
    <meta name="supported-color-schemes" content="light">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="x-apple-disable-message-zen" />
    <meta name="format-detection" content="telephone=no" />
    <meta name="format-detection" content="date=no" />
    <meta name="format-detection" content="address=no" />
    <meta name="format-detection" content="email=no" />
    <meta http-equiv="Content-Language" content="id" />
    <meta name="lang" content="id" />
    <meta name="Content-Language" content="id" />
    <meta name="Robots" content="noindex,nofollow" />
    <meta name="referrer" content="no-referrer" />
    <meta name="x-robots-tag" content="noindex,nofollow" />
    <meta name="msapplication-TileColor" content="#2563eb" />
    <meta name="theme-color" content="#2563eb" />
    <meta name="subject" content="Notifikasi Penugasan SOP" />
    <meta name="description" content="Anda mendapatkan penugasan dalam proses SOP sebagai ${prettyRole}" />
    <meta property="og:title" content="Notifikasi Penugasan SOP" />
    <meta property="og:description" content="Anda mendapatkan penugasan dalam proses SOP sebagai ${prettyRole}" />
    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="SOP Management UNLA" />
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">SOP Management UNLA</div>
                <div class="pill">${prettyRole}</div>
            </div>
            <div class="title">Penugasan sebagai ${prettyRole}</div>
            <p>Halo <strong>${userName || "User"}</strong>,</p>
            <p>${roleIntro}</p>
            <div class="meta">
                <div class="pill">Jenis Tugas: ${
                  taskType === "revise" ? "Revisi SOP" : "Pembuatan SOP"
                }</div>
                ${dueDateHtml}
                ${unitScopeHtml}
            </div>
            ${sopMeta}
            ${creatorNotes}
            <p style="margin: 18px 0 24px 0;">Silakan buka aplikasi untuk melihat detail penugasan dan mulai bekerja.</p>
                    <div>
                        <a class="btn" href="${ctaHref}${ctaSuffix}" target="_blank" rel="noopener noreferrer">${ctaLabel}</a>
                    </div>
            <div class="footer">
                <p>Email ini dikirim otomatis. Mohon jangan dibalas.</p>
                <p>&copy; ${new Date().getFullYear()} SOP Management UNLA</p>
            </div>
        </div>
    </div>
</body>
</html>`;

  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject: `📌 Penugasan SOP - ${prettyRole} · ${titleText}`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    throw new Error("Failed to send assignment email: " + error.message);
  }
};

/**
 * Kirim email notifikasi alur SOP (submitted, ready for approval, needs revision)
 * @param {Object} data
 * @param {string} data.to - Email penerima
 * @param {string} data.userName - Nama penerima
 * @param {"submitted_for_review"|"ready_for_approval"|"needs_revision"} data.eventType
 * @param {string} data.docTitle
 * @param {string} [data.sopCode]
 * @param {string} [data.version]
 * @param {string} [data.unitScopeName]
 * @param {string} [data.requesterName] - Siapa yang melakukan aksi
 * @param {string} [data.revisionNote] - Catatan revisi (untuk needs_revision)
 * @param {string} [data.effectiveDate] - Tanggal efektif (jika relevan), akan diformat ID
 * @param {string} [data.frontendUrl]
 */
const sendSopWorkflowNotificationEmail = async (data) => {
  const {
    to,
    userName,
    eventType,
    docTitle,
    sopCode,
    version,
    unitScopeName,
    requesterName,
    revisionNote,
    effectiveDate,
    frontendUrl,
  } = data;

  const appUrl = frontendUrl || process.env.FRONTEND_URL || "#";
  const eff = effectiveDate ? formatIndonesianDate(effectiveDate) : null;

  let headerPill = "SOP";
  let title = "";
  let intro = "";
  let ctaLabel = "Buka Aplikasi";
  let ctaSuffix = "";

  if (eventType === "submitted_for_review") {
    headerPill = "Untuk Pemeriksaan";
    title = "SOP Diajukan untuk Pemeriksaan";
    intro = `Dokumen <strong>${docTitle}</strong> telah diajukan untuk diperiksa oleh <strong>${
      requesterName || "Penyusun"
    }</strong>. Mohon lakukan peninjauan.`;
    ctaLabel = "Tinjau Dokumen";
  } else if (eventType === "ready_for_approval") {
    headerPill = "Siap Disahkan";
    title = "SOP Siap untuk Disahkan";
    intro = `Dokumen <strong>${docTitle}</strong> telah disetujui oleh Pemeriksa dan menunggu pengesahan Anda.`;
    ctaLabel = "Tinjau untuk Pengesahan";
  } else if (eventType === "needs_revision") {
    headerPill = "Butuh Revisi";
    title = "Revisi Diperlukan";
    intro = `Dokumen <strong>${docTitle}</strong> memerlukan revisi berdasarkan tinjauan Pemeriksa.`;
    ctaLabel = "Perbaiki Dokumen";
    ctaSuffix = "/my-assignments";
  }

  const sopMeta = `
            <ul>
                ${
                  sopCode
                    ? `<li><strong>Kode SOP:</strong> ${sopCode}</li>`
                    : ""
                }
                ${version ? `<li><strong>Versi:</strong> ${version}</li>` : ""}
                ${
                  unitScopeName
                    ? `<li><strong>Ruang Lingkup Unit:</strong> ${unitScopeName}</li>`
                    : ""
                }
                ${
                  eff ? `<li><strong>Tanggal Efektif:</strong> ${eff}</li>` : ""
                }
            </ul>
        `;

  const noteBox = revisionNote
    ? `<div class="box">
                    <div class="box-title">Catatan Revisi</div>
                    <div>${revisionNote}</div>
                </div>`
    : "";

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8" />
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .card { background: #fff; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 24px; }
            .header { border-bottom: 2px solid #2563eb; margin-bottom: 18px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between; }
            .logo { font-size: 18px; font-weight: 700; color: #2563eb; }
            .title { font-size: 20px; font-weight: 600; margin: 6px 0 0 0; }
            .pill { display: inline-block; background: #eef2ff; color: #3730a3; padding: 6px 10px; border-radius: 9999px; font-size: 12px; margin-right: 8px; margin-bottom: 6px; }
            .box { background: #f8fafc; border-left: 4px solid #2563eb; padding: 14px; border-radius: 6px; margin: 14px 0; }
            .box-title { font-weight: 600; margin-bottom: 6px; }
            .footer { font-size: 12px; color: #6b7280; text-align: center; margin-top: 24px; }
            .btn { display: inline-block; background: #2563eb; color: #fff !important; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600; }
            .btn:hover { background: #1d4ed8; }
        </style>
        <title>${title}</title>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="header">
                    <div class="logo">SOP Management UNLA</div>
                    <div class="pill">${headerPill}</div>
                </div>
                <div class="title">${title}</div>
                <p>Halo <strong>${userName || "User"}</strong>,</p>
                <p>${intro}</p>
                ${sopMeta}
                ${noteBox}
                <div>
                    <a class="btn" href="${appUrl}${ctaSuffix}" target="_blank" rel="noopener noreferrer">${ctaLabel}</a>
                </div>
                <div class="footer">
                    <p>Email ini dikirim otomatis. Mohon jangan dibalas.</p>
                    <p>&copy; ${new Date().getFullYear()} SOP Management UNLA</p>
                </div>
            </div>
        </div>
    </body>
    </html>`;

  const mailOptions = {
    from: process.env.EMAIL,
    to,
    subject: `${title} · ${docTitle}`,
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    throw new Error("Failed to send workflow email: " + error.message);
  }
};

module.exports = {
  sendForgotPasswordEmail,
  sendFeedbackResponse,
  sendAssignmentNotificationEmail,
  sendSopWorkflowNotificationEmail,
};

/**
 * Kirim email ketika SOP sudah DISAHKAN (final approval) kepada stakeholder inti.
 * @param {Object} data
 * @param {string[]} data.recipients - Daftar email penerima
 * @param {string} data.docTitle
 * @param {string} [data.sopCode]
 * @param {string} [data.version]
 * @param {string} [data.unitScopeName]
 * @param {string} [data.effectiveDate]
 * @param {string} [data.frontendUrl]
 */
async function sendSopApprovedEmail(data) {
  const {
    recipients = [],
    docTitle,
    sopCode,
    version,
    unitScopeName,
    effectiveDate,
    frontendUrl,
  } = data || {};
  if (!recipients.length) return { skipped: true };
  const appUrl = frontendUrl || process.env.FRONTEND_URL || "#";
  const eff = effectiveDate ? formatIndonesianDate(effectiveDate) : null;
  const meta = `
    <ul>
      ${sopCode ? `<li><strong>Kode SOP:</strong> ${sopCode}</li>` : ""}
      ${version ? `<li><strong>Versi:</strong> ${version}</li>` : ""}
      ${
        unitScopeName
          ? `<li><strong>Ruang Lingkup:</strong> ${unitScopeName}</li>`
          : ""
      }
      ${eff ? `<li><strong>Tanggal Efektif:</strong> ${eff}</li>` : ""}
    </ul>`;
  const htmlBody = `<!DOCTYPE html><html><head><meta charset='utf-8'/>
  <style>body{font-family:Arial,sans-serif;line-height:1.6;background:#f5f5f5;color:#333}.wrap{max-width:640px;margin:0 auto;padding:20px}.card{background:#fff;border-radius:10px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08)}.header{border-bottom:2px solid #2563eb;margin-bottom:18px;padding-bottom:10px;display:flex;justify-content:space-between;align-items:center}.logo{font-size:18px;font-weight:700;color:#2563eb}.pill{background:#def7ec;color:#03543f;padding:6px 10px;border-radius:9999px;font-size:12px}.btn{display:inline-block;background:#2563eb;color:#fff!important;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;margin-top:12px}.btn:hover{background:#1d4ed8}.footer{font-size:12px;color:#6b7280;text-align:center;margin-top:24px}</style></head><body><div class='wrap'><div class='card'><div class='header'><div class='logo'>SOP Management UNLA</div><div class='pill'>Disahkan</div></div><h2>SOP Telah Disahkan</h2><p>Dokumen <strong>${docTitle}</strong> telah <strong>disahkan</strong> dan siap untuk dipublikasikan atau sudah menunggu proses publikasi.</p>${meta}<a class='btn' href='${appUrl}' target='_blank' rel='noopener'>Buka Aplikasi</a><div class='footer'>&copy; ${new Date().getFullYear()} SOP Management UNLA</div></div></div></body></html>`;
  for (const to of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: `✅ SOP Disahkan · ${docTitle}`,
        html: htmlBody,
      });
    } catch (e) {
      // skip error per email
    }
  }
  return { success: true };
}

/**
 * Kirim email ketika SOP dipublikasi.
 * Jika visibility everyone -> semua penerima; unit -> pengguna unit + admin + superadmin.
 * @param {Object} data
 * @param {string[]} data.recipients
 * @param {string} data.docTitle
 * @param {string} [data.sopCode]
 * @param {string} [data.version]
 * @param {string} [data.unitScopeName]
 * @param {string} [data.visibility] 'everyone' | 'unit'
 * @param {string} [data.frontendUrl]
 */
async function sendSopPublishedEmail(data) {
  const {
    recipients = [],
    docTitle,
    sopCode,
    version,
    unitScopeName,
    visibility,
    frontendUrl,
  } = data || {};
  if (!recipients.length) return { skipped: true };
  const appUrl = frontendUrl || process.env.FRONTEND_URL || "#";
  const scopeText = visibility === "everyone" ? "Publik" : "Unit";
  const meta = `
    <ul>
      ${sopCode ? `<li><strong>Kode SOP:</strong> ${sopCode}</li>` : ""}
      ${version ? `<li><strong>Versi:</strong> ${version}</li>` : ""}
      ${
        unitScopeName
          ? `<li><strong>Ruang Lingkup:</strong> ${unitScopeName}</li>`
          : ""
      }
      <li><strong>Visibilitas:</strong> ${scopeText}</li>
    </ul>`;
  const htmlBody = `<!DOCTYPE html><html><head><meta charset='utf-8'/>
  <style>body{font-family:Arial,sans-serif;line-height:1.6;background:#f5f5f5;color:#333}.wrap{max-width:640px;margin:0 auto;padding:20px}.card{background:#fff;border-radius:10px;padding:24px;box-shadow:0 2px 12px rgba(0,0,0,.08)}.header{border-bottom:2px solid #2563eb;margin-bottom:18px;padding-bottom:10px;display:flex;justify-content:space-between;align-items:center}.logo{font-size:18px;font-weight:700;color:#2563eb}.pill{background:#dbeafe;color:#1e40af;padding:6px 10px;border-radius:9999px;font-size:12px}.btn{display:inline-block;background:#2563eb;color:#fff!important;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;margin-top:12px}.btn:hover{background:#1d4ed8}.footer{font-size:12px;color:#6b7280;text-align:center;margin-top:24px}</style></head><body><div class='wrap'><div class='card'><div class='header'><div class='logo'>SOP Management UNLA</div><div class='pill'>Dipublikasi</div></div><h2>SOP Dipublikasi</h2><p>Dokumen <strong>${docTitle}</strong> telah dipublikasi (${scopeText}).</p>${meta}<a class='btn' href='${appUrl}' target='_blank' rel='noopener'>Lihat SOP</a><div class='footer'>&copy; ${new Date().getFullYear()} SOP Management UNLA</div></div></div></body></html>`;
  for (const to of recipients) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL,
        to,
        subject: `📢 SOP Dipublikasi (${scopeText}) · ${docTitle}`,
        html: htmlBody,
      });
    } catch (e) {
      // ignore individual failure
    }
  }
  return { success: true };
}

// Export tambahan
module.exports.sendSopApprovedEmail = sendSopApprovedEmail;
module.exports.sendSopPublishedEmail = sendSopPublishedEmail;
