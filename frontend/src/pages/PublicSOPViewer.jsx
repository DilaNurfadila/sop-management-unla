import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import mermaid from "mermaid";
import QRCode from "qrcode";
import {
  getPublishedSopContent,
  getPublicSopActivities,
  getPublicSopResponsiblePersons,
  getPublicSopVisualizations,
} from "../services/publicApi";
import { dateFormatter } from "../utils/dateFormatter";
import {
  FiArrowLeft,
  FiHome,
  FiList,
  FiClock,
  FiFileText,
} from "react-icons/fi";

// Komponen QR Code Section - CLIENT SIDE GENERATION
const QRCodeSection = ({ sopId, checksum }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // PUBLIC URL yang tidak perlu authentication - hanya gunakan checksum
        const verificationUrl = `http://localhost:5000/verify-sop/${checksum}`;

        const qrUrl = await QRCode.toDataURL(verificationUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        });

        setQrCodeUrl(qrUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
      } finally {
        setLoading(false);
      }
    };

    if (sopId && checksum) {
      generateQR();
    }
  }, [sopId, checksum]);

  return (
    <div className="flex flex-col items-center">
      {loading ? (
        <div className="flex items-center justify-center w-32 h-32 bg-gray-100 rounded">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : qrCodeUrl ? (
        <div className="bg-white p-2 rounded border">
          <img
            src={qrCodeUrl}
            alt="QR Code Bukti Pengesahan SOP"
            className="w-32 h-32 object-contain"
          />
        </div>
      ) : (
        <div className="w-32 h-32 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed</span>
        </div>
      )}
    </div>
  );
};

const PublicSOPViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sopData, setSopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Flowchart states
  const [items, setItems] = useState([]);
  const [cols, setCols] = useState([]);
  const [selectedSops, setSelectedSops] = useState({});
  const [mermaidSvg, setMermaidSvg] = useState("");
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const isMountedRef = useRef(false);
  const isRenderingRef = useRef(false);
  const renderTimeoutRef = useRef(null);
  const [flowchartExecutors, setFlowchartExecutors] = useState([]);

  const roleColors = useMemo(
    () => [
      { bg: "#E3F2FD", border: "#1976D2", text: "#0D47A1" },
      { bg: "#E8F5E8", border: "#388E3C", text: "#1B5E20" },
      { bg: "#FFF3E0", border: "#F57C00", text: "#E65100" },
      { bg: "#F3E5F5", border: "#7B1FA2", text: "#4A148C" },
      { bg: "#FFEBEE", border: "#D32F2F", text: "#B71C1C" },
    ],
    []
  );

  // Initialize mermaid
  useEffect(() => {
    isMountedRef.current = true;
    if (typeof mermaid !== "undefined") {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            rankdir: "TD",
            nodeSpacing: 50,
            rankSpacing: 70,
            padding: 15,
            curve: "basis",
          },
          themeVariables: {
            fontFamily: "Arial, sans-serif",
            primaryColor: "#fff",
            primaryTextColor: "#000",
            primaryBorderColor: "#000",
            nodeBorder: "1px",
            clusterBkg: "transparent",
            tertiaryColor: "#fff",
            background: "#fff",
            secondaryColor: "#fff",
            fontSize: "14px",
          },
          securityLevel: "loose",
        });
      } catch (error) {
        console.warn("Failed to initialize mermaid:", error);
      }
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchSopData = async () => {
      if (!id) {
        setError("ID dokumen tidak valid");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Fetch SOP content and flowchart data in parallel
        const [contentResponse, itemsResponse, colsResponse, sopsResponse] =
          await Promise.all([
            getPublishedSopContent(id),
            getPublicSopActivities(id).catch(() => ({ data: [] })), // Fallback to empty array if fails
            getPublicSopResponsiblePersons(id).catch(() => ({ data: [] })),
            getPublicSopVisualizations(id).catch(() => ({ data: [] })),
          ]);

        setSopData(contentResponse.data);

        // Handle flowchart data
        const itemsData = itemsResponse.data || itemsResponse;
        setItems(Array.isArray(itemsData) ? itemsData : []);

        const colsData = colsResponse.data || colsResponse;
        setCols(Array.isArray(colsData) ? colsData : []);

        const sopsData = sopsResponse.data || sopsResponse;
        const sopsArray = Array.isArray(sopsData) ? sopsData : [];

        const initialSops = {};
        sopsArray.forEach((sop) => {
          const key = `${sop.activity_id}-${sop.person_id}`;
          initialSops[key] = {
            status: sop.status,
            return_to_item_id: sop.return_to_activity_id,
            kelengkapan: sop.completeness || "",
            waktu: sop.time_required || "",
            output: sop.output || "",
            keterangan: sop.notes || "",
            choice_note: sop.choice_note || "",
          };
        });

        setSelectedSops(initialSops);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching SOP:", err);
        setError(err.message || "Gagal memuat konten SOP");
        setSopData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSopData();
  }, [id]);

  const generateMermaidFlowchart = useCallback(() => {
    if (items.length === 0 || cols.length === 0) {
      return "";
    }

    try {
      let mermaidCode = "flowchart TD\n";

      const sortedItems = [...items].sort((a, b) => a.id - b.id);
      const activitiesWithExecutors = [];

      sortedItems.forEach((item, index) => {
        const sopKey = Object.keys(selectedSops).find((key) =>
          key.startsWith(`${item.id}-`)
        );

        if (sopKey) {
          const colId = sopKey.split("-")[1];
          const col = cols.find((c) => c.id === parseInt(colId));
          const sopData = selectedSops[sopKey];

          if (col && sopData) {
            const status =
              typeof sopData === "string" ? sopData : sopData.status;
            const choiceNote =
              typeof sopData === "object" ? sopData.choice_note : "";
            const personName =
              col.user_name || col.name || col.role || `Person ${col.id}`;

            activitiesWithExecutors.push({
              ...item,
              status,
              choiceNote,
              itemNumber: index + 1,
              colId: parseInt(colId),
              activityOrder: index,
              executor: personName,
              executorId: col.id,
            });
          }
        }
      });

      const executorsMap = new Map();
      activitiesWithExecutors.forEach((activity, index) => {
        if (!executorsMap.has(activity.executor)) {
          executorsMap.set(activity.executor, {
            activities: [],
            colorIndex: index % roleColors.length,
            executorId: activity.executorId,
          });
        }
        executorsMap.get(activity.executor).activities.push(activity);
      });

      const executorsArray = Array.from(executorsMap, ([executor, data]) => ({
        executor,
        activities: data.activities,
        colorIndex: data.colorIndex,
        executorId: data.executorId,
      }));

      setFlowchartExecutors(executorsArray);

      executorsArray.forEach(({ executor, activities, colorIndex }) => {
        const roleId = executor
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "");
        const roleColor = roleColors[colorIndex];

        mermaidCode += `subgraph ${roleId}[" "]\n`;

        activities.forEach((activity) => {
          const nodeId = `${roleId}_${activity.id}`;
          let nodeShape;
          const nodeLabel = `${activity.itemNumber}`;

          if (activity.status === "Mulai" || activity.status === "Selesai") {
            nodeShape = `${nodeId}(("${nodeLabel}"))`;
          } else if (activity.status === "Proses") {
            nodeShape = `${nodeId}["${nodeLabel}"]`;
          } else if (activity.status === "Pilihan") {
            nodeShape = `${nodeId}{"${nodeLabel}"}`;
          } else {
            nodeShape = `${nodeId}["${nodeLabel}"]`;
          }

          mermaidCode += `${nodeShape}\n`;

          switch (activity.status) {
            case "Mulai":
              mermaidCode += `style ${nodeId} fill:#4CAF50,stroke:#45a049,color:#fff,stroke-width:2px\n`;
              break;
            case "Proses":
              mermaidCode += `style ${nodeId} fill:#2196F3,stroke:#1976D2,color:#fff,stroke-width:1px\n`;
              break;
            case "Pilihan":
              mermaidCode += `style ${nodeId} fill:#FF9800,stroke:#F57C00,color:#fff,stroke-width:1px\n`;
              break;
            case "Selesai":
              mermaidCode += `style ${nodeId} fill:#F44336,stroke:#d32f2f,color:#fff,stroke-width:2px\n`;
              break;
            default:
              mermaidCode += `style ${nodeId} fill:#BDBDBD,stroke:#757575,color:#fff,stroke-width:1px\n`;
              break;
          }
        });

        mermaidCode += `style ${roleId} fill:${roleColor.bg},stroke:${roleColor.border},stroke-width:2px,stroke-dasharray:none\n`;
        mermaidCode += `end\n\n`;
      });

      const visitedConnections = new Set();
      for (let i = 0; i < activitiesWithExecutors.length - 1; i++) {
        const currentActivity = activitiesWithExecutors[i];
        const nextActivity = activitiesWithExecutors[i + 1];

        const currentExecutorId = currentActivity.executor
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "");
        const nextExecutorId = nextActivity.executor
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "");

        const currentNodeId = `${currentExecutorId}_${currentActivity.id}`;
        const nextNodeId = `${nextExecutorId}_${nextActivity.id}`;

        const normalConnection = `${currentNodeId}->${nextNodeId}`;
        if (!visitedConnections.has(normalConnection)) {
          visitedConnections.add(normalConnection);

          if (currentActivity.status === "Pilihan") {
            mermaidCode += `${currentNodeId} -->|Ya| ${nextNodeId}\n`;

            const returnTarget =
              typeof selectedSops[
                `${currentActivity.id}-${currentActivity.colId}`
              ] === "object"
                ? selectedSops[`${currentActivity.id}-${currentActivity.colId}`]
                    .return_to_item_id
                : null;

            if (returnTarget && returnTarget !== currentActivity.id) {
              const returnActivity = activitiesWithExecutors.find(
                (a) => a.id === returnTarget
              );
              if (returnActivity) {
                const returnExecutorId = returnActivity.executor
                  .replace(/\s+/g, "_")
                  .replace(/[^a-zA-Z0-9_]/g, "");
                const returnNodeId = `${returnExecutorId}_${returnActivity.id}`;

                const returnConnection = `${currentNodeId}-.${returnNodeId}`;
                if (!visitedConnections.has(returnConnection)) {
                  visitedConnections.add(returnConnection);
                  mermaidCode += `${currentNodeId} -.->|Tidak| ${returnNodeId}\n`;
                }
              }
            }
          } else {
            mermaidCode += `${currentNodeId} --> ${nextNodeId}\n`;
          }
        }
      }

      return mermaidCode;
    } catch (e) {
      console.error("Error generating Mermaid code:", e);
      return "flowchart TD\nE((Error))\nE -- 'Error in data or logic' --> F((Fallback))\n";
    }
  }, [items, cols, selectedSops, roleColors]);

  const renderFlowchart = useCallback(async () => {
    if (loading || !isMountedRef.current) {
      return;
    }

    if (isRenderingRef.current) {
      return;
    }

    isRenderingRef.current = true;
    setIsLoadingChart(true);

    try {
      const mermaidCode = generateMermaidFlowchart();
      if (mermaidCode.length > 20) {
        try {
          const { svg } = await mermaid.render(
            `mermaid-flowchart-${Date.now()}`,
            mermaidCode
          );
          if (isMountedRef.current) {
            setMermaidSvg(svg);
          }
        } catch (renderErr) {
          console.error("Mermaid rendering failed:", renderErr);
          if (isMountedRef.current) {
            setMermaidSvg(`<pre>${mermaidCode}</pre>`);
          }
        }
      } else {
        if (isMountedRef.current) {
          setMermaidSvg(`<p>Tidak ada konfigurasi flowchart.</p>`);
        }
      }
    } catch (error) {
      console.error("Error in renderFlowchart:", error);
    } finally {
      if (isMountedRef.current) {
        isRenderingRef.current = false;
        setIsLoadingChart(false);
      }
    }
  }, [generateMermaidFlowchart, loading]);

  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    const hasData = items.length > 0 && cols.length > 0;

    if (hasData) {
      renderTimeoutRef.current = setTimeout(() => {
        renderFlowchart();
      }, 300);
    } else {
      setMermaidSvg("");
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [items, cols, renderFlowchart]);

  const activityTableData = useMemo(() => {
    if (items.length === 0 || cols.length === 0) {
      return [];
    }

    const tableData = items.map((item, index) => {
      const sopKey = Object.keys(selectedSops).find((key) =>
        key.startsWith(`${item.id}-`)
      );

      let responsiblePerson = "-";
      let kelengkapan = "-";
      let waktu = "-";
      let output = "-";
      let keterangan = "-";

      if (sopKey) {
        const colId = sopKey.split("-")[1];
        const col = cols.find((c) => c.id === parseInt(colId));
        const sopData = selectedSops[sopKey];

        if (col) {
          responsiblePerson = col.user_name || col.name || col.role || "N/A";
        }

        if (sopData) {
          kelengkapan = sopData.kelengkapan || "-";
          waktu = sopData.waktu || "-";
          output = sopData.output || "-";
          keterangan = sopData.keterangan || "-";
        }
      }

      return {
        id: item.id,
        no: index + 1,
        name: item.name,
        responsible: responsiblePerson,
        kelengkapan: kelengkapan,
        waktu: waktu,
        output: output,
        keterangan: keterangan,
      };
    });

    return tableData;
  }, [items, cols, selectedSops]);

  const formatDate = (dateString) => {
    if (!dateString) return "Tidak tersedia";
    return dateFormatter(dateString);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat konten SOP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              SOP Tidak Ditemukan
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/sop")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
                <FiArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Daftar SOP
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center">
                <FiHome className="mr-2 h-4 w-4" />
                Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sopData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Data SOP tidak tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header dengan navigasi sederhana */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => navigate("/sop")}
              className="text-gray-600 hover:bg-gray-100 transition-colors duration-200 flex items-center px-3 py-2 rounded-md">
              <FiArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Kembali ke Daftar SOP</span>
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Detail Dokumen SOP
            </h1>
          </div>
          <div className="flex-1 flex justify-end space-x-2">
            <button
              onClick={() => navigate("/")}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-md">
              <FiHome className="mr-2 h-4 w-4" />
              Beranda
            </button>
          </div>
        </div>
      </header>

      {/* Main content dengan format seperti ViewSOPDocument */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Header dengan Logo dan Nama Universitas - sama seperti ViewSOPDocument */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bagian Kiri: Logo, Universitas, Unit Kerja, Judul SOP */}
                <div className="flex flex-col justify-center">
                  {/* Header dengan Logo dan Nama Instansi */}
                  <div className="text-center text-white mb-8">
                    <div className="flex justify-center mb-6">
                      <img
                        src="/unla.svg"
                        alt="Logo Universitas Langlangbuana"
                        className="h-24 w-24"
                      />
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold uppercase tracking-wide">
                        UNIVERSITAS LANGLANGBUANA
                      </h1>
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Informasi Dokumen */}
                <div className="flex flex-col justify-center text-white">
                  <div className="bg-opacity-10 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Kode SOP:
                        </span>
                        <span>{sopData?.sop_code || "N/A"}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Versi:
                        </span>
                        <span>{sopData?.version || "Tidak tersedia"}</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Tanggal Pembuatan:
                        </span>
                        <span className="text-right">
                          {sopData?.approval_date
                            ? formatDate(sopData?.approval_date)
                            : "Belum disahkan"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Tanggal Revisi:
                        </span>
                        <span className="text-right">
                          {/* Tampilkan tanggal revisi hanya jika benar-benar ada revisi setelah disahkan */}
                          {sopData?.revision_date &&
                          sopData?.approval_date &&
                          (sopData?.status === "published" ||
                            sopData?.review_status === "approved") &&
                          new Date(sopData?.revision_date) >
                            new Date(sopData?.approval_date)
                            ? formatDate(sopData?.revision_date)
                            : sopData?.approval_date &&
                              (sopData?.status === "published" ||
                                sopData?.review_status === "approved")
                            ? "Belum ada revisi"
                            : "Tidak ada revisi"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Tanggal Efektif:
                        </span>
                        <span className="text-right">
                          {/* Tampilkan tanggal efektif hanya jika SOP sudah disahkan */}
                          {sopData?.approval_date &&
                          (sopData?.status === "published" ||
                            sopData?.status === "unpublished") &&
                          sopData?.review_status === "approved"
                            ? formatDate(
                                sopData?.sop_applicable ||
                                  sopData?.effective_date
                              )
                            : "Belum ditetapkan"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        {/* Kolom Kiri - Label "DISAHKAN OLEH" */}
                        <div className="basis-1/3">
                          <span className="text-blue-100 font-semibold">
                            Disahkan Oleh :
                          </span>
                        </div>
                        {/* Layout approval dengan "DISAHKAN OLEH" di kiri */}
                        {sopData?.review_status === "approved" ? (
                          <div className="items-start justify-center basis-2/3">
                            {/* Kolom Kanan - Approval Info */}
                            <div className="flex flex-col items-center">
                              {/* Posisi di atas QR Code */}
                              <div className="text-center">
                                <div className="text-sm text-white">
                                  {sopData?.approver_position ||
                                    "Tidak Diketahui"}
                                </div>
                              </div>

                              {/* QR Code di tengah */}
                              {sopData?.qr_checksum && (
                                <div className="mb-4 mt-4">
                                  <QRCodeSection
                                    sopId={sopData.id}
                                    checksum={sopData.qr_checksum}
                                  />
                                </div>
                              )}

                              {/* Nama di bawah QR Code */}
                              <div className="text-center">
                                <div className="text-sm text-white">
                                  {sopData?.approver_name || "Tidak Diketahui"}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-blue-100 text-sm">
                              Belum Disahkan
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-start pt-2 border-t border-blue-300">
                        <span className="text-blue-100 font-semibold">
                          Judul SOP:
                        </span>
                        <span className="text-right">
                          {sopData?.sop_title || "Tidak ada judul"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Konten SOP - sama seperti ViewSOPDocument */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 space-y-6">
              {sopData?.goals && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                    Tujuan
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sopData.goals}
                  </p>
                </section>
              )}
              {sopData?.scope && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                    Ruang Lingkup
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sopData.scope}
                  </p>
                </section>
              )}
              {sopData?.definition && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                    Definisi
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sopData.definition}
                  </p>
                </section>
              )}
              {sopData?.sop_reference && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                    Referensi SOP
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sopData.sop_reference}
                  </p>
                </section>
              )}
              {sopData?.procedure_description && (
                <section>
                  <h3 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                    Deskripsi Prosedur
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {sopData.procedure_description}
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bagian Kegiatan dan Flowchart dengan ukuran lebih lebar */}
      <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-none mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Daftar Kegiatan - Lebih lebar (2 kolom dari 3) */}
            {activityTableData.length > 0 && (
              <div className="xl:col-span-2 bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center">
                  <FiList className="w-5 h-5 mr-2 text-gray-600" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Daftar Kegiatan
                  </h2>
                </div>
                <div className="p-3 h-[600px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr className="h-14">
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kegiatan
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pelaksana
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kelengkapan
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Waktu
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Output
                        </th>
                        <th className="px-3 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activityTableData.map((activity) => (
                        <tr key={activity.id} className="hover:bg-gray-50 h-16">
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {activity.no}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500">
                            {activity.name}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.responsible}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-pre-wrap">
                            {activity.kelengkapan}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {activity.waktu}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-pre-wrap">
                            {activity.output}
                          </td>
                          <td className="px-3 py-4 text-sm text-gray-500 whitespace-pre-wrap">
                            {activity.keterangan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Flowchart Kegiatan - Lebih kecil (1 kolom dari 3) */}
            <div className="xl:col-span-1 bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 border-b border-gray-200 flex items-center">
                <FiClock className="w-5 h-5 mr-2 text-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Flowchart Kegiatan
                </h2>
              </div>
              <div className="p-3 flex flex-col items-center">
                {items.length > 0 && cols.length > 0 ? (
                  <>
                    <div
                      className="relative flex justify-center w-full"
                      style={{ minHeight: "600px" }}>
                      {isLoadingChart && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-sm text-gray-600">
                              Memuat Flowchart...
                            </p>
                          </div>
                        </div>
                      )}
                      <div
                        className="mermaid-svg-wrapper flex justify-center items-center w-full overflow-auto"
                        dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                        style={{
                          opacity: isLoadingChart ? 0.5 : 1,
                          transform: "scale(1)",
                          transformOrigin: "center center",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}></div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="bg-white rounded-lg shadow-sm border p-3">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">
                          Keterangan Simbol
                        </h4>
                        <div className="grid grid-cols-1 gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500"></div>
                            <span className="text-xs">Mulai/Selesai</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-md bg-blue-500"></div>
                            <span className="text-xs">Proses</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rotate-45 bg-yellow-500"></div>
                            <span className="text-xs">Pilihan</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg shadow-sm border p-3">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2">
                          Keterangan Warna Peran
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {flowchartExecutors.map(
                            ({ executor, colorIndex }, index) => {
                              const roleColor = roleColors[colorIndex];
                              return (
                                <div
                                  key={index}
                                  className="flex items-center gap-1 p-1 bg-gray-100 rounded text-xs">
                                  <div
                                    className="w-3 h-3 rounded-sm"
                                    style={{
                                      backgroundColor: roleColor.bg,
                                      border: `1px solid ${roleColor.border}`,
                                    }}></div>
                                  <span className="text-xs">{executor}</span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <FiFileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-sm font-medium text-gray-500 mb-1">
                      Flowchart Tidak Tersedia
                    </h3>
                    <p className="text-gray-40 text-xs">
                      Data visualisasi flowchart belum dikonfigurasi.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicSOPViewer;
