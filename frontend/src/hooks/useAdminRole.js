import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils";

/**
 * Hook untuk mengecek apakah user adalah admin unit
 * @returns {Object} { isAdmin, isLoading, userData }
 */
export const useAdminRole = () => {
  const userData = getSafeUserDataNoRedirect();

  return {
    isSuperAdmin: userData?.role === "superadmin",
    isAdmin:
      userData?.role === "admin" ||
      userData?.role === "admin_unit" ||
      userData?.role === "superadmin",
    isLoading: false,
    userData: userData,
    userUnit: userData?.unit,
  };
};

/**
 * Hook untuk mengecek permissions admin unit
 * @returns {Object} permissions object dengan berbagai cek
 */
export const useAdminPermissions = () => {
  const { isAdmin, userData } = useAdminRole();

  return {
    isSuperAdmin: userData?.role === "superadmin",
    canAssignSopCreator: isAdmin,
    canManageAssignments: isAdmin,
    canDeleteAssignments: isAdmin,
    canViewUnitUsers: isAdmin,
    isRegularUser: !isAdmin,
    userRole: userData?.role || "user",
  };
};

/**
 * Komponen wrapper untuk admin-only content
 * @param {ReactNode} children - Content yang hanya boleh dilihat admin
 * @param {ReactNode} fallback - Content alternative jika bukan admin
 */
export const AdminOnly = ({ children, fallback = null }) => {
  const { isAdmin } = useAdminRole();

  return isAdmin ? children : fallback;
};

/**
 * Komponen wrapper untuk user-only content (bukan admin)
 * @param {ReactNode} children - Content yang hanya boleh dilihat user biasa
 * @param {ReactNode} fallback - Content alternative jika admin
 */
export const UserOnly = ({ children, fallback = null }) => {
  const { isAdmin } = useAdminRole();

  return !isAdmin ? children : fallback;
};

export default {
  useAdminRole,
  useAdminPermissions,
  AdminOnly,
  UserOnly,
};
