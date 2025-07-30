import React from "react";
import Navbar from "../components/Navbar";

const Contact = () => {
  return (
    <>
      <Navbar />
      <main className="p-6 bg-gray-100 min-h-screen">
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">Kontak Kami</h2>
          <p className="text-gray-700 mb-4">
            Silakan hubungi kami melalui informasi di bawah ini:
          </p>
          <ul className="text-gray-700 space-y-2">
            <li>
              <strong>Alamat:</strong> Jl. Karapitan No.116, Bandung, Jawa Barat
            </li>
            <li>
              <strong>Email:</strong> info@unla.ac.id
            </li>
            <li>
              <strong>Telepon:</strong> (022) 4268913
            </li>
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
