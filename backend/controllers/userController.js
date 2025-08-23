const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
// Import crypto-js untuk konsistensi dengan authController
const cryptojs = require("crypto-js");

// Encryption key dari environment atau default
const ENCRYPTION_KEY =
  process.env.KEY ||
  "884dbd6d8899676352ed96b0bf6554a07a3f0f617da702c0afdc85ff51ee686d";

// Helper function untuk encrypt data (konsisten dengan authController)
const safeEncrypt = (data) => {
  if (!data || data === null || data === undefined) {
    return null;
  }

  try {
    const iv = cryptojs.lib.WordArray.random(16);

    const dataString = data.toString();
    const encrypted = cryptojs.AES.encrypt(dataString, ENCRYPTION_KEY, {
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
 * Helper function untuk logging aktivitas user management
 * @param {Object} user - Data user yang melakukan aksi
 * @param {string} action - Aksi yang dilakukan (CREATE, UPDATE, DELETE)
 * @param {string} description - Deskripsi aktivitas
 * @param {Object} req - Request object untuk mendapatkan IP dan user agent
 * @param {Object} targetData - Data target (opsional)
 */
const logUserActivity = async (
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
      "USER",
      descriptionStr,
      req,
      targetData?.id || null,
      targetData ? "user" : null
    );
  } catch (error) {
    console.error("Error logging user activity:", error.message);
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAllUsers();

    // Log aktivitas melihat daftar users (hanya untuk admin)
    if (req.user && req.user.role === "admin") {
      await logUserActivity(
        req.user,
        "VIEW",
        `${req.user.name} mengakses daftar semua pengguna (${users.length} pengguna)`,
        req
      );
    }

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Log aktivitas melihat detail user
    if (req.user) {
      await logUserActivity(
        req.user,
        "VIEW",
        `${req.user.name} mengakses detail pengguna: ${user.name} (${user.email})`,
        req,
        { id: user.id }
      );
    }

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  try {
    const user = await User.findByEmail(req.params.email);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Other exports (createDoc, updateDoc, etc.) remain the same
// exports.createDoc = async (req, res) => {
//   try {
//     const newDoc = await SopDoc.createSopDoc(req.body);
//     res
//       .status(201)
//       .json({ message: "SOP document created successfully", newDoc });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateDoc = async (req, res) => {
//   try {
//     const updatedDoc = await SopDoc.updateSopDoc(req.params.id, req.body);
//     res
//       .status(200)
//       .json({ message: "SOP document updated successfully", updatedDoc });
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.deleteDoc = async (req, res) => {
//   try {
//     await SopDoc.delete(req.params.id);
//     res.status(200).json({ message: "SOP document deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

/**
 * Update user profile
 * Mengupdate data profil user yang sedang login
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Dari auth middleware
    const { name, email, position, unit } = req.body;

    // Validasi input
    if (!name || !email || !position || !unit) {
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

    // Cek apakah email sudah digunakan user lain
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({
        message: "Email sudah digunakan oleh user lain",
      });
    }

    // Data yang akan disimpan ke database (tidak dienkripsi)
    const userData = {
      name,
      email,
      position,
      unit,
    };

    // Update user di database
    await User.updateUser(userId, userData);

    // Log aktivitas update profil
    await logUserActivity(
      req.user,
      "UPDATE",
      `${req.user.name} mengupdate profil: ${name} (${email})`,
      req,
      {
        id: userId,
      }
    );

    // Encrypt data untuk response (jika diperlukan)
    const encryptedData = {
      name: safeEncrypt(name),
      email: safeEncrypt(email),
      position: safeEncrypt(position),
      unit: safeEncrypt(unit),
    };

    res.status(200).json({
      message: "Profil berhasil diperbarui",
      user: {
        id: userId,
        name: encryptedData.name,
        email: encryptedData.email,
        position: encryptedData.position,
        unit: encryptedData.unit,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat memperbarui profil",
    });
  }
};

/**
 * Change user password
 * Mengubah password user yang sedang login
 */
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // Dari auth middleware
    const { currentPassword, newPassword } = req.body;

    // Validasi input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Password saat ini dan password baru wajib diisi",
      });
    }

    // Validasi panjang password baru
    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password baru minimal 6 karakter",
      });
    }

    // Ambil data user dari database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User tidak ditemukan",
      });
    }

    // Verifikasi password saat ini
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: "Password saat ini tidak benar",
      });
    }

    // Hash password baru
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password di database
    await User.updatePassword(userId, hashedNewPassword);

    // Log aktivitas perubahan password
    await logUserActivity(
      req.user,
      "UPDATE",
      `${req.user.name} mengubah password akun`,
      req,
      { id: userId }
    );

    res.status(200).json({
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      message: "Terjadi kesalahan saat mengubah password",
    });
  }
};

