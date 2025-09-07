import React, { useState, useEffect, useCallback } from "react";
import revisionRequestApi from "../services/revisionRequestApi";
import { dateFormatter } from "../utils/dateFormatter";

const RevisionRequestHistory = ({ sopId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await revisionRequestApi.getRevisionRequestHistory(sopId);
      setHistory(data);
    } catch (error) {
      console.error("Error fetching revision request history:", error);
      setError("Gagal memuat riwayat permintaan revisi");
    } finally {
      setLoading(false);
    }
  }, [sopId]);

  useEffect(() => {
    if (sopId) {
      fetchHistory();
    }
  }, [sopId, fetchHistory]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Menunggu",
      },
      approved: {
        color: "bg-green-100 text-green-800",
        text: "Disetujui",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        text: "Ditolak",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">
          Riwayat Permintaan Revisi
        </h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">
          Riwayat Permintaan Revisi
        </h3>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4">Riwayat Permintaan Revisi</h3>

      {history.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Belum ada permintaan revisi untuk dokumen ini
        </p>
      ) : (
        <div className="space-y-4">
          {history.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {getStatusBadge(request.status)}
                    <span className="text-sm text-gray-500">
                      Diajukan pada {dateFormatter(request.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Pengaju:</strong> {request.requester_name}
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-1">
                  Alasan:
                </h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  {request.reason}
                </p>
              </div>

              {request.status !== "pending" && (
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">
                      <strong>Admin:</strong> {request.admin_name || "System"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {dateFormatter(request.updated_at)}
                    </span>
                  </div>

                  {request.admin_notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Catatan Admin:
                      </h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {request.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RevisionRequestHistory;
