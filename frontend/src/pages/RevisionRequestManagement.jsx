import React, { useState, useEffect, useCallback } from "react";
import revisionRequestApi from "../services/revisionRequestApi";
import useAdminRole from "../hooks/useAdminRole";
import { dateFormatter } from "../utils/dateFormatter";

const RevisionRequestManagement = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingRequestId, setProcessingRequestId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(""); // 'approve' or 'reject'

  const { isAdmin, loading: adminLoading } = useAdminRole();

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await revisionRequestApi.getPendingRevisionRequests();
      setPendingRequests(data);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setError("Gagal memuat daftar permintaan revisi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchPendingRequests();
    }
  }, [adminLoading, isAdmin, fetchPendingRequests]);

  const handleActionRequest = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNotes("");
    setShowModal(true);
  };

  const processRequest = async () => {
    if (!selectedRequest) return;

    try {
      setProcessingRequestId(selectedRequest.id);

      if (actionType === "approve") {
        await revisionRequestApi.approveRevisionRequest(
          selectedRequest.id,
          adminNotes
        );
      } else {
        await revisionRequestApi.rejectRevisionRequest(
          selectedRequest.id,
          adminNotes
        );
      }

      // Refresh the list
      await fetchPendingRequests();

      // Close modal
      setShowModal(false);
      setSelectedRequest(null);
      setAdminNotes("");

      alert(
        `Permintaan revisi berhasil ${
          actionType === "approve" ? "disetujui" : "ditolak"
        }!`
      );
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      alert(
        `Gagal ${
          actionType === "approve" ? "menyetujui" : "menolak"
        } permintaan revisi`
      );
    } finally {
      setProcessingRequestId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
    setAdminNotes("");
    setActionType("");
  };

  if (adminLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">
          Anda tidak memiliki akses untuk halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Kelola Permintaan Revisi
        </h1>
        <p className="text-gray-600">
          Kelola permintaan revisi dokumen SOP yang masuk
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button
            onClick={fetchPendingRequests}
            className="ml-2 underline hover:no-underline">
            Coba lagi
          </button>
        </div>
      ) : pendingRequests.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            Tidak ada permintaan revisi yang menunggu persetujuan.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {request.sop_title}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Pengaju:</strong> {request.requester_name}
                    </p>
                    <p>
                      <strong>Unit:</strong> {request.unit_name}
                    </p>
                    <p>
                      <strong>Tanggal Pengajuan:</strong>{" "}
                      {dateFormatter(request.created_at)}
                    </p>
                  </div>
                </div>
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                  Menunggu
                </span>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Alasan Permintaan:
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {request.reason}
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleActionRequest(request, "reject")}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-50"
                  disabled={processingRequestId === request.id}>
                  Tolak
                </button>
                <button
                  onClick={() => handleActionRequest(request, "approve")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  disabled={processingRequestId === request.id}>
                  {processingRequestId === request.id
                    ? "Memproses..."
                    : "Setujui"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {actionType === "approve" ? "Setujui" : "Tolak"} Permintaan
                Revisi
              </h2>
              <p className="text-sm text-gray-600">
                <strong>Dokumen:</strong> {selectedRequest.sop_title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Pengaju:</strong> {selectedRequest.requester_name}
              </p>
            </div>

            <div className="mb-4">
              <label
                htmlFor="adminNotes"
                className="block text-sm font-medium text-gray-700 mb-2">
                Catatan Admin{" "}
                {actionType === "reject" ? "(wajib)" : "(opsional)"}
              </label>
              <textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder={`Berikan catatan untuk ${
                  actionType === "approve" ? "persetujuan" : "penolakan"
                } ini...`}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required={actionType === "reject"}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={processingRequestId === selectedRequest.id}>
                Batal
              </button>
              <button
                onClick={processRequest}
                className={`px-4 py-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={
                  processingRequestId === selectedRequest.id ||
                  (actionType === "reject" && !adminNotes.trim())
                }>
                {processingRequestId === selectedRequest.id
                  ? "Memproses..."
                  : actionType === "approve"
                  ? "Setujui"
                  : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevisionRequestManagement;
