// Import React hooks untuk state management dan side effects
import React, { useState, useEffect } from "react";
// Import icons dari react-icons untuk UI
import {
  FiStar,
  FiFileText,
  FiUser,
  FiCalendar,
  FiMessageCircle,
} from "react-icons/fi";
// Import API service untuk fetch feedback data
import { getAllFeedback } from "../services/feedbackApi";

/**
 * Komponen untuk menampilkan daftar feedback SOP yang dikelompokkan per dokumen
 * Menunjukkan statistik rating dan detail feedback untuk setiap SOP
 */
const SOPFeedbackList = () => {
  // State untuk menyimpan data feedback yang sudah dikelompokkan per SOP
  const [sopFeedbacks, setSopFeedbacks] = useState([]);
  // State untuk loading indicator
  const [loading, setLoading] = useState(true);
  // State untuk error handling
  const [error, setError] = useState("");

  // useEffect untuk load data saat komponen pertama kali di-mount
  useEffect(() => {
    fetchAndGroupFeedback();
  }, []);

  /**
   * Function untuk fetch dan mengelompokkan feedback berdasarkan SOP
   * Menghitung rata-rata rating dan mengurutkan feedback
   */
  const fetchAndGroupFeedback = async () => {
    try {
      setLoading(true);
      // Fetch semua feedback dari API
      const feedbackData = await getAllFeedback();

      // Kelompokkan feedback berdasarkan sop_id
      const grouped = {};
      feedbackData.forEach((feedback) => {
        if (!grouped[feedback.sop_id]) {
          // Inisialisasi object untuk SOP baru
          grouped[feedback.sop_id] = {
            sop_id: feedback.sop_id,
            sop_code: feedback.sop_code,
            sop_title: feedback.sop_title,
            feedbacks: [],
            totalRating: 0,
            averageRating: 0,
            feedbackCount: 0,
          };
        }
        // Tambahkan feedback ke SOP yang sesuai dan hitung total rating
        grouped[feedback.sop_id].feedbacks.push(feedback);
        grouped[feedback.sop_id].totalRating += feedback.rating;
        grouped[feedback.sop_id].feedbackCount++;
      });

      // Hitung rata-rata rating untuk setiap SOP
      Object.values(grouped).forEach((sop) => {
        sop.averageRating = (sop.totalRating / sop.feedbackCount).toFixed(1);
        // Urutkan feedback berdasarkan tanggal terbaru
        sop.feedbacks.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      });

      // Urutkan SOP berdasarkan rating tertinggi
      const sortedSOPs = Object.values(grouped).sort(
        (a, b) => b.averageRating - a.averageRating
      );
      setSopFeedbacks(sortedSOPs);
    } catch (err) {
      setError("Gagal memuat data feedback");
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={`w-4 h-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FiFileText className="mr-3" />
          Feedback per SOP
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
          <FiFileText className="mr-3" />
          Feedback per SOP
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <FiFileText className="mr-3" />
        Feedback per SOP
      </h3>

      {sopFeedbacks.length === 0 ? (
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
        <div className="space-y-6">
          {sopFeedbacks.map((sop) => (
            <div
              key={sop.sop_id}
              className="border border-gray-200 rounded-lg p-6">
              {/* SOP Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                    {sop.sop_code} - {sop.sop_title}
                  </h4>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {renderStars(Math.round(sop.averageRating))}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {sop.averageRating}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {sop.feedbackCount} feedback
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback List */}
              <div className="space-y-4">
                {sop.feedbacks.slice(0, 3).map((feedback) => (
                  <div key={feedback.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FiUser className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {feedback.user_name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({feedback.user_email})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {renderStars(feedback.rating)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <FiCalendar className="h-3 w-3" />
                          {formatDate(feedback.created_at)}
                        </div>
                      </div>
                    </div>
                    {feedback.comment && (
                      <p className="text-sm text-gray-700 bg-white rounded p-3 mt-2 border-l-4 border-blue-400">
                        "{feedback.comment}"
                      </p>
                    )}
                  </div>
                ))}

                {sop.feedbacks.length > 3 && (
                  <div className="text-center pt-2">
                    <span className="text-sm text-gray-500">
                      ... dan {sop.feedbacks.length - 3} feedback lainnya
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SOPFeedbackList;
