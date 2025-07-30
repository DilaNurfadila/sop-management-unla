import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import ListDocsPage from "./pages/docPages/ListDocsPage";
import AddDocPage from "./pages/docPages/AddDocPage";
import DetailDocPage from "./pages/docPages/DetailDocPage";
import EditDocPage from "./pages/docPages/EditDocPage";
import Login from "./pages/authPage/Login";
import Register from "./pages/authPage/Register";
import MainLayout from "./components/MainLayout";
import Home from "./pages/Home";
import Contact from "./pages/Contact";
import About from "./pages/About";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const PrivateRoute = ({ children }) => {
    const user = JSON.parse(localStorage.getItem("user"));
    return user ? children : <Navigate to="/auth/login" />;
  };

  return (
    <Router>
      <Routes>
        {/* Public Routes (tanpa layout) */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Protected Routes (dengan layout) */}
        <Route
          element={
            <MainLayout
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          }>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/docs"
            element={
              <PrivateRoute>
                <ListDocsPage />
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
            path="/docs/detail/:id"
            element={
              <PrivateRoute>
                <DetailDocPage />
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
          <Route
            path="/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
