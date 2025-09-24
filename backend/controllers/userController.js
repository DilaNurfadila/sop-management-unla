const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");
const Unit = require("../models/Unit");
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
    // Tidak throw error agar tidak mengganggu flow utama
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAllUsers();

    // Log aktivitas melihat daftar users (hanya untuk admin atau admin_unit)
    if (
      req.user &&
      (req.user.role === "admin" || req.user.role === "admin_unit")
    ) {
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
    res.status(500).json({
      message: "Terjadi kesalahan saat mengubah password",
    });
  }
};

// ===== ADMIN MANAGEMENT FUNCTIONS =====

/**
 * Membuat pengguna baru (khusus superadmin)
 */
exports.createUserByAdmin = async (req, res) => {
  try {
    // Hanya superadmin yang boleh membuat pengguna baru
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
      });
    }

    const { name, email, password, position, unit, role } = req.body;

    // Validasi input dasar
    if (!name || !email || !password || !position || !unit) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi",
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Format email tidak valid" });
    }

    // Validasi panjang password
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimal 6 karakter",
      });
    }

    // Validasi role yang diizinkan
    const allowedRoles = ["admin", "admin_unit", "user"]; // superadmin tidak boleh dibuat via endpoint ini
    const finalRole = allowedRoles.includes(role) ? role : "user";

    // Cek apakah email sudah digunakan
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email sudah digunakan oleh pengguna lain",
      });
    }

    // Validasi unit ada
    const unitRecord = await Unit.findById(unit);
    if (!unitRecord) {
      return res
        .status(400)
        .json({ success: false, message: "Unit tidak ditemukan" });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Buat user
    const created = await User.createUser({
      name,
      email,
      password: hashedPassword,
      position,
      unit,
      role: finalRole,
      email_verified: false,
    });

    // Log aktivitas pembuatan user
    const adminName = req.user?.name || req.user?.email || "Admin";
    await logUserActivity(
      req.user,
      "CREATE",
      `Admin (${adminName}) membuat pengguna baru: ${name} (${email}) dengan role ${finalRole}`,
      req,
      { id: created.id }
    );

    return res.status(201).json({
      success: true,
      message: "Pengguna berhasil dibuat",
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        position: created.position,
        unit: created.unit,
        role: created.role,
        created_at: new Date(),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Gagal membuat pengguna",
    });
  }
};

/**
 * Function untuk mendapatkan daftar semua pengguna (khusus admin)
 */
exports.getAllUsersForAdmin = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    // Catatan: data lengkap semua user hanya untuk superadmin mulai sekarang
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
      });
    }

    const users = await User.findAllUsers();

    // Kecualikan akun superadmin (termasuk disabled:superadmin) dari daftar
    const visibleUsers = users.filter(
      (u) =>
        u.role !== "superadmin" &&
        !(
          typeof u.role === "string" && u.role.startsWith("disabled:superadmin")
        )
    );

    // Return data user tanpa password
    const safeUsers = visibleUsers.map((user) => ({
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
    // Cek apakah user yang request adalah superadmin
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
      });
    }

    const users = await User.findAllUsers();

    // Filter keluar admin dan superadmin dari perhitungan statistik total
    const validUsers = users.filter(
      (user) =>
        user.role !== "admin" &&
        user.role !== "superadmin" &&
        !(
          typeof user.role === "string" &&
          user.role.startsWith("disabled:superadmin")
        )
    );

    // Hitung jumlah admin aktif (tidak termasuk disabled:admin dan superadmin)
    const adminCount = users.filter((user) => user.role === "admin").length;

    // Hitung statistik berdasarkan role (aktif saja)
    const adminUnitCount = validUsers.filter(
      (user) => user.role === "admin_unit"
    ).length;
    const normalUserCount = validUsers.filter(
      (user) => user.role === "user"
    ).length;

    const stats = {
      // Total aktif = admin + admin_unit + user (superadmin tidak dihitung)
      total: adminCount + adminUnitCount + normalUserCount,
      admin: adminCount,
      admin_unit: adminUnitCount,
      user: normalUserCount,
    };

    res.status(200).json({
      success: true,
      stats: stats,
    });
  } catch (error) {
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
    // Cek apakah user yang request adalah superadmin
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
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

    // Pengecualian: Jangan biarkan menghapus pengguna admin atau admin_unit
    if (userToDelete.role === "admin" || userToDelete.role === "admin_unit") {
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
    // Hanya superadmin yang boleh mengubah role
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
      });
    }

    const { userId } = req.params;
    const { role } = req.body;

    // Validasi role yang diizinkan
    const allowedRoles = ["admin", "admin_unit", "user"]; // tidak boleh set ke superadmin via endpoint ini
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

    // Jangan biarkan superadmin mengubah role dirinya sendiri
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat mengubah role Anda sendiri",
      });
    }

    // Tidak boleh mengubah role superadmin melalui endpoint ini
    if (userToUpdate.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Role superadmin tidak dapat diubah melalui endpoint ini",
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
    res.status(500).json({
      success: false,
      message: "Gagal mengubah role pengguna",
    });
  }
};

/**
 * Nonaktifkan pengguna (admin-only)
 * Melakukan soft-deactivate dengan mengubah role menjadi 'disabled'.
 */
