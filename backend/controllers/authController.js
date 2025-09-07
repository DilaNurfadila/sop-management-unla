// Import model Auth untuk operasi database authentication
const Auth = require("../models/Auth");
// Import model User untuk operasi user
const User = require("../models/User");
// Import model ActivityLog untuk logging aktivitas
const ActivityLog = require("../models/ActivityLog");
// Import model PasswordReset untuk operasi reset password
const PasswordReset = require("../models/PasswordReset");
// Import service email untuk verifikasi dan forgot password
const { sendForgotPasswordEmail } = require("../config/emailService");
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
    // Tidak throw error agar tidak mengganggu flow utama
  }
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
 * @param {Object} req - Request object untuk mendapatkan origin
 */
const setTokenCookie = (res, token, req = null) => {
  // Tentukan nama cookie berdasarkan origin untuk menghindari konflik antar port
  let cookieName = "token";

  if (req && req.headers.origin) {
    const origin = req.headers.origin;
    if (origin.includes(":5174")) {
      cookieName = "token_5174";
    } else if (origin.includes(":5173")) {
      cookieName = "token_5173";
    }
    // Default tetap "token" untuk origin lainnya
  }

  // Konfigurasi cookie yang berbeda untuk development dan production
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true, // Cookie tidak bisa diakses via JavaScript (keamanan XSS)
    secure: isProduction, // Hanya dikirim melalui HTTPS di production
    sameSite: isProduction ? "strict" : "lax", // Strict di production, Lax di development
    maxAge: 3600000, // 1 jam dalam milidetik (1000ms * 60s * 60m)
    path: "/", // Cookie tersedia untuk semua path

    // Development specific settings
    ...(isProduction
      ? {}
      : {
          // Di development, tambahkan domain localhost untuk compatibility
          domain: req?.headers?.host?.includes("localhost")
            ? "localhost"
            : undefined,
        }),

    // Production specific settings
    ...(isProduction
      ? {
          // Di production, bisa set domain spesifik
          domain: process.env.COOKIE_DOMAIN || undefined,
          // Tambahan flag secure untuk production
          secure: true,
          sameSite: "strict",
        }
      : {}),
  };

  // Log cookie configuration di development
  if (!isProduction) {
  }

  res.cookie(cookieName, token, cookieOptions);

  // Return nama cookie yang digunakan untuk referensi
  return cookieName;
};

/**
 * Function untuk clear JWT token cookie dari browser
 * @param {Object} res - Response object dari Express
 * @param {Object} req - Request object untuk mendapatkan origin
 * @returns {string} - Nama cookie yang di-clear
 */
const clearTokenCookie = (res, req = null) => {
  // Tentukan nama cookie berdasarkan origin (sama dengan setTokenCookie)
  let cookieName = "token";

  if (req && req.headers.origin) {
    const origin = req.headers.origin;
    if (origin.includes(":5174")) {
      cookieName = "token_5174";
    } else if (origin.includes(":5173")) {
      cookieName = "token_5173";
    }
  }

  // Konfigurasi cookie yang sama dengan setTokenCookie untuk clear yang proper
  const isProduction = process.env.NODE_ENV === "production";

  const clearOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "strict" : "lax",
    path: "/",

    // Development specific settings
    ...(isProduction
      ? {}
      : {
          domain: req?.headers?.host?.includes("localhost")
            ? "localhost"
            : undefined,
        }),

    // Production specific settings
    ...(isProduction
      ? {
          domain: process.env.COOKIE_DOMAIN || undefined,
          secure: true,
          sameSite: "strict",
        }
      : {}),
  };

  // Log cookie clearing di development
  if (!isProduction) {
  }

  res.clearCookie(cookieName, clearOptions);

  return cookieName;
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
    return null;
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
    setTokenCookie(res, token, req);

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
    // Ambil data user lengkap dari database
    let userData = null;
    let userId = null;

    // Cek apakah ada user dari middleware auth
    if (req.user) {
      userId = req.user.id;
    } else {
      // Coba decode token untuk mendapatkan user ID
      try {
        // Pastikan req.cookies ada sebelum mengakses property
        const token = req.cookies ? req.cookies.token : null;
        if (token) {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        }
      } catch (e) {}
    }

    // Jika ada user ID, ambil data lengkap dari database
    if (userId) {
      try {
        const fullUserData = await User.findById(userId);
        if (fullUserData) {
          userData = fullUserData;
        }
      } catch (e) {
        // Fallback ke data dari req.user jika ada
        userData = req.user;
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

    // Hapus token cookie dari browser menggunakan helper function
    const clearedCookie = clearTokenCookie(res, req);

    // Log success di development
    if (process.env.NODE_ENV !== "production") {
    }

    // Kirim response sukses logout
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
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
    setTokenCookie(res, token, req);

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
      // Hapus token dari database jika gagal kirim email
      await PasswordReset.deleteByToken(resetToken);

      res.status(500).json({
        message: "Gagal mengirim email reset password",
      });
    }
  } catch (error) {
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
    res.status(500).json({
      message: "Terjadi kesalahan saat reset password",
      error: error.message,
    });
  }
};
