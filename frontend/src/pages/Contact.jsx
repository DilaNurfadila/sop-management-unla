// Import React library
import React from "react";
// Import komponen Navbar untuk navigasi
import Navbar from "../components/Navbar";

/**
 * Komponen Contact - Halaman informasi kontak Universitas Langlangbuana
 * Menampilkan alamat, email, telepon, dan jam operasional
 */
const Contact = () => {
  return (
    <>
      {/* Navbar untuk navigasi utama */}
      <Navbar />

      {/* Main content dengan background gray dan min height full screen */}
      <main className="p-6 bg-gray-100 min-h-screen">
        {/* Section informasi kontak */}
        <section className="bg-white rounded-xl shadow-md p-6">
          {/* Heading utama halaman */}
          <h2 className="text-2xl font-bold mb-4 text-blue-900">Kontak Kami</h2>

          {/* Text pengantar */}
          <p className="text-gray-700 mb-4">
            Silakan hubungi kami melalui informasi di bawah ini:
          </p>

          {/* List informasi kontak dalam format unordered list */}
          <ul className="text-gray-700 space-y-2">
            {/* Item alamat kantor */}
            <li>
              <strong>Alamat:</strong> Jl. Karapitan No.116, Bandung, Jawa Barat
            </li>
            {/* Item email resmi */}
            <li>
              <strong>Email:</strong> info@unla.ac.id
            </li>
            {/* Item nomor telepon */}
            <li>
              <strong>Telepon:</strong> (022) 4268913
            </li>
            {/* Item jam operasional */}
            <li>
              <strong>Jam Operasional:</strong> Senin - Jumat, 08.00 - 16.00 WIB
            </li>
          </ul>
        </section>
      </main>
    </>
  );
};

export default Contact;
