// Import komponen Navbar untuk navigasi
import Navbar from "../components/Navbar";

/**
 * Komponen About - Halaman informasi tentang Universitas Langlangbuana
 * Menampilkan sejarah, visi misi, dan informasi umum tentang UNLA
 */
const About = () => {
  return (
    <>
      {/* Navbar untuk navigasi utama */}
      <Navbar />

      {/* Main content dengan background gray dan min height full screen */}
      <main className="p-6 bg-gray-100 min-h-screen">
        {/* Section informasi tentang universitas */}
        <section className="bg-white rounded-xl shadow-md p-6">
          {/* Heading utama halaman */}
          <h2 className="text-2xl font-bold mb-4 text-blue-900">
            Tentang Kami
          </h2>

          {/* Paragraf pertama - sejarah dan komitmen */}
          <p className="text-gray-700 leading-relaxed mb-2">
            Universitas Langlangbuana (UNLA) adalah institusi pendidikan tinggi
            yang telah berdiri sejak tahun 1982 di Kota Bandung. Kami
            berkomitmen memberikan pendidikan berkualitas dengan pendekatan
            inovatif dan berorientasi pada dunia kerja.
          </p>

          {/* Paragraf kedua - program studi dan tenaga pengajar */}
          <p className="text-gray-700 leading-relaxed">
            Kami memiliki berbagai program studi unggulan dan tenaga pengajar
            profesional untuk membekali mahasiswa dengan pengetahuan,
            keterampilan, dan nilai-nilai etika yang kuat.
          </p>
        </section>
      </main>
    </>
  );
};

export default About;
