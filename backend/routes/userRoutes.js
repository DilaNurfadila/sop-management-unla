const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const {
  requireSuperAdmin,
  requireAdminRole,
} = require("../middlewares/adminMiddleware");

router.get("/", userController.getAllUsers);
router.get("/:email", userController.getUserByEmail);
router.get("/:id", userController.getUserById);

// Routes yang memerlukan authentication
router.put(
  "/profile",
  authMiddleware.authenticate,
  userController.updateUserProfile
);
router.put(
  "/change-password",
  authMiddleware.authenticate,
  userController.changePassword
);

// ===== ADMIN MANAGEMENT ROUTES =====
// Routes khusus untuk admin management (hanya bisa diakses oleh admin)

// GET /api/users/admin/all - Mendapatkan semua users untuk admin
router.get(
  "/admin/all",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.getAllUsersForAdmin
);

// GET /api/users/admin/stats - Mendapatkan statistik users
router.get(
  "/admin/stats",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.getUserStats
);

// GET /api/users/admin/search - Mencari users
router.get(
  "/admin/search",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.searchUsers
);

// GET /api/users/admin/admins - Mendapatkan admin users untuk reviewer/approver
// Dibuka untuk admin, admin_unit, dan superadmin
router.get(
  "/admin/admins",
  authMiddleware.authenticate,
  requireAdminRole,
  userController.getAdminUsers
);

// POST /api/users/admin/create - Membuat pengguna baru (khusus superadmin)
router.post(
  "/admin/create",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.createUserByAdmin
);

// PUT /api/users/admin/:userId/role - Update role user (khusus admin)
router.put(
  "/admin/:userId/role",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.updateUserRole
);

// PUT /api/users/admin/:userId/deactivate - Nonaktifkan user (khusus admin)
router.put(
  "/admin/:userId/deactivate",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.deactivateUserByAdmin
);

// PUT /api/users/admin/:userId/activate - Aktifkan kembali user (khusus admin)
router.put(
  "/admin/:userId/activate",
  authMiddleware.authenticate,
  requireSuperAdmin,
  userController.activateUserByAdmin
);

module.exports = router;
