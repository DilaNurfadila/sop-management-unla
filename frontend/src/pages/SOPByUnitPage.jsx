import { useState, useEffect, useCallback } from "react";
import { getSopByUserUnit, getSopByUnit } from "../services/api";
import { getAllUnits } from "../services/unitApi";
import { updateSopDocument } from "../services/flowchartApi";
import MainLayout from "../components/MainLayout";

/**
 * Komponen untuk menampilkan daftar SOP berdasarkan unit kerja
 * Mendukung dua mode:
 * 1. SOP berdasarkan unit kerja pengguna yang login
 * 2. SOP berdasarkan unit tertentu (dengan dropdown pemilihan unit)
 */
const SOPByUnitPage = () => {
  // State untuk data SOP
  const [sopDocuments, setSopDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State untuk filter unit
  const [units, setUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState("my-unit"); // Default: unit pengguna
  const [currentUnitInfo, setCurrentUnitInfo] = useState(null);

  /**
   * Function untuk mengambil data SOP berdasarkan mode yang dipilih
   */
  const fetchSOPData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let response;

      if (selectedUnit === "my-unit") {
        // Ambil SOP berdasarkan unit kerja pengguna yang login
        response = await getSopByUserUnit();
      } else {
        // Ambil SOP berdasarkan unit yang dipilih
        response = await getSopByUnit(selectedUnit);
      }

      // Filter out archived documents
      const filteredData = (response.data || []).filter(
        (doc) => doc.status !== "archived"
      );
      setSopDocuments(filteredData);

      // Set informasi unit saat ini
      if (filteredData && filteredData.length > 0) {
        const firstDoc = filteredData[0];
        setCurrentUnitInfo({
          nama_unit: firstDoc.organization,
          kode_unit: firstDoc.kode_unit,
          nomor_unit: firstDoc.nomor_unit,
        });
      }
    } catch (err) {
      console.error("Error fetching SOP data:", err);
      setError(err.message);
      setSopDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUnit]);

  /**
   * Function untuk mengambil daftar unit untuk dropdown
   */
  const fetchUnits = async () => {
    try {
      const response = await getAllUnits();
      setUnits(response.data || []);
    } catch (err) {
      console.error("Error fetching units:", err);
    }
  };

  // Effect untuk load data awal
  useEffect(() => {
    fetchUnits();
    fetchSOPData();
  }, [fetchSOPData]);

  /**
   * Handler untuk perubahan unit yang dipilih
   */
  const handleUnitChange = (event) => {
    setSelectedUnit(event.target.value);
  };

  /**
   * Function untuk format tanggal
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  /**
   * Function untuk mendapatkan badge color berdasarkan status
   */
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "published":
        return "badge-success";
      case "unpublished":
        return "badge-info";
      case "draft":
        return "badge-warning";
      case "archived":
        return "badge-secondary";
      default:
        return "badge-primary";
    }
  };

  /**
   * Function untuk mengajukan SOP untuk review
   */
  const handleSubmitForReview = async (sopId) => {
    try {
      // Update status SOP menjadi submitted_for_review
      await updateSopDocument(sopId, { status: "submitted_for_review" });

      // Refresh data SOP
      await fetchSOPData();

      alert("SOP berhasil diajukan untuk pemeriksaan!");
    } catch (error) {
      console.error("Error submitting SOP for review:", error);
      alert("Gagal mengajukan SOP untuk pemeriksaan. Silakan coba lagi.");
    }
  };

  return (
    <MainLayout>
      <div className="sop-by-unit-page">
        {/* Header Section */}
        <div className="page-header">
          <h1 className="page-title">📋 SOP Berdasarkan Unit Kerja</h1>
          <p className="page-description">
            Lihat daftar Standard Operating Procedure (SOP) berdasarkan unit
            kerja
          </p>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-group">
            <label htmlFor="unit-select" className="filter-label">
              Pilih Unit Kerja:
            </label>
            <select
              id="unit-select"
              value={selectedUnit}
              onChange={handleUnitChange}
              className="unit-select">
              <option value="my-unit">Unit Kerja Saya</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.nama_unit} ({unit.kode_unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Unit Info Section */}
        {currentUnitInfo && (
          <div className="unit-info-card">
            <h3>📍 Informasi Unit</h3>
            <div className="unit-details">
              <p>
                <strong>Nama Unit:</strong> {currentUnitInfo.nama_unit}
              </p>
              <p>
                <strong>Kode Unit:</strong> {currentUnitInfo.kode_unit}
              </p>
              <p>
                <strong>Nomor Unit:</strong> {currentUnitInfo.nomor_unit}
              </p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Memuat data SOP...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-state">
            <div className="error-card">
              <h3>❌ Terjadi Kesalahan</h3>
              <p>{error}</p>
              <button onClick={fetchSOPData} className="retry-button">
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* Content Section */}
        {!loading && !error && (
          <div className="content-section">
            {/* Summary */}
            <div className="summary-card">
              <h3>📊 Ringkasan</h3>
              <p>
                Ditemukan <strong>{sopDocuments.length}</strong> dokumen SOP
                {selectedUnit === "my-unit"
                  ? " untuk unit kerja Anda"
                  : " untuk unit yang dipilih"}
              </p>
            </div>

            {/* SOP List */}
            {sopDocuments.length > 0 ? (
              <div className="sop-grid">
                {sopDocuments.map((sop) => (
                  <div key={sop.id} className="sop-card">
                    <div className="sop-header">
                      <h4 className="sop-title">{sop.title || sop.name}</h4>
                      <span
                        className={`status-badge ${getStatusBadgeClass(
                          sop.status
                        )}`}>
                        {sop.status}
                      </span>
                    </div>

                    <div className="sop-details">
                      <p className="sop-code">
                        <strong>Kode SOP:</strong> {sop.sop_code}
                      </p>
                      <p className="sop-version">
                        <strong>Versi:</strong> {sop.version}
                      </p>
                      <p className="sop-creator">
                        <strong>Dibuat oleh:</strong> {sop.uploader_name}
                      </p>
                      <p className="sop-date">
                        <strong>Tanggal:</strong> {formatDate(sop.created_date)}
                      </p>
                    </div>

                    {sop.goals && (
                      <div className="sop-goals">
                        <p>
                          <strong>Tujuan:</strong>
                        </p>
                        <p className="goals-text">{sop.goals}</p>
                      </div>
                    )}

                    {sop.scope && (
                      <div className="sop-scope">
                        <p>
                          <strong>Ruang Lingkup:</strong>
                        </p>
                        <p className="scope-text">{sop.scope}</p>
                      </div>
                    )}

                    <div className="sop-actions">
                      <a
                        href={`/sop-flowchart/${sop.id}`}
                        className="action-button view-button"
                        target="_blank"
                        rel="noopener noreferrer">
                        📄 Lihat Flowchart
                      </a>
                      {sop.status === "Published" && (
                        <a
                          href={`/published-sops/${sop.id}`}
                          className="action-button download-button"
                          target="_blank"
                          rel="noopener noreferrer">
                          📥 Lihat Detail
                        </a>
                      )}
                      {sop.status === "draft" && (
                        <button
                          onClick={() => handleSubmitForReview(sop.id)}
                          className="action-button submit-button"
                          title="Ajukan SOP untuk pemeriksaan">
                          📤 Ajukan SOP
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-card">
                  <h3>📂 Tidak Ada Data</h3>
                  <p>
                    Tidak ditemukan dokumen SOP untuk unit kerja
                    {selectedUnit === "my-unit" ? " Anda" : " yang dipilih"}.
                  </p>
                  <p>
                    Silakan periksa unit kerja lain atau hubungi administrator
                    untuk informasi lebih lanjut.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default SOPByUnitPage;
