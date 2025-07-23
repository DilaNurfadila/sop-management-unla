import React from "react";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="text-center py-10">
      <h1 className="text-3xl font-bold mb-4">
        Selamat Datang di Aplikasi SOP UNLA
      </h1>
      <p className="mb-3">
        SOP UNLA adalah aplikasi untuk mengelola dokumen Standar Operasional
        Prosedur (SOP) di Universitas Langlangbuana.
      </p>
      <p className="mb-6">
        Silakan navigasi menggunakan menu di atas untuk mengelola data.
      </p>
      <Link
        to="/docs"
        className="inline-block px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 no-underline">
        Lihat Daftar Dokumen SOP
      </Link>
    </div>
  );
};

export default HomePage;
