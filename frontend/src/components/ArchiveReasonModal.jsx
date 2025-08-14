import React, { useState } from "react";
import { FiX, FiAlertCircle, FiEdit3 } from "react-icons/fi";

const ArchiveReasonModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [reason, setReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");

  const presetReasons = [
    "Pembaruan kebijakan perusahaan",
    "Revisi prosedur standar",
    "Perbaikan kesalahan dokumen",
    "Penambahan informasi baru",
    "Perubahan regulasi pemerintah",
    "Peningkatan efisiensi proses",
    "Koreksi data dan format",
    "Update standar keamanan",
    "Sinkronisasi dengan sistem baru",
    "Lainnya (tulis manual)",
  ];

  const handlePresetSelect = (presetReason) => {
    setSelectedPreset(presetReason);
    if (presetReason !== "Lainnya (tulis manual)") {
      setReason(presetReason);
    } else {
      setReason("");
    }
  };

  const handleSubmit = () => {
    if (!reason.trim()) {
      alert("Silakan isi alasan penggantian file");
      return;
    }
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    setSelectedPreset("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FiEdit3 className="text-blue-600 text-xl" />
            <h2 className="text-xl font-bold text-gray-900">
              Alasan Penggantian File
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            disabled={isLoading}>
            <FiX size={24} />
          </button>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <FiAlertCircle className="text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informasi Penting:</p>
              <p>
                File lama akan disimpan di arsip dengan alasan yang Anda
                berikan. Alasan ini akan membantu dalam penelusuran riwayat
                perubahan dokumen.
              </p>
            </div>
          </div>
        </div>

        {/* Preset Reasons */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Pilih Alasan (Opsional):
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {presetReasons.map((presetReason, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="preset"
                  value={presetReason}
                  checked={selectedPreset === presetReason}
                  onChange={() => handlePresetSelect(presetReason)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700">{presetReason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Custom Reason Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alasan Penggantian File: *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tuliskan alasan mengapa file SOP ini perlu diganti..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimal 10 karakter. Alasan ini akan disimpan dalam riwayat arsip.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            disabled={isLoading}>
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim() || reason.trim().length < 10}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Memproses...
              </>
            ) : (
              "Lanjutkan Update"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveReasonModal;
