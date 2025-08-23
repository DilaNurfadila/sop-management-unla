// Import model Auth untuk operasi database authentication
const Auth = require("../models/Auth");
// Import model User untuk operasi user
const User = require("../models/User");
// Import model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog");
// Import model PasswordReset untuk operasi reset password
const PasswordReset = require("../models/PasswordReset");
// Import service email untuk verifikasi dan forgot password
const {
  sendVerification,
  sendForgotPasswordEmail,
} = require("../config/emailService");
// Import crypto untuk generate random number
const crypto = require("crypto");
// Import crypto-js untuk enkripsi/dekripsi
const cryptojs = require("crypto-js");
// Import jsonwebtoken untuk JWT operations
const jwt = require("jsonwebtoken");
// Import bcrypt untuk password hashing dan comparison
const bcrypt = require("bcrypt");
// Import date-fns untuk format tanggal
const { format } = require("date-fns");
// Load environment variables
require("dotenv").config();

/**
 * Helper function untuk logging aktivitas authentication
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (LOGIN, LOGOUT, REGISTER, etc)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logAuthActivity = async (
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
      "AUTH",
      descriptionStr,
      req,
      targetData?.id || null,
      targetData ? "auth" : null
    );
  } catch (error) {
    console.error("Error logging auth activity:", error.message);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

/**
 * Function untuk generate OTP 6 digit random
 * @returns {string} - OTP 6 digit dalam format string
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Function untuk generate JWT token dari data user
 * @param {Object} user - Object user dengan id, email, dan role
 * @returns {string} - JWT token yang sudah di-sign
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" } // Token berlaku 1 jam
  );
};

/**
 * Function untuk set JWT token sebagai HTTP cookie
 * @param {Object} res - Response object dari Express
 * @param {string} token - JWT token yang akan disimpan dalam cookie
 */
const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true, // Cookie tidak bisa diakses via JavaScript
    secure: process.env.NODE_ENV === "production", // Hanya dikirim melalui HTTPS di production
    sameSite: "strict", // Perlindungan terhadap CSRF attacks
    maxAge: 3600000, // 1 jam dalam milidetik
    path: "/", // Cookie tersedia untuk semua path
  });
};

/**
 * Helper function untuk enkripsi data yang aman
 * @param {string} data - Data yang akan dienkripsi
 * @returns {string} - Data yang sudah dienkripsi dalam format "iv:encrypted"
 */
const safeEncrypt = (data) => {
  if (!data || data === null || data === undefined) {
    return null;
  }

  try {
    const key =
      process.env.ENCRYPTION_KEY || "your-secret-key-here-32-characters";
    const iv = cryptojs.lib.WordArray.random(16);

    const dataString = data.toString();
    const encrypted = cryptojs.AES.encrypt(dataString, key, {
      mode: cryptojs.mode.CBC,
      iv: iv,
    }).toString();

    return iv.toString(cryptojs.enc.Hex) + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return null;
  }
};

/**
 * Controller untuk request OTP verifikasi email
 * @param {Object} req - Request object (berisi email)
 * @param {Object} res - Response object dari Express
 */