exports.deactivateUserByAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
      });
    }

    const { userId } = req.params;

    // Cek apakah user yang akan dinonaktifkan ada
    const userToDeactivate = await User.findById(userId);
    if (!userToDeactivate) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    // Jangan biarkan admin menonaktifkan dirinya sendiri
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menonaktifkan akun Anda sendiri",
      });
    }

    // Jangan izinkan menonaktifkan admin penuh
    if (userToDeactivate.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Akun superadmin tidak dapat dinonaktifkan demi keamanan.",
      });
    }

    // Jika sudah disabled, tidak perlu update
    if (
      typeof userToDeactivate.role === "string" &&
      userToDeactivate.role.startsWith("disabled")
    ) {
      return res.status(200).json({
        success: true,
        message: "Akun sudah dalam status nonaktif.",
      });
    }

    // Lakukan soft-deactivate dengan set role ke 'disabled:<role_asal>'
    const previousRole = userToDeactivate.role;
    const disabledRole = `disabled:${previousRole}`;
    await User.updateUserRole(userId, disabledRole);

    // Log aktivitas
    const adminName = req.user?.name || req.user?.email || "Admin";
    await logUserActivity(
      req.user,
      "UPDATE",
      `Admin (${adminName}) menonaktifkan akun: ${userToDeactivate.name} (${userToDeactivate.email})`,
      req,
      { id: userToDeactivate.id }
    );

    res.status(200).json({
      success: true,
      message: "Pengguna berhasil dinonaktifkan",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal menonaktifkan pengguna",
    });
  }
};

/**
 * Aktifkan kembali pengguna (admin-only)
 * Mengubah role dari 'disabled' kembali ke 'user'.
 */
exports.activateUserByAdmin = async (req, res) => {
  try {
    if (req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message:
          "Akses ditolak. Hanya superadmin yang dapat mengakses fitur ini.",
      });
    }

    const { userId } = req.params;

    const userToActivate = await User.findById(userId);
    if (!userToActivate) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    // Tidak boleh mengubah akun admin via endpoint ini
    if (userToActivate.role === "superadmin") {
      return res.status(400).json({
        success: false,
        message: "Akun superadmin tidak dapat diubah melalui endpoint ini.",
      });
    }

    // Hanya proses jika memang disabled
    if (
      !(
        typeof userToActivate.role === "string" &&
        userToActivate.role.startsWith("disabled")
      )
    ) {
      return res.status(200).json({
        success: true,
        message: "Akun sudah dalam status aktif.",
      });
    }

    // Ambil role asal setelah prefix 'disabled:'
    const parts = userToActivate.role.split(":");
    const originalRole = parts[1] || "user";
    // Cegah promosi ke admin melalui endpoint ini
    const restoredRole = originalRole === "superadmin" ? "user" : originalRole;
    await User.updateUserRole(userId, restoredRole);

    const adminName = req.user?.name || req.user?.email || "Admin";
    await logUserActivity(
      req.user,
      "UPDATE",
      `Admin (${adminName}) mengaktifkan kembali akun: ${userToActivate.name} (${userToActivate.email})`,
      req,
      { id: userToActivate.id }
    );

    res.status(200).json({
      success: true,
      message: "Pengguna berhasil diaktifkan kembali",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Gagal mengaktifkan pengguna",
    });
  }
};

/**
 * Function untuk mencari pengguna (khusus admin)
 */
exports.searchUsers = async (req, res) => {
  try {
    // Cek apakah user yang request adalah admin (bukan admin_unit)
    if (req.user.role !== "superadmin") {
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

    // Kecualikan superadmin (termasuk disabled:superadmin) dari hasil pencarian
    const visibleUsers = users.filter(
      (u) =>
        u.role !== "superadmin" &&
        !(
          typeof u.role === "string" && u.role.startsWith("disabled:superadmin")
        )
    );

    // Return data user tanpa password
    const safeUsers = visibleUsers.map((user) => ({
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
    res.status(500).json({
      success: false,
      message: "Gagal mencari pengguna",
    });
  }
};

/**
 * Function untuk mendapatkan daftar admin users untuk reviewer/approver assignment
 */
exports.getAdminUsers = async (req, res) => {
  try {
    const currentUserRole = req.user.role;
    const currentUserUnit = req.user.unit;

    let users;

    if (currentUserRole === "superadmin") {
      // Superadmin dapat melihat semua admin variations
      users = await User.findUsersByRole(["superadmin", "admin", "admin_unit"]);
    } else if (currentUserRole === "admin") {
      // Admin penuh dapat memilih admin_unit dan admin dari semua unit
      users = await User.findUsersByRole(["admin", "admin_unit"]);
    } else if (currentUserRole === "admin_unit") {
      // Admin unit hanya dapat memilih admin_unit dari unit yang sama
      const allAdminUnits = await User.findUsersByRole(["admin_unit"]);
      users = allAdminUnits.filter((user) => user.unit === currentUserUnit);
    } else {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses fitur ini.",
      });
    }

    // Return data user tanpa password dengan informasi unit
    const safeUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      position: user.position || "",
      unit: user.unit || "",
      unit_name: user.unit_name || "",
      role: user.role,
    }));

    res.status(200).json({
      success: true,
      data: safeUsers,
      message: `Found ${safeUsers.length} admin users`,
    });
  } catch (error) {
    console.error("❌ Error fetching admin users:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil data admin users",
    });
  }
};
