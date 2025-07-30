import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyle = () => {
    const baseStyle =
      "p-4 rounded-md text-white shadow-md min-w-[250px] flex justify-between items-center";

    switch (type) {
      case "success":
        return `${baseStyle} bg-green-500`;
      case "error":
        return `${baseStyle} bg-red-500`;
      case "warning":
        return `${baseStyle} bg-yellow-500`;
      default:
        return `${baseStyle} bg-blue-500`;
    }
  };

  return (
    <div className="fixed top-20 right-5 z-50 flex justify-center">
      <div className={`${getStyle()} animate-slide-down`}>
        <span className="flex-1">{message}</span>
        <button
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 rounded-full hover:bg-white/20 transition-colors">
          <FiX size={18} />
        </button>
      </div>
    </div>
  );
};

export default Notification;
