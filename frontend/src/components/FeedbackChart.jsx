import { FiStar, FiBarChart } from "react-icons/fi";

const FeedbackChart = ({ feedbackData }) => {
  if (!feedbackData || feedbackData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FiBarChart className="mr-3" />
          Distribusi Rating
        </h3>
        <div className="text-center py-8">
          <p className="text-gray-500">Belum ada data rating</p>
        </div>
      </div>
    );
  }

  // Calculate rating distribution
  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
    const count = feedbackData.filter(
      (feedback) => feedback.rating === rating
    ).length;
    const percentage =
      feedbackData.length > 0 ? (count / feedbackData.length) * 100 : 0;
    return {
      rating,
      count,
      percentage: percentage.toFixed(1),
    };
  });

  const maxCount = Math.max(...ratingDistribution.map((item) => item.count));

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

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
        <FiBarChart className="mr-3" />
        Distribusi Rating
      </h3>

      <div className="space-y-4">
        {ratingDistribution.reverse().map((item) => (
          <div key={item.rating} className="flex items-center">
            {/* Rating Stars */}
            <div className="flex items-center w-24">
              {renderStars(item.rating)}
            </div>

            {/* Progress Bar */}
            <div className="flex-1 mx-4">
              <div className="bg-gray-200 rounded-full h-6 relative">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-6 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                  style={{
                    width:
                      maxCount > 0 ? `${(item.count / maxCount) * 100}%` : "0%",
                  }}>
                  {item.count > 0 && (
                    <span className="text-xs font-medium text-white">
                      {item.count}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Percentage */}
            <div className="w-16 text-right">
              <span className="text-sm font-medium text-gray-600">
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Total: <span className="font-medium">{feedbackData.length}</span>{" "}
            feedback
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeedbackChart;
