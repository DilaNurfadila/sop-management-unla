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

module.exports = { sendForgotPasswordEmail, sendFeedbackResponse };
