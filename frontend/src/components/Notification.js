import React, { useEffect } from "react";

const Notification = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getStyle = () => {
    if (type === "success") {
      return "bg-green-500";
    } else if (type === "error") {
      return "bg-red-500";
    }
    return "bg-blue-500";
  };

  return (
    <div
      className={`fixed top-5 right-5 p-4 rounded-md text-white z-50 shadow-md min-w-[250px] flex justify-between items-center ${getStyle()}`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="bg-transparent border-none text-white cursor-pointer text-base ml-2">
        ×
      </button>
    </div>
  );
};

export default Notification;