// ===== ADMIN MANAGEMENT FUNCTIONS =====

/**
 * Function untuk mendapatkan daftar semua pengguna (khusus admin)
 */
exports.getAllUsersForAdmin = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    if (req.user.role !== "admin") {
      console.log("Access denied - user role is not admin:", req.user.role);
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
    }

    const users = await User.findAllUsers();

    // Return data user tanpa password
    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position || "",
      unit: user.unit || "",
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    res.status(200).json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Error in getAllUsersForAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data pengguna",
    });
  }
};

/**
 * Function untuk mendapatkan statistik pengguna (khusus admin)
 */
exports.getUserStats = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    if (req.user.role !== "admin") {
      console.log("Access denied - user role is not admin:", req.user.role);
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
    }

    const users = await User.findAllUsers();

    // Hitung statistik berdasarkan role
    const stats = {
      total: users.length,
      admin: users.filter((user) => user.role === "admin").length,
      admin_unit: users.filter((user) => user.role === "admin_unit").length,
      user: users.filter((user) => user.role === "user").length,
    };

    res.status(200).json({
      success: true,
      stats: stats,
    });
  } catch (error) {
    console.error("Error in getUserStats:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil statistik pengguna",
    });
  }
};

/**
 * Function untuk menghapus pengguna (khusus admin)
 */
exports.deleteUserByAdmin = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
    }

    const { userId } = req.params;

    // Cek apakah user yang akan dihapus ada
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    // Jangan biarkan admin menghapus dirinya sendiri
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menghapus akun Anda sendiri",
      });
    }

    // Pengecualian: Jangan biarkan menghapus pengguna admin
    if (userToDelete.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Akun admin tidak dapat dihapus untuk keamanan sistem",
      });
    }

    // Hapus user dari database
    await User.deleteUser(userId);

    // Log aktivitas penghapusan user
    const adminName = req.user?.name || req.user?.email || "Admin";
    await logUserActivity(
      req.user,
      "DELETE",
      `Admin (${adminName}) menghapus pengguna: ${userToDelete.name} (${userToDelete.email})`,
      req,
      { id: userToDelete.id }
    );

    res.status(200).json({
      success: true,
      message: "Pengguna berhasil dihapus",
    });
  } catch (error) {
    console.error("Error in deleteUserByAdmin:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menghapus pengguna",
    });
  }
};

/**
 * Function untuk mengubah role pengguna (khusus admin)
 */
exports.updateUserRole = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Validasi role yang diizinkan
    const allowedRoles = ["admin", "admin_unit", "user"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role tidak valid",
      });
    }

    // Cek apakah user yang akan diupdate ada
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    // Jangan biarkan admin mengubah role dirinya sendiri
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat mengubah role Anda sendiri",
      });
    }

    // Pengecualian: Jangan biarkan mengubah role pengguna admin
    if (userToUpdate.role === "admin") {
      return res.status(400).json({
        success: false,
        message: "Role admin tidak dapat diubah untuk keamanan sistem",
      });
    }

    // Update role user
    await User.updateUserRole(userId, role);

    // Log aktivitas perubahan role
    const adminName = req.user?.name || req.user?.email || "Admin";
    await logUserActivity(
      req.user,
      "UPDATE",
      `Admin (${adminName}) mengubah role pengguna ${userToUpdate.name} dari ${userToUpdate.role} ke ${role}`,
      req,
      {
        id: userToUpdate.id,
      }
    );

    res.status(200).json({
      success: true,
      message: "Role pengguna berhasil diubah",
    });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengubah role pengguna",
    });
  }
};

/**
 * Function untuk mencari pengguna (khusus admin)
 */
exports.searchUsers = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
    }

    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query pencarian tidak boleh kosong",
      });
    }

    const users = await User.searchUsers(query);

    // Return data user tanpa password
    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position || "",
      unit: user.unit || "",
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    res.status(200).json({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mencari pengguna",
    });
  }
};