exports.requestOtp = async (req, res) => {
  try {
    // Ekstrak email dari request body
    const { email } = req.body;

    // Generate OTP 6 digit random
    const access_code = generateOtp();

    // Set waktu expired OTP (1 menit dari sekarang)
    const currentDate = new Date();
    const expired_at = new Date(currentDate.getTime() + 1 * 60 * 1000);
    const formattedExpiresAt = format(expired_at, "yyyy-MM-dd HH:mm:ss");

    // Simpan OTP ke database
    const reqOtp = await Auth.createOtp(email, access_code, formattedExpiresAt);

    // Kirim OTP ke email user
    await sendVerification(email, access_code, formattedExpiresAt);

    // Kirim response sukses
    res.status(201).json({ message: "OTP created successfully", reqOtp });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk verifikasi OTP yang dikirim user
 * @param {Object} req - Request object (berisi email dan access_code)
 * @param {Object} res - Response object dari Express
 */
exports.verifyOtp = async (req, res) => {
  try {
    // Ekstrak email dan OTP dari request body
    const { email, access_code } = req.body;

    // Validasi input yang diperlukan
    if (!email || !access_code) {
      return res
        .status(400)
        .json({ message: "Email and access code are required" });
    }

    // Cari record OTP berdasarkan email
    const otpRecord = await Auth.findByEmailVerify(email);
    if (!otpRecord) {
      return res.status(404).json({
        message: "OTP record not found or expired. please request again",
      });
    }

    // Validasi apakah OTP yang dimasukkan sesuai
    if (otpRecord.access_code !== access_code) {
      return res.status(400).json({ message: "Invalid access code" });
    }

    // Cek apakah OTP sudah expired
    if (new Date() > new Date(otpRecord.expired_at)) {
      // Tandai OTP sebagai used jika expired
      await Auth.usedOtp(email);
      return res
        .status(400)
        .json({ message: "OTP has expired, please request again" });
    }

    // Cek apakah user sudah terdaftar di sistem
    const user = await Auth.findByEmail(email);
    if (!user) {
      return res.status(303).json({
        message: "Please complete registration",
        redirect: "/auth/register",
        email, // Kirim email untuk proses registrasi
      });
    }

    // Jika user belum melengkapi nama (registrasi belum selesai)
    if (!user.name) {
      // Buat temporary token untuk akses registrasi
      const tempToken = generateToken({
        id: user.id,
        email: user.email,
        role: "unregistered",
      });
      setTokenCookie(res, tempToken);
      return res.status(200).json({ requiresRegistration: true });
    }

    // Generate JWT token untuk user yang sudah terdaftar lengkap
    const token = generateToken(user);
    setTokenCookie(res, token);

    try {
      // Enkripsi data sensitif untuk keamanan
      const iv = cryptojs.lib.WordArray.random(16); // Generate random IV
      const key = cryptojs.enc.Hex.parse(process.env.KEY); // Parse encryption key

      // Validasi environment variable KEY
      if (!process.env.KEY) {
        throw new Error("Encryption key not found in environment variables");
      }

      // Helper function untuk enkripsi yang aman
      const safeEncrypt = (data) => {
        const dataString = data ? data.toString() : "";
        const encrypted = cryptojs.AES.encrypt(dataString, key, {
          mode: cryptojs.mode.CBC,
          iv: iv,
        }).toString();
        return iv.toString(cryptojs.enc.Hex) + ":" + encrypted;
      };

      // Enkripsi semua data user dengan validasi
      const emailEncryptedSave = safeEncrypt(user.email);
      const nameEncryptedSave = safeEncrypt(user.name);
      const roleEncryptedSave = safeEncrypt(user.role);
      const unitEncryptedSave = safeEncrypt(user.unit);
      const positionEncryptedSave = safeEncrypt(user.position);

      // Tandai OTP sebagai sudah digunakan
      await Auth.usedOtp(email);

      // Simpan/update refresh token di database
      await Auth.updateToken(email, token);

      // Kirim response sukses dengan token dan data user yang dienkripsi
      res.status(200).json({
        message: "Login successful",
        token, // Token untuk API requests
        user: {
          id: user.id, // ID tidak dienkripsi untuk referensi
          email: emailEncryptedSave, // Email yang sudah dienkripsi
          name: nameEncryptedSave, // Nama yang sudah dienkripsi
          role: roleEncryptedSave, // Role yang sudah dienkripsi
          unit: unitEncryptedSave, // Unit yang sudah dienkripsi
          position: positionEncryptedSave, // Position yang sudah dienkripsi
        },
      });
    } catch (encryptionError) {
      console.error("Encryption error:", encryptionError);

      // Fallback: kirim data tanpa enkripsi jika enkripsi gagal
      await Auth.usedOtp(email);
      await Auth.updateToken(email, token);

      res.status(200).json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          unit: user.unit || "",
          position: user.position || "",
        },
      });
    }
  } catch (error) {
    console.error("VerifyOtp error:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);

    res.status(400).json({
      message: error.message,
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

/**
 * Controller untuk registrasi user baru
 * @param {Object} req - Request object (berisi data registrasi)
 * @param {Object} res - Response object dari Express
 */
exports.register = async (req, res) => {
  try {
    // Ekstrak data registrasi dari request body
    const { email, name, password, position, unit } = req.body;

    // Validasi field yang wajib diisi
    if (!email || !name || !password || !position || !unit) {
      return res.status(400).json({
        message: "Semua field wajib diisi",
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Format email tidak valid",
      });
    }

    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        message: "Email sudah terdaftar",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const userData = {
      name,
      email,
      password: hashedPassword,
      position,
      unit,
      role: "user", // Default role
      email_verified: false,
    };

    const newUser = await User.createUser(userData);

    // Generate JWT token untuk user baru
    const token = generateToken({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    // Set token sebagai cookie
    setTokenCookie(res, token);

    // Log aktivitas registrasi berhasil
    await logAuthActivity(
      newUser,
      "REGISTER",
      `User ${newUser.name} berhasil registrasi dengan email ${newUser.email}`,
      req
    );

    // Kirim response sukses registrasi
    res.status(201).json({
      message: "Registrasi berhasil",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        position: newUser.position,
        unit: newUser.unit,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(400).json({
      message: error.message || "Terjadi kesalahan saat registrasi",
    });
  }
};

/**
 * Controller untuk logout user
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.logout = async (req, res) => {
  try {
    // Ambil data user dari request (dari middleware auth jika ada)
    let userData = null;
    if (req.user) {
      userData = req.user;
    } else {
      // Coba decode token untuk mendapatkan data user
      try {
        const token = req.cookies.token;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await User.findById(decoded.id);
          if (user) {
            userData = user;
          }
        }
      } catch (e) {
        console.warn(
          "Tidak dapat mendecode token untuk logging logout:",
          e.message
        );
      }
    }

    // Hapus token yang tersimpan di database untuk user saat ini (jika ada informasi email)
    try {
      const email = req.user?.email || userData?.email;
      if (email) {
        await Auth.logout(email);
      }
    } catch (e) {
      // Jangan blokir logout hanya karena gagal menghapus token DB
      console.warn("Gagal menghapus token dari DB saat logout:", e.message);
    }

    // Log aktivitas logout jika userData tersedia
    if (userData) {
      await logAuthActivity(
        userData,
        "LOGOUT",
        `User ${userData.name} melakukan logout dari sistem`,
        req
      );
    }

    // Hapus token cookie dari browser
    res.clearCookie("token", {
      httpOnly: true, // Cookie tidak bisa diakses via JavaScript
      secure: process.env.NODE_ENV === "production", // Hanya HTTPS di production
      sameSite: "strict", // Perlindungan CSRF
      path: "/", // Path yang sama dengan saat set cookie
    });

    // Kirim response sukses logout
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};

/**
 * Controller untuk login user dengan email dan password
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan password wajib diisi",
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Format email tidak valid",
      });
    }

    // Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        message: "Email atau password tidak valid",
      });
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Email atau password tidak valid",
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Set token sebagai HTTP cookie
    setTokenCookie(res, token);

    // Enkripsi data user untuk response
    const encryptedUserData = {
      id: user.id,
      name: safeEncrypt(user.name),
      email: safeEncrypt(user.email),
      position: safeEncrypt(user.position),
      unit: safeEncrypt(user.unit),
      role: safeEncrypt(user.role),
    };

    // Log aktivitas login berhasil
    await logAuthActivity(
      user,
      "LOGIN",
      `User ${user.name} berhasil login ke sistem`,
      req
    );

    // Response sukses login
    res.status(200).json({
      message: "Login berhasil",
      user: encryptedUserData,
      token: token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat login",
      error: error.message,
    });
  }
};

/**
 * Controller untuk request forgot password
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validasi input
    if (!email) {
      return res.status(400).json({
        message: "Email wajib diisi",
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Format email tidak valid",
      });
    }

    // Cari user berdasarkan email
    const user = await User.findByEmail(email);
    if (!user) {
      // Demi keamanan, jangan beri tahu bahwa email tidak ditemukan
      return res.status(200).json({
        message: "Jika email terdaftar, link reset password akan dikirim",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 jam dari sekarang

    // Hapus token lama untuk email ini (jika ada)
    await PasswordReset.deleteByEmail(email);

    // Simpan reset token ke database
    await PasswordReset.create(email, resetToken, resetTokenExpiry);

    // Generate reset link
    const resetLink = `${
      process.env.FRONTEND_URL
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    // Kirim email reset password
    try {
      await sendForgotPasswordEmail(email, resetLink, user.name);

      res.status(200).json({
        message: "Link reset password telah dikirim ke email Anda",
      });
    } catch (emailError) {
      console.error("Error sending reset email:", emailError);

      // Hapus token dari database jika gagal kirim email
      await PasswordReset.deleteByToken(resetToken);

      res.status(500).json({
        message: "Gagal mengirim email reset password",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat memproses permintaan",
      error: error.message,
    });
  }
};

/**
 * Controller untuk reset password menggunakan token
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    // Validasi input
    if (!token || !email || !newPassword) {
      return res.status(400).json({
        message: "Token, email, dan password baru wajib diisi",
      });
    }

    // Validasi panjang password
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password minimal 6 karakter",
      });
    }

    // Verifikasi reset token
    const resetData = await PasswordReset.findByToken(token);
    if (!resetData) {
      return res.status(400).json({
        message: "Token tidak valid atau sudah kadaluarsa",
      });
    }

    // Verifikasi email cocok dengan token
    if (resetData.email !== email) {
      return res.status(400).json({
        message: "Token tidak valid untuk email ini",
      });
    }

    // Hash password baru
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password di database
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        message: "User tidak ditemukan",
      });
    }

    await User.updatePassword(user.id, hashedPassword);

    // Hapus reset token setelah berhasil reset password
    await PasswordReset.deleteByToken(token);

    res.status(200).json({
      message: "Password berhasil direset",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat reset password",
      error: error.message,
    });
  }
};
