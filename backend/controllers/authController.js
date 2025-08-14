// Import model Auth untuk operasi database authentication
const Auth = require("../models/Auth");
// Import service email untuk verifikasi
const { sendVerification } = require("../config/emailService");
// Import crypto untuk generate random number
const crypto = require("crypto");
// Import crypto-js untuk enkripsi/dekripsi
const cryptojs = require("crypto-js");
// Import jsonwebtoken untuk JWT operations
const jwt = require("jsonwebtoken");
// Import date-fns untuk format tanggal
const { format } = require("date-fns");
// Load environment variables
require("dotenv").config();

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

    // Validasi apakah OTP disediakan
    if (!access_code) {
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

    // Enkripsi email untuk keamanan data
    const iv = cryptojs.lib.WordArray.random(16); // Generate random IV
    const key = cryptojs.enc.Hex.parse(process.env.KEY); // Parse encryption key
    const emailEncrypted = cryptojs.AES.encrypt(user.email, key, {
      // Enkripsi email
      mode: cryptojs.mode.CBC,
      iv: iv, // IV harus konsisten untuk dekripsi
    }).toString();

    // Gabungkan IV dan encrypted email dengan separator ':'
    const emailEncryptedSave =
      iv.toString(cryptojs.enc.Hex) + ":" + emailEncrypted;

    // Tandai OTP sebagai sudah digunakan
    await Auth.usedOtp(email);

    // Simpan/update refresh token di database
    await Auth.updateToken(email, token);

    // Kirim response sukses dengan token dan data user
    res.status(200).json({
      message: "Login successful",
      token, // Token untuk API requests
      user: {
        id: user.id,
        email: emailEncryptedSave, // Email yang sudah dienkripsi
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
    const { email, name, role, organization, position } = req.body;

    // Validasi field yang wajib diisi
    if (!name || !role || !organization || !position) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Cek apakah user sudah terdaftar
    const user = await Auth.findByEmail(email);
    if (user) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Generate JWT token untuk user baru
    const token = generateToken(user);
    setTokenCookie(res, token);

    // Catatan: Kode yang di-comment bisa digunakan untuk implementasi alternatif
    // const data = {
    //   email,
    //   name,
    //   role,
    //   organization,
    //   position,
    // };
    // const accessToken = jwt.sign({ data }, process.env.JWT_SECRET, {
    //   expiresIn: "1d",
    // });

    // Simpan data registrasi user ke database dengan token
    const register = await Auth.register(email, {
      name,
      role,
      organization,
      position,
      token,
    });

    // Kirim response sukses registrasi
    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Controller untuk logout user
 * @param {Object} req - Request object dari Express
 * @param {Object} res - Response object dari Express
 */
exports.logout = async (req, res) => {
  try {
    // Catatan: Bisa ditambahkan untuk hapus refresh token dari database
    // await Auth.logout(req.user.data.email);

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
