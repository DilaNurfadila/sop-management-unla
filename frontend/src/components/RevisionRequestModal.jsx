import React, { useState } from "react";
import revisionRequestApi from "../services/revisionRequestApi";

const RevisionRequestModal = ({
  isOpen,
  onClose,
  sopId,
  sopTitle,
  onRequestSubmitted,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      setError("Alasan revisi harus diisi");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await revisionRequestApi.submitRevisionRequest(sopId, reason.trim());

      // Clear form
      setReason("");

      // Notify parent component
      if (onRequestSubmitted) {
        onRequestSubmitted();
      }

      // Close modal
      onClose();

      alert("Permintaan revisi berhasil diajukan!");
    } catch (error) {
      console.error("Error submitting revision request:", error);
      setError(
        error.response?.data?.message ||
          "Gagal mengajukan permintaan revisi. Silakan coba lagi."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Ajukan Permintaan Revisi
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}>
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            <strong>Dokumen SOP:</strong> {sopTitle}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-2">
              Alasan Permintaan Revisi <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan mengapa dokumen SOP ini perlu direvisi..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              disabled={isSubmitting}
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}>
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !reason.trim()}>
              {isSubmitting ? "Mengirim..." : "Ajukan Permintaan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevisionRequestModal;
