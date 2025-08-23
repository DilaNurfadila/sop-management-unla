import React from "react";
import { Navigate } from "react-router-dom";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";

/**
 * Komponen ProtectedRoute untuk membatasi akses berdasarkan role
 * @param {Array} allowedRoles - Array role yang diizinkan mengakses route
 * @param {React.Component} children - Komponen yang akan dirender jika akses diizinkan
 * @param {string} redirectTo - Path untuk redirect jika akses ditolak
 */
const ProtectedRoute = ({
  allowedRoles = [],
  children,
  redirectTo = "/dashboard",
}) => {
  const userData = getSafeUserDataNoRedirect();

  // Jika user belum login, redirect ke login
  if (!userData) {
    return <Navigate to="/login" replace />;
  }

  // Jika tidak ada role restriction atau user memiliki role yang diizinkan
  if (allowedRoles.length === 0 || allowedRoles.includes(userData.role)) {
    return children;
  }

  // Jika akses ditolak, redirect ke halaman yang ditentukan
  return <Navigate to={redirectTo} replace />;
};

export default ProtectedRoute;
