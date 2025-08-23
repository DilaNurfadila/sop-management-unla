// Import React Router untuk navigasi
import { Link, useNavigate } from "react-router-dom";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";

/**
 * Komponen Navbar untuk navigasi utama di halaman publik
 * Menampilkan menu navigasi dengan conditional rendering berdasarkan status login
 */
const Navbar = () => {
  // Hook untuk navigasi programmatic
  const navigate = useNavigate();

  // Ambil data user dari sessionStorage untuk cek status login
  const user = getSafeUserDataNoRedirect();

  return (
    <nav className="bg-blue-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo/Brand - Link ke homepage */}
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          Universitas Langlangbuana
        </Link>

        {/* Menu navigasi */}
        <div className="space-x-4">
          {/* Menu Dokumen SOP - navigasi ke halaman published SOPs */}
          <a
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.preventDefault(); // Prevent default link behavior
              navigate("/sop"); // Navigate programmatically
            }}>
            Dokumen SOP
          </a>

          {/* Menu Tentang - navigasi ke halaman about */}
          <a
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/about");
            }}>
            Tentang
          </a>

          {/* Menu Kontak - navigasi ke halaman contact */}
          <a
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/contact");
            }}>
            Kontak
          </a>

          {/* Conditional rendering berdasarkan status login user */}
          {user ? (
            // Jika user sudah login, tampilkan link ke Dashboard
            <Link to="/dashboard" className="hover:underline">
              <span>Dashboard</span>
            </Link>
          ) : (
            // Jika user belum login, tampilkan link ke Login
            <Link to="/auth/login" className="hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
