// Import React hooks untuk lifecycle management
import React, { useEffect } from "react";
// Import icon untuk tombol close dari react-icons
import { FiX } from "react-icons/fi";

/**
 * Komponen Notification - Toast notification dengan auto-dismiss
 * Menampilkan notifikasi dengan berbagai tipe dan auto close setelah 3 detik
 * @param {string} message - Pesan yang akan ditampilkan dalam notifikasi
 * @param {string} type - Tipe notifikasi ('success', 'error', 'warning', 'info')
 * @param {Function} onClose - Callback function saat notifikasi ditutup
 */
const Notification = ({ message, type, onClose }) => {
  /**
   * Effect untuk auto-dismiss notifikasi setelah 3 detik
   */
  useEffect(() => {
    // Set timer untuk auto close notifikasi
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // 3 detik delay

    // Cleanup timer saat component unmount
    return () => clearTimeout(timer);
  }, [onClose]);

  /**
   * Mendapatkan style CSS berdasarkan tipe notifikasi
   * @returns {string} Class CSS untuk styling notifikasi
   */
  const getStyle = () => {
    // Base style yang berlaku untuk semua tipe notifikasi
    const baseStyle =
      "p-4 rounded-md text-white shadow-md min-w-[250px] flex justify-between items-center";

    // Switch case untuk menentukan warna background sesuai tipe
    switch (type) {
      case "success":
        return `${baseStyle} bg-green-500`; // Hijau untuk success
      case "error":
        return `${baseStyle} bg-red-500`; // Merah untuk error
      case "warning":
        return `${baseStyle} bg-yellow-500`; // Kuning untuk warning
      default:
        return `${baseStyle} bg-blue-500`; // Biru untuk info/default
    }
  };

  return (
    // Container fixed positioning di top-right corner
    <div className="fixed top-20 right-5 z-50 flex justify-center">
      <div className={`${getStyle()} animate-slide-down`}>
        {/* Text message dengan flex-1 untuk mengisi ruang */}
        <span className="flex-1">{message}</span>

        {/* Tombol close manual */}
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
