import React, { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import { getPublishedDocs } from "../services/publicApi";
import {
  FiSearch,
  FiFileText,
  FiExternalLink,
  FiCalendar,
  FiTag,
  FiFilter,
  FiX,
} from "react-icons/fi";

const PublishedSOPsPage = () => {
  const [allSops, setAllSops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [sortBy, setSortBy] = useState("sop_code");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetchPublishedSops();
  }, []);

  const fetchPublishedSops = async () => {
    try {
      setLoading(true);
      const docs = await getPublishedDocs();
      setAllSops(docs);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching published SOPs:", err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique organizations for filter
  const organizations = useMemo(() => {
    const orgs = [
      ...new Set(allSops.map((sop) => sop.organization).filter(Boolean)),
    ];
    return orgs.sort();
  }, [allSops]);

  // Filter and search SOPs
  const filteredSops = useMemo(() => {
    let filtered = allSops;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (sop) =>
          (sop.sop_code && sop.sop_code.toLowerCase().includes(searchLower)) ||
          (sop.sop_title &&
            sop.sop_title.toLowerCase().includes(searchLower)) ||
          (sop.organization &&
            sop.organization.toLowerCase().includes(searchLower))
      );
    }

    // Organization filter
    if (selectedOrganization) {
      filtered = filtered.filter(
        (sop) => sop.organization === selectedOrganization
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (sortBy === "sop_applicable") {
        aValue = new Date(aValue || "1970-01-01");
        bValue = new Date(bValue || "1970-01-01");
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allSops, searchTerm, selectedOrganization, sortBy, sortOrder]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const handleDownload = (url) => {
    window.open(url, "_blank");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedOrganization("");
    setSortBy("sop_code");
    setSortOrder("asc");
  };

  return (
    <>
      <Navbar />
      <main className="p-6 bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2 flex items-center">
            <FiFileText className="mr-3" />
            Dokumen SOP
          </h1>
          <p className="text-gray-600">
            Jelajahi dan cari dokumen Standard Operating Procedure (SOP) yang
            telah dipublikasi
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode, judul, atau organisasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Organization Filter */}
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedOrganization}
                onChange={(e) => setSelectedOrganization(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Semua Organisasi</option>
                {organizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="sop_code">Urutkan: Kode SOP</option>
              <option value="sop_title">Urutkan: Judul</option>
              <option value="organization">Urutkan: Organisasi</option>
              <option value="sop_applicable">Urutkan: Tanggal Berlaku</option>
              <option value="sop_version">Urutkan: Versi</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="asc">A-Z / Lama-Baru</option>
              <option value="desc">Z-A / Baru-Lama</option>
            </select>
          </div>

          {/* Filter Summary and Clear */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm text-gray-600">
              Menampilkan {filteredSops.length} dari {allSops.length} dokumen
            </div>

            {(searchTerm || selectedOrganization) && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800">
                <FiX className="h-4 w-4" />
                Bersihkan Filter
              </button>
            )}

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  Pencarian: "{searchTerm}"
                </span>
              )}
              {selectedOrganization && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                  Organisasi: {selectedOrganization}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="text-lg text-gray-600">Memuat dokumen SOP...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-700">Error: {error}</p>
              <button
                onClick={fetchPublishedSops}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                Coba Lagi
              </button>
            </div>
          )}

          {!loading &&
            !error &&
            filteredSops.length === 0 &&
            allSops.length === 0 && (
              <div className="text-center py-12">
                <FiFileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Dokumen SOP
                </h3>
                <p className="text-gray-500">
                  Belum ada dokumen SOP yang dipublikasi
                </p>
              </div>
            )}

          {!loading &&
            !error &&
            filteredSops.length === 0 &&
            allSops.length > 0 && (
              <div className="text-center py-12">
                <FiSearch className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak Ada Hasil
                </h3>
                <p className="text-gray-500 mb-4">
                  Tidak ditemukan dokumen SOP yang sesuai dengan pencarian atau
                  filter Anda
                </p>
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Bersihkan Filter
                </button>
              </div>
            )}

          {!loading && !error && filteredSops.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredSops.map((sop) => (
                <div
                  key={sop.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                  {/* SOP Header */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        {sop.sop_code || "N/A"}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight mb-2">
                      {sop.sop_title || "Tanpa Judul"}
                    </h3>
                  </div>

                  {/* SOP Details */}
                  <div className="space-y-3 mb-6 text-sm text-gray-600">
                    {sop.organization && (
                      <div className="flex items-center">
                        <FiTag className="mr-3 h-4 w-4 text-gray-400" />
                        <span className="font-medium">{sop.organization}</span>
                      </div>
                    )}
                    {sop.sop_applicable && (
                      <div className="flex items-center">
                        <FiCalendar className="mr-3 h-4 w-4 text-gray-400" />
                        <span>Berlaku: {formatDate(sop.sop_applicable)}</span>
                      </div>
                    )}
                    {sop.sop_version && (
                      <div className="flex items-center">
                        <span className="mr-3 text-gray-400">📄</span>
                        <span>Versi: {sop.sop_version}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  {sop.url && (
                    <button
                      onClick={() => handleDownload(sop.url)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center">
                      <FiExternalLink className="mr-2 h-4 w-4" />
                      Lihat Dokumen
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default PublishedSOPsPage;
