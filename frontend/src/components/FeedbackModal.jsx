import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiStar, FiMessageCircle, FiUser, FiMail } from 'react-icons/fi';
import { createFeedback, getFeedbackBySopId } from '../services/feedbackApi';

const FeedbackModal = ({ isOpen, onClose, sop }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    user_email: '',
    rating: 0,
    comment: ''
  });
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'feedback'

  const fetchFeedback = useCallback(async () => {
    if (!sop?.id) return;
    
    try {
      setLoading(true);
      const response = await getFeedbackBySopId(sop.id);
      setFeedback(response.feedback || []);
      setStats(response.stats || {});
    } catch (err) {
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  }, [sop?.id]);

  useEffect(() => {
    if (isOpen && sop) {
      fetchFeedback();
    }
  }, [isOpen, sop, fetchFeedback]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.user_name || !formData.user_email || !formData.rating) {
      setError('Nama, email, dan rating wajib diisi');
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating harus antara 1-5');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const feedbackData = {
        ...formData,
        sop_id: sop.id
      };

      await createFeedback(feedbackData);
      setSuccess('Feedback berhasil dikirim! Terima kasih atas masukan Anda.');
      
      // Reset form
      setFormData({
        user_name: '',
        user_email: '',
        rating: 0,
        comment: ''
      });
      
      // Refresh feedback data
      await fetchFeedback();
      
      // Switch to feedback tab to show new feedback
      setActiveTab('feedback');
    } catch (err) {
      setError(err.message || 'Gagal mengirim feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      user_name: '',
      user_email: '',
      rating: 0,
      comment: ''
    });
    setError('');
    setSuccess('');
    setActiveTab('form');
    onClose();
  };

  const renderStars = (rating, interactive = false) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={`w-6 h-6 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
        onClick={interactive ? () => handleRatingClick(index + 1) : undefined}
      />
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Feedback SOP
            </h2>
            <p className="text-gray-600 mt-1">
              {sop?.sop_code} - {sop?.sop_title}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex">
                {renderStars(Math.round(stats.average_rating || 0))}
              </div>
              <span className="text-lg font-semibold">
                {stats.average_rating || '0.0'}
              </span>
            </div>
            <div className="text-gray-600">
              {stats.total_feedback || 0} feedback
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-3 px-6 font-medium ${
              activeTab === 'form'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}>
            Berikan Feedback
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`flex-1 py-3 px-6 font-medium ${
              activeTab === 'feedback'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}>
            Lihat Feedback ({feedback.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-700">{success}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiUser className="inline w-4 h-4 mr-1" />
                    Nama *
                  </label>
                  <input
                    type="text"
                    name="user_name"
                    value={formData.user_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan nama Anda"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FiMail className="inline w-4 h-4 mr-1" />
                    Email *
                  </label>
                  <input
                    type="email"
                    name="user_email"
                    value={formData.user_email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Masukkan email Anda"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex gap-1">
                  {renderStars(formData.rating, true)}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Klik bintang untuk memberikan rating
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiMessageCircle className="inline w-4 h-4 mr-1" />
                  Komentar (Opsional)
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Berikan komentar atau saran untuk SOP ini..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                  {submitting ? 'Mengirim...' : 'Kirim Feedback'}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Batal
                </button>
              </div>
            </form>
          )}

          {activeTab === 'feedback' && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">Memuat feedback...</div>
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-8">
                  <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Belum Ada Feedback
                  </h3>
                  <p className="text-gray-500">
                    Jadilah yang pertama memberikan feedback untuk SOP ini
                  </p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.user_name}
                        </h4>
                        <p className="text-sm text-gray-600">{item.user_email}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-1 mb-1">
                          {renderStars(item.rating)}
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(item.created_at)}
                        </p>
                      </div>
                    </div>
                    {item.comment && (
                      <p className="text-gray-700 bg-gray-50 rounded-lg p-3">
                        {item.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
