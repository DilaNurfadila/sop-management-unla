// Import icon dari react-icons untuk UI settings
import { FiSave, FiLock, FiUser, FiMail, FiBell } from "react-icons/fi";

/**
 * Komponen Settings - Halaman pengaturan akun user
 * Menampilkan form untuk edit profile, security, dan notifikasi
 */
const Settings = () => {
  return (
    <div className="p-6">
      {/* Page title */}
      <h1 className="text-2xl font-bold mb-6">Pengaturan Akun</h1>

      {/* Section Informasi Profil */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        {/* Header section */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium flex items-center">
            <FiUser className="mr-2 text-blue-600" /> Informasi Profil
          </h2>
        </div>

        {/* Content section */}
        <div className="p-6">
          {/* Grid layout untuk form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Nama Lengkap */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                defaultValue="John Doe"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Input Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                defaultValue="john@example.com"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section Keamanan */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        {/* Header section */}
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium flex items-center">
            <FiLock className="mr-2 text-blue-600" /> Keamanan
          </h2>
        </div>

        {/* Content section */}
        <div className="p-6">
          {/* Input Password Saat Ini */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium flex items-center">
            <FiBell className="mr-2 text-blue-600" /> Notifikasi
          </h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Email Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive email notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Push Notifications</h3>
              <p className="text-sm text-gray-500">
                Receive push notifications
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center">
          <FiSave className="mr-2" /> Simpan Perubahan
        </button>
      </div>
    </div>
  );
};

export default Settings;
