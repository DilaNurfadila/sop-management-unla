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

const sendVerification = async (email, access_code, expired_at) => {
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .code {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            background-color: #f8f9fa;
            padding: 10px 15px;
            border-radius: 5px;
            display: inline-block;
            margin: 10px 0;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #7f8c8d;
        }
    </style>
</head>
<body>
    <div class="container">
        <p>Hello,</p>
        <p>Here's the code for access, expire in 5 minutes (${expired_at}):</p>
        <div class="code">${access_code}</div>
        <p>Please use this code immediately as it will expire soon.</p>
        <div class="footer">
            <p>If you didn't request this code, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification",
    html: htmlBody,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    throw new Error("Failed to send verification email: " + error.message);
  }
};

module.exports = { sendVerification };
