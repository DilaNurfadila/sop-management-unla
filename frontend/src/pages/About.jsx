import Navbar from "../components/Navbar";

const About = () => {
  return (
    <>
      <Navbar />
      <main className="p-6 bg-gray-100 min-h-screen">
        <section className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4 text-blue-900">
            Tentang Kami
          </h2>
          <p className="text-gray-700 leading-relaxed mb-2">
            Universitas Langlangbuana (UNLA) adalah institusi pendidikan tinggi
            yang telah berdiri sejak tahun 1982 di Kota Bandung. Kami
            berkomitmen memberikan pendidikan berkualitas dengan pendekatan
            inovatif dan berorientasi pada dunia kerja.
          </p>
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
