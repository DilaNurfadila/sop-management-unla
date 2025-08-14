import { FiDownload, FiRefreshCw, FiBarChart, FiFilter } from "react-icons/fi";

const FeedbackQuickActions = ({ onRefresh, totalFeedback }) => {
  const handleExportFeedback = () => {
    // Placeholder for export functionality
    alert("Fitur export akan segera tersedia");
  };

  const handleFilterFeedback = () => {
    // Placeholder for filter functionality
    alert("Fitur filter akan segera tersedia");
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-md p-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold mb-2">Manajemen Feedback</h3>
          <p className="text-blue-100">
            Kelola dan analisis feedback dari {totalFeedback} pengguna
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="bg-blue-900 bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            title="Refresh Data">
            <FiRefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Filter Button */}
          <button
            onClick={handleFilterFeedback}
            className="bg-blue-900 bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            title="Filter Feedback">
            <FiFilter className="h-4 w-4" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Analytics Button */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="bg-blue-900 bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            title="Lihat Analytics">
            <FiBarChart className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportFeedback}
            className="bg-blue-900 bg-opacity-20 hover:bg-opacity-30 p-3 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm"
            title="Export Data">
            <FiDownload className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedbackQuickActions;
