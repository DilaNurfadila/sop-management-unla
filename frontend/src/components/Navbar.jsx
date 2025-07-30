import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <nav className="bg-blue-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          Universitas Langlangbuana
        </Link>
        <div className="space-x-4">
          <a
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/about");
            }}>
            Tentang
          </a>
          <a
            className="cursor-pointer hover:underline"
            onClick={(e) => {
              e.preventDefault();
              navigate("/contact");
            }}>
            Kontak
          </a>
          {user ? (
            <Link to="/dashboard" className="hover:underline">
              <span>Dashboard</span>
            </Link>
          ) : (
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
