// import { useLocation } from "react-router-dom";

const Dashboard = () => {
  // const pathname = useLocation().pathname;
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">
        Selamat Datang di Aplikasi SOP UNLA, {user?.name}!
      </h1>
      <p className="mb-3 mt-4">
        SOP UNLA adalah aplikasi untuk mengelola dokumen Standar Operasional
        Prosedur (SOP) di Universitas Langlangbuana.
      </p>
    </div>
  );
};

export default Dashboard;
