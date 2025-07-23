const Auth = require("../models/Auth");
const { sendVerification } = require("../config/emailService");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const setTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Hanya dikirim melalui HTTPS di production
    sameSite: "strict", // Perlindungan terhadap CSRF
    maxAge: 3600000, // 1 jam dalam milidetik
    path: "/", // Cookie tersedia untuk semua path
  });
};

exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const access_code = generateOtp();
    const currentDate = new Date();
    const expired_at = new Date(currentDate.getTime() + 1 * 60 * 1000); // 1 minute from now
    const formattedExpiresAt = format(expired_at, "yyyy-MM-dd HH:mm:ss");

    const reqOtp = await Auth.createOtp(email, access_code, formattedExpiresAt);
    await sendVerification(email, access_code, formattedExpiresAt);
    res.status(201).json({ message: "OTP created successfully", reqOtp });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, access_code } = req.body;
    if (!access_code) {
      return res
        .status(400)
        .json({ message: "Email and access code are required" });
    }

    const otpRecord = await Auth.findByEmailVerify(email);
    if (!otpRecord) {
      return res.status(404).json({
        message: "OTP record not found or expired. please request again",
      });
    }

    if (otpRecord.access_code !== access_code) {
      return res.status(400).json({ message: "Invalid access code" });
    }

    if (new Date() > new Date(otpRecord.expired_at)) {
      await Auth.usedOtp(email);
      return res
        .status(400)
        .json({ message: "OTP has expired, please request again" });
    }

    // Check if user exists
    const user = await Auth.findByEmail(email);
    if (!user) {
      return res.status(303).json({
        message: "Please complete registration",
        redirect: "/auth/register",
        email, // Kirim email untuk registrasi
      });
    }

    if (!user.name) {
      const tempToken = generateToken({
        id: user.id,
        email: user.email,
        role: "unregistered",
      });
      setTokenCookie(res, tempToken);
      return res.status(200).json({ requiresRegistration: true });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    // const data = {
    //   email,
    // };

    // // Generate tokens
    // const accessToken = jwt.sign({ data }, process.env.JWT_SECRET, {
    //   expiresIn: "1d",
    // });

    // console.log(email);
    // console.log(user.email);
    // console.log(user);

    await Auth.usedOtp(email); // Tandai OTP sebagai digunakan
    // Simpan refresh token di database
    await Auth.updateToken(email, token);

    res.status(200).json({
      message: "Login successful",
      token, // Untuk API requests
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

exports.register = async (req, res) => {
  try {
    const { email, name, role, organization, position } = req.body;

    if (!name || !role || !organization || !position) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await Auth.findByEmail(email);
    if (user) {
      return res.status(400).json({ message: "User already registered" });
    }

    const token = generateToken(user);
    setTokenCookie(res, token);

    // Generate tokens
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

    console.log(token);

    // Simpan user dengan refresh token
    const register = await Auth.register(email, {
      name,
      role,
      organization,
      position,
      token,
    });

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

exports.logout = async (req, res) => {
  try {
    // Hapus refresh token dari database
    // await Auth.logout(req.user.data.email);

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};
