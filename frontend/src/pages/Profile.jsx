// Import React
import React from "react";
// Import crypto utility functions
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";
// Import icon dari react-icons untuk UI profile
import { FiUser, FiMail, FiUsers, FiBriefcase, FiMapPin } from "react-icons/fi";

/**
 * Komponen Profile - Halaman profil user (view-only)
 * Menampilkan informasi user tanpa fitur editing
 */
const Profile = () => {
  // Ambil data user dari sessionStorage menggunakan fungsi helper
  const user = getSafeUserDataNoRedirect();

  // Fungsi untuk mengkonversi role ke format yang user-friendly
  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "admin_unit":
        return "Admin Unit";
      case "user":
        return "User";
      default:
        return role || "Role tidak tersedia";
    }
  };

  // Fungsi untuk mendapatkan warna badge role
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "admin_unit":
        return "bg-blue-100 text-blue-800";
      case "user":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-12">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                <FiUser size={48} className="text-gray-400" />
              </div>

              {/* User Info */}
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2">
                  {user?.name || "Unknown User"}
                </h1>
                <p className="text-blue-100 text-lg">
                  {user?.position || "Unknown Position"}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="bg-blue-500 bg-opacity-30 px-3 py-1 rounded-full text-sm">
                    {getRoleLabel(user?.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Section */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Informasi Profil
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiMail className="mr-2" />
                Email
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                {user?.email || "Email tidak tersedia"}
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiUser className="mr-2" />
                Nama Lengkap
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                {user?.name || "Nama tidak tersedia"}
              </div>
            </div>

            {/* Unit */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiUsers className="mr-2" />
                Unit Kerja
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                {user?.unit || "Unit tidak tersedia"}
              </div>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiBriefcase className="mr-2" />
                Jabatan
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                {user?.position || "Jabatan tidak tersedia"}
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FiMapPin className="mr-2" />
                Role Sistem
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(
                    user?.role
                  )}`}>
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
