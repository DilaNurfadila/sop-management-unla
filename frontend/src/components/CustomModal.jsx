import React from "react";
import {
  FiX,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
  FiTrash2,
  FiRotateCcw,
  FiArchive,
  FiLogOut,
} from "react-icons/fi";

/**
 * CustomModal - Komponen modal yang dapat digunakan kembali
 * Menggantikan window.confirm dan window.alert dengan UI yang lebih baik
 */
const CustomModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "info", // 'info', 'warning', 'danger', 'success', 'delete', 'restore'
  confirmText = "OK",
  cancelText = "Batal",
  showCancel = false,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  // Konfigurasi icon dan warna berdasarkan type
  const getTypeConfig = () => {
    switch (type) {
      case "warning":
        return {
          icon: <FiAlertTriangle className="text-4xl text-yellow-500" />,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          buttonColor: "bg-yellow-500 hover:bg-yellow-600",
        };
      case "danger":
        return {
          icon: <FiAlertTriangle className="text-4xl text-red-500" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          buttonColor: "bg-red-500 hover:bg-red-600",
        };
      case "success":
        return {
          icon: <FiCheckCircle className="text-4xl text-green-500" />,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          buttonColor: "bg-green-500 hover:bg-green-600",
        };
      case "delete":
        return {
          icon: <FiTrash2 className="text-4xl text-red-500" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          buttonColor: "bg-red-500 hover:bg-red-600",
        };
      case "archive":
        return {
          icon: <FiArchive className="text-4xl text-purple-600" />,
          bgColor: "bg-purple-50",
          borderColor: "border-purple-200",
          buttonColor: "bg-purple-600 hover:bg-purple-700",
        };
      case "logout":
        return {
          icon: <FiLogOut className="text-4xl text-red-600" />,
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          buttonColor: "bg-red-600 hover:bg-red-700",
        };
      case "restore":
        return {
          icon: <FiRotateCcw className="text-4xl text-blue-500" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          buttonColor: "bg-blue-500 hover:bg-blue-600",
        };
      default: // info
        return {
          icon: <FiInfo className="text-4xl text-blue-500" />,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          buttonColor: "bg-blue-500 hover:bg-blue-600",
        };
    }
  };

  const config = getTypeConfig();

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}>
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 mb-4`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">{config.icon}</div>
              <div className="flex-1">
                {typeof message === "string" ? (
                  <p className="text-gray-700 leading-relaxed">{message}</p>
                ) : (
                  message
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          {showCancel && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              disabled={isLoading}>
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white ${config.buttonColor} rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2`}
            disabled={isLoading}>
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {/* Tampilkan ikon logout di tombol jika type logout */}
            {type === "logout" && <FiLogOut className="mr-2" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
