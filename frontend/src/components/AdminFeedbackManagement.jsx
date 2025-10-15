/**
 * Component: AdminFeedbackManagement
 *
 * Panel admin untuk moderasi dan membalas feedback pengguna.
 * Fitur: list, approve/reject, balas via email, statistik ringan.
 */
import React, { useState, useEffect } from "react";
import {
  FiStar,
  FiFileText,
  FiUser,
  FiCalendar,
  FiMessageCircle,
  FiCheck,
  FiX,
  FiMail,
  FiClock,
} from "react-icons/fi";
import { getAllFeedback, replyFeedback } from "../services/feedbackApi.jsx";
import { formatDateTime, formatRelativeTime } from "../utils/dateFormatter.jsx";
import { getSafeUserDataNoRedirect } from "../utils/cryptoUtils.jsx";

/**
 * Komponen untuk mengelola feedback oleh admin/admin_unit
 * Menampilkan feedback dengan opsi approve/reject dan response
 */
const AdminFeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [responseText, setResponseText] = useState("");
  const [showResponseModal, setShowResponseModal] = useState(false);

  // Get user data untuk cek apakah user yang login adalah admin
  const userData = getSafeUserDataNoRedirect();
  const currentUserId = userData?.id;

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const data = await getAllFeedback();
      setFeedbacks(data);
    } catch (err) {
      setError("Error fetching feedbacks: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return formatRelativeTime(dateString);
  };

  const formatFullDate = (dateString) => {
    return formatDateTime(dateString);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <FiStar
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <FiCheck className="h-3 w-3 mr-1" />
            Disetujui
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <FiX className="h-3 w-3 mr-1" />
            Ditolak
          </span>
        );
      case "replied":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <FiMail className="h-3 w-3 mr-1" />
            Sudah Dibalas
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <FiClock className="h-3 w-3 mr-1" />
            Menunggu
          </span>
        );
    }
  };

  const handleActionClick = (feedback) => {
    setSelectedFeedback(feedback);
    setResponseText("");
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!responseText.trim()) {
      alert("Harap berikan response sebelum melanjutkan");
      return;
    }

    try {
      await replyFeedback(selectedFeedback.id, { response: responseText });

      // Refresh data
      await fetchFeedbacks();

      // Close modal and reset state
      setShowResponseModal(false);
      setSelectedFeedback(null);
      setResponseText("");

      alert(
        "Balasan feedback berhasil dikirim dan email telah dikirim ke pengguna."
      );
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleCancelResponse = () => {
    setShowResponseModal(false);
    setSelectedFeedback(null);
    setResponseText("");
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FiMessageCircle className="mr-3" />
          Kelola Feedback
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-600">Memuat data feedback...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FiMessageCircle className="mr-3" />
          Kelola Feedback
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
          <FiMessageCircle className="mr-3" />
          Kelola Feedback
        </h3>

        {feedbacks.length === 0 ? (
          <div className="text-center py-8">
            <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Belum Ada Feedback
            </h4>
            <p className="text-gray-500">
              Belum ada feedback yang diberikan untuk SOP manapun
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <div
                key={feedback.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FiFileText className="h-4 w-4 text-blue-500" />
                      <h4 className="font-semibold text-gray-900">
                        {feedback.sop_title}
                      </h4>
                      <span className="text-sm text-gray-500">
                        ({feedback.sop_code})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <FiUser className="h-4 w-4" />
                        <span>{feedback.user_name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiMail className="h-4 w-4" />
                        <span>{feedback.user_email}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiCalendar className="h-4 w-4" />
                        <span>{formatDate(feedback.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex">{renderStars(feedback.rating)}</div>
                      <span className="text-sm text-gray-600">
                        ({feedback.rating}/5)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(feedback.status)}
                  </div>
                </div>

                {feedback.comment && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700">
                      "{feedback.comment}"
                    </p>
                  </div>
                )}

                {feedback.admin_response && (
                  <div className="bg-green-50 border-l-4 border-green-400 rounded p-3 mb-3">
                    <p className="text-sm text-gray-700 font-medium">
                      {feedback.responded_by === currentUserId
                        ? "Response Anda:"
                        : `Dibalas oleh ${
                            feedback.responded_by_name || "Admin"
                          }:`}
                    </p>
                    <p className="text-sm text-gray-700">
                      "{feedback.admin_response}"
                    </p>
                    {feedback.responded_by_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Dibalas pada: {formatFullDate(feedback.responded_at)}
                      </p>
                    )}
                  </div>
                )}

                {(!feedback.status || feedback.status === "pending") && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleActionClick(feedback)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                      <FiMail className="h-3 w-3 mr-1" />
                      Balas
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal untuk response */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Balas Feedback
              </h3>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Response/Balasan:
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Berikan balasan atau komentar atas feedback ini..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCancelResponse}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Batal
                </button>
                <button
                  onClick={handleSubmitResponse}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Kirim Balasan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminFeedbackManagement;
