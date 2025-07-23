import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getDocs, deleteDoc, publishDoc, unpublishDoc } from "../services/api";
import Notification from "../components/Notification";
import { dateFormatter } from "../utils/dateFormatter";

const ListDocsPage = () => {
  const [docs, setDocs] = useState([]);
  const [notification, setNotification] = useState(null);
  const [loadingStates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDocs();
      if (Array.isArray(data)) {
        setDocs(data);
      } else {
        setDocs([]);
        console.warn("Unexpected data structure, expected array:", data);
      }
    } catch (error) {
      setError(error.message || "Gagal memuat data. Silakan coba lagi.");
      setDocs([]);
      console.error("Error fetching docs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();

    if (location.state?.message) {
      showNotification(location.state.message, location.state.type);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [fetchDocs, location, navigate]);

  const handleEdit = (id) => {
    navigate(`/docs/edit/${id}`);
  };

  const handleDetail = (id) => {
    navigate(`/docs/detail/${id}`);
  };

  const handleDelete = async (id) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin menghapus dokumen SOP ini?"
    );
    if (isConfirmed) {
      try {
        await deleteDoc(id);
        showNotification("Dokumen SOP berhasil dihapus", "success");
        fetchDocs();
      } catch (error) {
        showNotification("Gagal menghapus dokumen SOP", "error");
      }
    }
  };

  const handlePublish = async (id) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin publikasi dokumen SOP ini?"
    );
    if (isConfirmed) {
      try {
        setDocs(
          docs.map((doc) =>
            doc.id === id ? { ...doc, status: "published" } : doc
          )
        );

        const response = await publishDoc(id);
        showNotification(
          response.message || "Dokumen SOP berhasil dipublikasi",
          "success"
        );

        setDocs(
          docs.map((doc) =>
            doc.id === id ? { ...doc, ...response.updatedDoc } : doc
          )
        );
      } catch (error) {
        setDocs(
          docs.map((doc) => (doc.id === id ? { ...doc, status: "draft" } : doc))
        );
        showNotification(
          error.message || "Dokumen SOP gagal dipublikasi",
          "error"
        );
      }
    }
  };

  const handleUnpublish = async (id) => {
    const isConfirmed = window.confirm(
      "Apakah Anda yakin ingin tidak publikasi dokumen SOP ini?"
    );
    if (isConfirmed) {
      try {
        setDocs(
          docs.map((doc) => (doc.id === id ? { ...doc, status: "draft" } : doc))
        );

        const response = await unpublishDoc(id);
        showNotification(
          response.message || "Dokumen berhasil dikembalikan ke draft",
          "success"
        );

        setDocs(
          docs.map((doc) =>
            doc.id === id ? { ...doc, ...response.updatedDoc } : doc
          )
        );
      } catch (error) {
        setDocs(
          docs.map((doc) =>
            doc.id === id ? { ...doc, status: "published" } : doc
          )
        );
        showNotification(
          error.message || "Gagal mengembalikan ke draft",
          "error"
        );
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Daftar Dokumen SOP</h2>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
        />
      )}

      <p>
        Selamat datang, {user?.name} ({user?.role})
      </p>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Kode SOP</th>
              <th className="border border-gray-300 px-4 py-2">Judul SOP</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
              <th className="border border-gray-300 px-4 py-2">Organisasi</th>
              <th className="border border-gray-300 px-4 py-2">
                Tanggal Pembuatan
              </th>
              <th className="border border-gray-300 px-4 py-2">Versi SOP</th>
              <th className="border border-gray-300 px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  Tidak ada dokumen tersedia.
                </td>
              </tr>
            ) : (
              docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">
                    {doc.sop_code}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {doc.sop_title}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        doc.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                      {doc.status === "published" ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {doc.organization}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {dateFormatter(doc.sop_created)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {doc.sop_version}
                  </td>
                  <td className="flex border border-gray-300 px-4 py-2 justify-evenly">
                    <button
                      onClick={() =>
                        doc.status === "draft"
                          ? handlePublish(doc.id)
                          : handleUnpublish(doc.id)
                      }
                      disabled={loadingStates[doc.id]}
                      className={`px-3 py-1 rounded mr-2 text-white ${
                        loadingStates[doc.id]
                          ? "opacity-50 cursor-not-allowed"
                          : doc.status === "published"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-green-500 hover:bg-green-600"
                      }`}>
                      {loadingStates[doc.id] ? (
                        <span className="flex items-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Processing...
                        </span>
                      ) : doc.status === "draft" ? (
                        "Publish"
                      ) : (
                        "Unpublish"
                      )}
                    </button>
                    <button
                      onClick={() => handleDetail(doc.id)}
                      className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1 rounded mr-2">
                      Detail
                    </button>
                    <button
                      onClick={() => handleEdit(doc.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded mr-2">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListDocsPage;
