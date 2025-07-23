import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ListDocsPage from "./pages/ListDocsPage";
import AddDocPage from "./pages/AddDocPage";
import EditDocPage from "./pages/EditDocPage";
import DetailDocPage from "./pages/DetailDocPage";
import Login from "./pages/authPage/Login";
import Register from "./pages/authPage/Register";
// import { getUserProfile } from "./services/api"; // Asumsikan ada endpoint untuk cek profil

// PrivateRoute component to protect routes
// const PrivateRoute = ({ children }) => {
//   const token = localStorage.getItem("accessToken");
//   const location = useLocation();
//   const [isRegistered, setIsRegistered] = useState(null);

//   useEffect(() => {
//     const checkRegistration = async () => {
//       if (token) {
//         try {
//           const profile = await getUserProfile(); // Endpoint untuk cek status registrasi
//           setIsRegistered(!!profile.registered); // Asumsikan ada field 'registered'
//         } catch (error) {
//           setIsRegistered(false); // Jika gagal, anggap belum terdaftar
//         }
//       } else {
//         setIsRegistered(false);
//       }
//     };
//     checkRegistration();
//   }, [token]);

//   if (isRegistered === null) return <div>Loading...</div>; // Loading state
//   return token && isRegistered ? (
//     children
//   ) : (
//     <Navigate to="/auth/login" state={{ from: location.pathname }} replace />
//   );
// };

const PrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user ? children : <Navigate to="/auth/login" />;
};

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Protected Routes */}
          <Route path="/" element={<HomePage />} />
          <Route
            path="/docs"
            element={
              <PrivateRoute>
                <ListDocsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs/detail/:id"
            element={
              <PrivateRoute>
                <DetailDocPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs/add"
            element={
              <PrivateRoute>
                <AddDocPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs/edit/:id"
            element={
              <PrivateRoute>
                <EditDocPage />
              </PrivateRoute>
            }
          />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
