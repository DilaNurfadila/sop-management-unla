// Import React hooks untuk state management
import { useState } from "react";
// Import crypto-js untuk dekripsi email
import crypto from "crypto-js";
// Import icon dari react-icons untuk UI profile
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiCamera,
  FiSave,
} from "react-icons/fi";

/**
 * Komponen Profile - Halaman profil user dengan edit functionality
 * Menampilkan informasi user dan memungkinkan editing data
 */
const Profile = () => {
  // Ambil data user dari localStorage
  const user = JSON.parse(localStorage.getItem("user"));

  // Setup untuk dekripsi email yang ter-encrypt
  const secretKey = crypto.enc.Hex.parse(import.meta.env.VITE_SECRET_KEY);
  const encryptedEmail = user?.email; // Email terenkripsi dari API response
  // Split IV dan cipher text dari encrypted email
  const [ivHex, cipherText] = encryptedEmail.split(":");
  // Parse IV dari hex string
  const iv = crypto.enc.Hex.parse(ivHex);
  // Decrypt email menggunakan AES
  const bytes = crypto.AES.decrypt(cipherText, secretKey, { iv });
  // Convert bytes hasil dekripsi ke string UTF-8
  const emailDecrypted = bytes.toString(crypto.enc.Utf8);

  // State untuk mode edit profile
  const [editMode, setEditMode] = useState(false);
  // State untuk form data dengan data default dari user
  const [formData, setFormData] = useState({
    name: user?.name || "Unknown User",
    email: emailDecrypted || "Unknown Email",
    organization: user?.organization || "Unknown Organization",
    position: user?.position || "Unknown Position",
  });

  /**
   * Handle perubahan input form
   * @param {Event} e - Event dari input field
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Update form data dengan spread operator
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle submit form profile
   * @param {Event} e - Event dari form submit
   */
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission
    setEditMode(false); // Keluar dari edit mode
    // TODO: Tambahkan logika penyimpanan ke API di sini
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-6">Profil Saya</h1>

      {/* Card container untuk profile */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header Profil dengan background biru */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex flex-col md:flex-row items-center">
            {/* Avatar section dengan relative positioning untuk edit button */}
            <div className="relative mb-4 md:mb-0">
              {/* Avatar circle dengan inisial user */}
              <div className="w-24 h-24 rounded-full bg-blue-400 flex items-center justify-center text-3xl font-bold">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                  : "JD"}
              </div>
              {editMode && (
                <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md text-blue-600 hover:bg-gray-100">
                  <FiCamera size={16} />
                </button>
              )}
            </div>
            <div className="md:ml-6 text-center md:text-left">
              <h2 className="text-xl font-semibold">{formData.name}</h2>
              <p className="text-blue-100">{formData.email}</p>
              <p className="text-blue-100 mt-1">Bergabung sejak Jan 2023</p>
            </div>
          </div>
        </div>

        {/* Form Profil */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiUser className="mr-2" /> Nama Lengkap
                </label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {formData.name}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiMail className="mr-2" /> Email
                </label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {formData.email}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiPhone className="mr-2" /> Nomor Telepon
                </label>
                {editMode ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {formData.phone}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiMapPin className="mr-2" /> Alamat
                </label>
                {editMode ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="px-4 py-2 bg-gray-50 rounded-lg">
                    {formData.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-medium flex items-center">
              <FiLock className="mr-2" /> Keamanan Akun
            </h3>
            <div className="mt-4 space-y-4">
              {editMode ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Saat Ini
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="text-blue-600 hover:text-blue-800 font-medium">
                  Ubah Password
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex justify-end space-x-3">
            {editMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                  <FiSave className="mr-2" /> Simpan Perubahan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
                Edit Profil
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
