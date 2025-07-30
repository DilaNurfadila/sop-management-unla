import { useState } from "react";
import crypto from "crypto-js";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiLock,
  FiCamera,
  FiSave,
} from "react-icons/fi";

const Profile = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const secretKey = crypto.enc.Hex.parse(import.meta.env.VITE_SECRET_KEY);
  const encryptedEmail = user?.email; // misalnya dari response API
  const [ivHex, cipherText] = encryptedEmail.split(":");
  const iv = crypto.enc.Hex.parse(ivHex);
  const bytes = crypto.AES.decrypt(cipherText, secretKey, { iv });
  const emailDecrypted = bytes.toString(crypto.enc.Utf8);

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "Unknown User",
    email: emailDecrypted || "Unknown Email",
    organization: user?.organization || "Unknown Organization",
    position: user?.position || "Unknown Position",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEditMode(false);
    // Tambahkan logika penyimpanan ke API di sini
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profil Saya</h1>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Header Profil */}
        <div className="bg-blue-600 p-6 text-white">
          <div className="flex flex-col md:flex-row items-center">
            <div className="relative mb-4 md:mb-0">
              <div className="w-24 h-24 rounded-full bg-blue-400 flex items-center justify-center text-3xl font-bold">
                JD
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
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
