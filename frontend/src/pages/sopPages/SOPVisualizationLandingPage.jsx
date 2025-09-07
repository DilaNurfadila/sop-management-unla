import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getSopDocumentById } from "../../services/flowchartApi";

function SOPVisualizationLandingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sop, setSop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSopData = async () => {
      setLoading(true);
      try {
        const response = await getSopDocumentById(id);
        setSop(response);
      } catch (error) {
        console.error("Error fetching SOP data:", error);
        setSop(null);
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchSopData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat Data SOP...</p>
        </div>
      </div>
    );
  }

  if (!sop) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-6">Dokumen SOP dengan ID "{id}" tidak ditemukan.</p>
          <button
            onClick={() => navigate("/docs")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            Kembali ke Daftar Dokumen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Visualisasi untuk SOP: {sop.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{sop.title}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors duration-200">
            ← Kembali
          </button>
        </div>

        {/* SOP Details and Actions Section */}
        <div className="bg-white p-8 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* SOP Info */}
          <div className="space-y-4 border-r md:border-r-2 border-gray-200 pr-8">
            <h3 className="text-xl font-semibold text-gray-800">
              Detail Dokumen
            </h3>
            <div className="space-y-2 text-gray-600 text-sm">
              <p>
                <strong>Kode SOP:</strong> {sop.sop_code || "Belum dipublikasi"}
              </p>
              <p>
                <strong>Versi:</strong> {sop.version}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    sop.status === "Published"
                      ? "bg-blue-100 text-blue-800"
                      : sop.status === "Archived"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                  {sop.status}
                </span>
              </p>
              <p>
                <strong>Dibuat pada:</strong>{" "}
                {new Date(sop.created_at).toLocaleDateString("id-ID")}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pl-8">
            <h3 className="text-xl font-semibold text-gray-800">Pilih Aksi</h3>
            <div className="flex flex-col space-y-4">
              <Link
                to={`/sopvis/${sop.id}/flowchart`}
                className="bg-blue-600 text-white py-3 px-6 text-center text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200">
                👁️ Lihat Flowchart
              </Link>
              <Link
                to={`/sopvis/${sop.id}/manage`}
                className="bg-green-600 text-white py-3 px-6 text-center text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200">
                🛠️ Kelola Visualisasi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SOPVisualizationLandingPage;
