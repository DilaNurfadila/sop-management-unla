const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

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
  userController.getAllUsersForAdmin
);

// GET /api/users/admin/stats - Mendapatkan statistik users
router.get(
  "/admin/stats",
  authMiddleware.authenticate,
  userController.getUserStats
);

// GET /api/users/admin/search - Mencari users
router.get(
  "/admin/search",
  authMiddleware.authenticate,
  userController.searchUsers
);

// DELETE /api/users/admin/:userId - Hapus user (khusus admin)
router.delete(
  "/admin/:userId",
  authMiddleware.authenticate,
  userController.deleteUserByAdmin
);

// PUT /api/users/admin/:userId/role - Update role user (khusus admin)
router.put(
  "/admin/:userId/role",
  authMiddleware.authenticate,
  userController.updateUserRole
);

module.exports = router;
