import Navbar from "../components/Navbar";

const Home = () => {
  return (
    <>
      <Navbar />
      <main className="p-6 bg-gray-100 min-h-screen">
        {/* Tentang Kampus */}
        <section
          id="tentang"
          className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">
            Tentang Universitas Langlangbuana
          </h2>
          <p className="text-gray-700 leading-relaxed">
            Universitas Langlangbuana (UNLA) adalah perguruan tinggi swasta di
            Bandung yang berdedikasi dalam mencetak lulusan yang profesional,
            berintegritas, dan berdaya saing global. Didirikan dengan semangat
            nasionalisme dan pendidikan berkelanjutan, UNLA memiliki berbagai
            fakultas unggulan, fasilitas lengkap, serta dosen-dosen
            berpengalaman.
          </p>
        </section>

        {/* SOP */}
        <section id="sop" className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">
            Standar Operasional Prosedur (SOP)
          </h2>
          <p className="text-gray-700 leading-relaxed">
            SOP di Universitas Langlangbuana merupakan panduan baku yang harus
            diikuti oleh seluruh civitas akademika dalam menjalankan aktivitas
            kampus. SOP mencakup tata cara pelaksanaan kegiatan akademik dan
            non-akademik, sistem administrasi, layanan mahasiswa, hingga etika
            dalam interaksi antar individu di lingkungan kampus.
          </p>
        </section>
      </main>
    </>
  );
};

export default Home;
