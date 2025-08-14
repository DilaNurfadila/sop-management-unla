import React, { useState, useEffect, useCallback } from 'react';
import { FiStar, FiMessageCircle, FiUser, FiFileText, FiTrendingUp, FiClock } from 'react-icons/fi';
import { getAllFeedback } from '../services/feedbackApi';
import FeedbackChart from './FeedbackChart';
import FeedbackQuickActions from './FeedbackQuickActions';

const FeedbackDashboard = () => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    topRatedSOP: null,
    recentFeedback: []
  });

  const fetchAllFeedback = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAllFeedback();
      setFeedbackData(data);
      calculateStats(data);
    } catch (err) {
      setError('Gagal memuat data feedback');
      console.error('Error fetching feedback:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFeedback();
  }, [fetchAllFeedback]);

  const calculateStats = (feedbackData) => {
    if (!feedbackData || feedbackData.length === 0) {
      setStats({
        totalFeedback: 0,
        averageRating: 0,
        topRatedSOP: null,
        recentFeedback: []
      });
      return;
    }

    // Total feedback
    const totalFeedback = feedbackData.length;

    // Average rating
    const totalRating = feedbackData.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = (totalRating / totalFeedback).toFixed(1);

    // Group by SOP
    const sopRatings = {};
    feedbackData.forEach(feedback => {
      if (!sopRatings[feedback.sop_id]) {
        sopRatings[feedback.sop_id] = {
          sop_id: feedback.sop_id,
          sop_code: feedback.sop_code,
          sop_title: feedback.sop_title,
          ratings: [],
          totalRating: 0,
          count: 0
        };
      }
      sopRatings[feedback.sop_id].ratings.push(feedback.rating);
      sopRatings[feedback.sop_id].totalRating += feedback.rating;
      sopRatings[feedback.sop_id].count += 1;
    });

    // Find top rated SOP
    let topRatedSOP = null;
    let highestAverage = 0;
    
    Object.values(sopRatings).forEach(sop => {
      const average = sop.totalRating / sop.count;
      if (average > highestAverage) {
        highestAverage = average;
        topRatedSOP = {
          ...sop,
          averageRating: average.toFixed(1)
        };
      }
    });

    // Recent feedback (last 5)
    const recentFeedback = feedbackData
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    setStats({
      totalFeedback,
      averageRating,
      topRatedSOP,
      recentFeedback
    });
  };

  const renderStars = (rating) => {
    return [...Array(5)].map((_, index) => (
      <FiStar
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiMessageCircle className="mr-3" />
          Feedback SOP
        </h2>
        <div className="text-center py-8">
          <div className="text-gray-600">Memuat data feedback...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <FiMessageCircle className="mr-3" />
          Feedback SOP
        </h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <FeedbackQuickActions 
        onRefresh={fetchAllFeedback} 
        totalFeedback={stats.totalFeedback} 
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Feedback */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-lg">
              <FiMessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Feedback</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.totalFeedback}</p>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <FiStar className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Rating Rata-rata</h3>
              <div className="flex items-center">
                <p className="text-2xl font-bold text-gray-900 mr-2">{stats.averageRating}</p>
                <div className="flex">
                  {renderStars(Math.round(stats.averageRating))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Rated SOP */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">SOP Terbaik</h3>
              {stats.topRatedSOP ? (
                <div>
                  <p className="text-sm font-bold text-gray-900">{stats.topRatedSOP.sop_code}</p>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-600 mr-1">{stats.topRatedSOP.averageRating}</span>
                    <div className="flex">
                      {renderStars(Math.round(stats.topRatedSOP.averageRating))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Belum ada data</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Chart */}
        <FeedbackChart feedbackData={feedbackData} />
        
        {/* Recent Feedback List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <FiClock className="mr-3" />
            Feedback Terbaru
          </h3>
          
          {stats.recentFeedback.length === 0 ? (
            <div className="text-center py-8">
              <FiMessageCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Feedback</h4>
              <p className="text-gray-500">Belum ada feedback yang diberikan untuk SOP</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {stats.recentFeedback.map((feedback) => (
                <div key={feedback.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <FiFileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900 text-sm">
                          {feedback.sop_code} - {feedback.sop_title}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <FiUser className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-600">
                          {feedback.user_name} ({feedback.user_email})
                        </span>
                      </div>
                      
                      {feedback.comment && (
                        <p className="text-sm text-gray-700 bg-gray-100 rounded p-2 mt-2">
                          "{feedback.comment}"
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      <div className="flex gap-1 mb-1">
                        {renderStars(feedback.rating)}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDate(feedback.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;
