// Import StrictMode dari React untuk development mode checking
import { StrictMode } from "react";
// Import createRoot dari React DOM untuk React 18+ rendering
import { createRoot } from "react-dom/client";
// Import global CSS styles
import "./index.css";
// Import root App component
import App from "./App.jsx";

// Create root element dan render aplikasi
// Menggunakan React 18+ createRoot API untuk performa yang lebih baik
createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* StrictMode membantu identify potential problems dalam development */}
    <App />
  </StrictMode>
);
