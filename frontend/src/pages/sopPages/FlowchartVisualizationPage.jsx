import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import mermaid from "mermaid";
import {
  getItems as getItemsApi,
  getCols as getColsApi,
  getSops as getSopsApi,
  getSopNames as fetchSopNamesApi,
} from "../../services/flowchartApi.jsx";

function FlowchartVisualizationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sopName, setSopName] = useState("");
  const [items, setItems] = useState([]);
  const [cols, setCols] = useState([]);
  const [selectedSops, setSelectedSops] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const isMountedRef = useRef(false);
  const mermaidElementRef = useRef(null);

  const roleColors = useMemo(
    () => [
      { bg: "#E3F2FD", border: "#1976D2", text: "#0D47A1" }, // Biru muda
      { bg: "#E8F5E8", border: "#388E3C", text: "#1B5E20" }, // Hijau muda
      { bg: "#FFF3E0", border: "#F57C00", text: "#E65100" }, // Oranye muda
      { bg: "#F3E5F5", border: "#7B1FA2", text: "#4A148C" }, // Ungu muda
      { bg: "#FFEBEE", border: "#D32F2F", text: "#B71C1C" }, // Merah muda (warna yang diganti)
    ],
    []
  );

  // State untuk menyimpan informasi executor yang digunakan dalam flowchart
  const [flowchartExecutors, setFlowchartExecutors] = useState([]);

  useEffect(() => {
    isMountedRef.current = true;
    if (typeof mermaid !== "undefined") {
      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          flowchart: {
            useMaxWidth: true,
            htmlLabels: true,
            rankdir: "TD",
            nodeSpacing: 60,
            rankSpacing: 100,
            padding: 20,
            curve: "basis",
          },
          themeVariables: {
            fontFamily: "Arial, sans-serif",
            primaryColor: "#fff",
            primaryTextColor: "#000",
            primaryBorderColor: "#000",
            nodeBorder: "2px",
            clusterBkg: "transparent",
            tertiaryColor: "#fff",
            background: "#fff",
            secondaryColor: "#fff",
          },
          securityLevel: "loose",
        });
      } catch (error) {
        console.warn("Failed to initialize mermaid:", error);
      }
    } else {
      console.warn("Mermaid is not available");
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchItems = async (sopId) => {
    try {
      const response = await getItemsApi(sopId);
      const data = response.data || response;
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching items:", error);
    }
  };

  const fetchCols = async (sopId) => {
    try {
      const response = await getColsApi(sopId);
      const data = response.data || response;
      setCols(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching cols:", error);
    }
  };

  const fetchSops = async (sopId) => {
    try {
      const response = await getSopsApi(sopId);
      const data = response.data || response;
      const sopsArray = Array.isArray(data) ? data : [];
      const initialSops = {};
      sopsArray.forEach((sop) => {
        // Sesuaikan dengan struktur data dari backend
        const key = `${sop.activity_id}-${sop.person_id}`;
        initialSops[key] = {
          status: sop.status,
          return_to_item_id: sop.return_to_activity_id,
          kelengkapan: sop.completeness || "",
          waktu: sop.time_required || "",
          output: sop.output || "",
          keterangan: sop.notes || "",
        };
      });
      setSelectedSops(initialSops);
    } catch (error) {
      console.error("Error fetching sops:", error);
    }
  };

  const fetchSopName = useCallback(async () => {
    try {
      const response = await fetchSopNamesApi();
      const data = response.data || response;
      const sop = Array.isArray(data)
        ? data.find((s) => s.id === parseInt(id))
        : null;
      if (sop) setSopName(sop.title);
    } catch (error) {
      console.error("Error fetching SOP name:", error);
    }
  }, [id]);

  const fetchAllDataForSop = useCallback(async (sopId) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchItems(sopId),
        fetchCols(sopId),
        fetchSops(sopId),
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchAllDataForSop(id);
      fetchSopName();
    }
  }, [id, fetchAllDataForSop, fetchSopName]);

  const generateMermaidFlowchart = useCallback(() => {
    try {
      let mermaidCode = "flowchart TD\n";

      if (!Object.keys(selectedSops).length) {
        if (items.length === 0) {
          return mermaidCode + "%% No items to display\n";
        }
        mermaidCode += "A((Mulai))\n";
        items.forEach((item, index) => {
          const nodeLabel = `${index + 1} ${
            item.name || "Kegiatan Tanpa Nama"
          }`;
          const nodeId = `Item_${item.id}`;
          mermaidCode += `${nodeId}["${
            nodeLabel.length > 30
              ? nodeLabel.substring(0, 27) + "..."
              : nodeLabel
          }"]\n`;
          if (index === 0) {
            mermaidCode += `A --> ${nodeId}\n`;
          } else {
            const prevNodeId = `Item_${items[index - 1].id}`;
            mermaidCode += `${prevNodeId} --> ${nodeId}\n`;
          }
        });
        mermaidCode += `Item_${items[items.length - 1].id} --> Z((Selesai))\n`;
        return mermaidCode;
      }
      if (sopName) {
        mermaidCode += `%% ${sopName}\n`;
        mermaidCode += `%% Urutan Kegiatan: ${items.length} kegiatan\n\n`;
      }

      // Mengurutkan items berdasarkan urutan
      const sortedItems = [...items].sort(
        (a, b) => (a.order_index || a.id) - (b.order_index || b.id)
      );

      // Membuat mapping untuk kegiatan dan pelaksananya
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
            const kelengkapan = sopData.kelengkapan || "";
            const waktu = sopData.waktu || "";
            const output = sopData.output || "";
            const keterangan = sopData.keterangan || "";
            const personName =
              col.user_name || col.name || col.role || `Person ${col.id}`;

            activitiesWithExecutors.push({
              ...item,
              status,
              kelengkapan,
              waktu,
              output,
              keterangan,
              itemNumber: index + 1,
              colId: parseInt(colId),
              activityOrder: index,
              executor: personName,
              executorId: col.id,
            });
          }
        }
      });

      // Validasi untuk memastikan tidak ada data yang kosong
      if (activitiesWithExecutors.length === 0) {
        console.warn("No configured activities found");
        return mermaidCode + "%% No configured activities to display\n";
      }

      // Fungsi sederhana untuk validasi return target
      const validateReturnTargets = (activities) => {
        const issues = [];

        activities.forEach((activity) => {
          if (activity.status === "Pilihan") {
            const returnTarget =
              selectedSops[`${activity.id}-${activity.colId}`]
                ?.return_to_item_id;

            if (returnTarget) {
              // Cek self-reference
              if (returnTarget === activity.id) {
                issues.push(
                  `Activity ${activity.name} mengarah ke dirinya sendiri`
                );
              }

              // Cek forward reference (harus kembali ke activity sebelumnya)
              const targetActivity = activities.find(
                (a) => a.id === returnTarget
              );
              if (
                targetActivity &&
                targetActivity.activityOrder >= activity.activityOrder
              ) {
                issues.push(
                  `Activity ${activity.name} mengarah ke activity yang sama atau setelahnya`
                );
              }
            }
          }
        });

        return issues;
      };

      // Validasi sebelum membuat diagram
      const validationIssues = validateReturnTargets(activitiesWithExecutors);
      if (validationIssues.length > 0) {
        console.warn("Validation issues found:", validationIssues);
        // Tetap lanjutkan tapi dengan peringatan
      }

      // Mengelompokkan berdasarkan pelaksana, tetapi tetap mempertahankan urutan kegiatan
      const executorsMap = new Map();

      activitiesWithExecutors.forEach((activity, index) => {
        if (!executorsMap.has(activity.executor)) {
          executorsMap.set(activity.executor, {
            activities: [],
            colorIndex: index % roleColors.length, // Warna berdasarkan urutan kegiatan
            executorId: activity.executorId,
          });
        }
        executorsMap.get(activity.executor).activities.push(activity);
      });

      // Mengonversi map ke array untuk diiterasi
      const executorsArray = Array.from(executorsMap, ([executor, data]) => ({
        executor,
        activities: data.activities,
        colorIndex: data.colorIndex,
        executorId: data.executorId,
      }));

      // Menyimpan informasi executor untuk ditampilkan di legend
      setFlowchartExecutors(executorsArray);

      // Membuat subgraph untuk setiap pelaksana
      executorsArray.forEach(({ executor, activities, colorIndex }) => {
        const roleId = executor
          .replace(/\s+/g, "_")
          .replace(/[^a-zA-Z0-9_]/g, "");
        const roleColor = roleColors[colorIndex];

        mermaidCode += `subgraph ${roleId}[" "]\n`;

        activities.forEach((activity) => {
          const nodeId = `${roleId}_${activity.id}`;
          let nodeShape;
          // Membuat label hanya dengan nomor urutan kegiatan
          const nodeLabel = `${activity.itemNumber}`;
          // Untuk tooltip, kita akan menambahkan informasi detail dalam komentar
          let tooltipInfo = "";
          if (
            activity.kelengkapan ||
            activity.waktu ||
            activity.output ||
            activity.keterangan
          ) {
            tooltipInfo = `%% ${activity.name} - Kelengkapan: ${
              activity.kelengkapan || "N/A"
            }, Waktu: ${activity.waktu || "N/A"}, Output: ${
              activity.output || "N/A"
            }, Keterangan: ${activity.keterangan || "N/A"}\n`;
            mermaidCode += tooltipInfo;
          }

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

          // Menambahkan click event untuk menampilkan detail
          if (
            activity.kelengkapan ||
            activity.waktu ||
            activity.output ||
            activity.keterangan
          ) {
            const detailText = `Kegiatan: ${activity.name}\\nKelengkapan: ${
              activity.kelengkapan || "Belum diisi"
            }\\nWaktu: ${activity.waktu || "Belum diisi"}\\nOutput: ${
              activity.output || "Belum diisi"
            }\\nKeterangan: ${activity.keterangan || "Belum diisi"}`;
            mermaidCode += `click ${nodeId} "${detailText}" "Detail Kegiatan"\n`;
          }

          switch (activity.status) {
            case "Mulai":
              mermaidCode += `style ${nodeId} fill:#4CAF50,stroke:#45a049,color:#fff,stroke-width:3px\n`;
              break;
            case "Proses":
              mermaidCode += `style ${nodeId} fill:#2196F3,stroke:#1976D2,color:#fff,stroke-width:2px\n`;
              break;
            case "Pilihan":
              mermaidCode += `style ${nodeId} fill:#FF9800,stroke:#F57C00,color:#fff,stroke-width:2px\n`;
              break;
            case "Selesai":
              mermaidCode += `style ${nodeId} fill:#F44336,stroke:#d32f2f,color:#fff,stroke-width:3px\n`;
              break;
            default:
              mermaidCode += `style ${nodeId} fill:#BDBDBD,stroke:#757575,color:#fff,stroke-width:2px\n`;
              break;
          }
        });

        mermaidCode += `style ${roleId} fill:${roleColor.bg},stroke:${roleColor.border},stroke-width:3px,stroke-dasharray:none\n`;
        mermaidCode += `end\n\n`;
      });

      // Strategi baru: Buat koneksi sederhana berurutan untuk mencegah loop
      const allConnections = [];

      // 1. Koneksi berurutan antar activities (tanpa return/pilihan dulu)
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

        if (currentActivity.status === "Pilihan") {
          allConnections.push(`${currentNodeId} -->|"Ya"| ${nextNodeId}`);
        } else {
          allConnections.push(`${currentNodeId} --> ${nextNodeId}`);
        }
      }

      // 2. Tambahkan return connections untuk Pilihan (hanya jika valid dan tidak menyebabkan loop)
      for (let i = 0; i < activitiesWithExecutors.length; i++) {
        const currentActivity = activitiesWithExecutors[i];

        if (currentActivity.status === "Pilihan") {
          const returnTarget =
            selectedSops[`${currentActivity.id}-${currentActivity.colId}`]
              ?.return_to_item_id;

          if (returnTarget && returnTarget !== currentActivity.id) {
            const returnActivity = activitiesWithExecutors.find(
              (a) => a.id === returnTarget
            );

            if (
              returnActivity &&
              returnActivity.activityOrder < currentActivity.activityOrder
            ) {
              const currentExecutorId = currentActivity.executor
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_]/g, "");
              const returnExecutorId = returnActivity.executor
                .replace(/\s+/g, "_")
                .replace(/[^a-zA-Z0-9_]/g, "");

              const currentNodeId = `${currentExecutorId}_${currentActivity.id}`;
              const returnNodeId = `${returnExecutorId}_${returnActivity.id}`;

              // Hanya tambahkan jika belum ada koneksi yang sama
              const returnConnection = `${currentNodeId} -.->|"Tidak"| ${returnNodeId}`;
              if (!allConnections.includes(returnConnection)) {
                allConnections.push(returnConnection);
              }
            }
          }
        }
      }

      // 3. Tambahkan semua koneksi ke mermaid code (dengan deduplication)
      const uniqueConnections = [...new Set(allConnections)];

      uniqueConnections.forEach((connection) => {
        mermaidCode += `${connection}\n`;
      });

      return mermaidCode;
    } catch (e) {
      console.error("Error generating Mermaid code:", e);
      return 'flowchart TD\nERROR["⚠️ Error dalam pembuatan diagram"]\nERROR --> DETAIL["Periksa konfigurasi SOP"]\nstyle ERROR fill:#ff6b6b,stroke:#e63946,color:#fff\nstyle DETAIL fill:#ffd93d,stroke:#fcbf49,color:#000\n';
    }
  }, [items, cols, selectedSops, sopName, roleColors]);

  useEffect(() => {
    if (!mermaidElementRef.current || loading) {
      return;
    }

    // Gunakan ref untuk tracking rendering state tanpa menyebabkan re-render
    if (
      isMountedRef.current &&
      mermaidElementRef.current.dataset.rendering === "true"
    ) {
      return;
    }

    const renderFlowchart = async () => {
      if (!isMountedRef.current || !mermaidElementRef.current) return;

      // Set flag di DOM element untuk mencegah concurrent renders
      mermaidElementRef.current.dataset.rendering = "true";
      setIsRendering(true);

      const mermaidCode = generateMermaidFlowchart();

      if (mermaidCode.length > 20) {
        try {
          // Tambahkan timeout untuk mencegah hanging
          const renderPromise = mermaid.render(
            "mermaid-flowchart-id",
            mermaidCode
          );
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Render timeout")), 10000)
          );

          const { svg } = await Promise.race([renderPromise, timeoutPromise]);

          if (isMountedRef.current && mermaidElementRef.current) {
            mermaidElementRef.current.innerHTML = svg;
          }
        } catch (renderErr) {
          console.error("Mermaid rendering failed:", renderErr);
          if (isMountedRef.current && mermaidElementRef.current) {
            if (renderErr.message === "Render timeout") {
              mermaidElementRef.current.innerHTML = `
                <div class="p-8 text-center">
                  <div class="text-red-500 text-lg mb-2">⚠️ Timeout</div>
                  <p class="text-gray-600">Diagram terlalu kompleks untuk dirender</p>
                  <pre class="mt-4 p-4 bg-gray-100 text-xs overflow-auto max-h-40">${mermaidCode}</pre>
                </div>
              `;
            } else {
              mermaidElementRef.current.innerHTML = `
                <div class="p-8 text-center">
                  <div class="text-red-500 text-lg mb-2">⚠️ Error Rendering</div>
                  <p class="text-gray-600">Gagal merender diagram</p>
                  <p class="text-sm text-gray-500 mt-2">${renderErr.message}</p>
                  <pre class="mt-4 p-4 bg-gray-100 text-xs overflow-auto max-h-40">${mermaidCode}</pre>
                </div>
              `;
            }
          }
        }
      } else {
        if (isMountedRef.current && mermaidElementRef.current) {
          mermaidElementRef.current.innerHTML = `<p>Tidak ada data flowchart untuk ditampilkan. </p>`;
        }
        console.warn(
          "Generated Mermaid code is empty or too short. Skipping render."
        );
      }

      if (isMountedRef.current && mermaidElementRef.current) {
        mermaidElementRef.current.dataset.rendering = "false";
        setIsRendering(false);
      }
    };

    if (items.length > 0 && cols.length > 0) {
      renderFlowchart();
    }
  }, [items, cols, selectedSops, generateMermaidFlowchart, loading]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Memuat Data SOP...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 p-4 bg-white rounded-lg shadow-sm">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-800">
            Flowchart SOP: {sopName}
          </h1>
          <p className="text-gray-600 mt-1">
            Urutan kegiatan dari awal hingga akhir dengan pembagian peran
            penanggung jawab
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors duration-200">
            <span className="mr-2">←</span> Kembali
          </button>
        </div>
      </div>

      {/* Empty States */}
      {!items.length || !cols.length ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Belum ada data flowchart
          </h3>
          <p className="text-gray-600 mb-6">
            Silakan kelola SOP terlebih dahulu untuk membuat flowchart
          </p>
          <button
            onClick={() => navigate(`/sopvis/${id}/manage`)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200">
            Kelola SOP
          </button>
        </div>
      ) : !Object.keys(selectedSops).length ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="text-5xl mb-4">🔄</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Data SOP tersedia
          </h3>
          <p className="text-gray-600 mb-6">
            Tapi belum ada konfigurasi flowchart. Flowchart akan muncul setelah
            Anda mengatur alur kegiatan.
          </p>
          <button
            onClick={() => navigate(`/sopvis/${id}/manage`)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200">
            Konfigurasi Flowchart
          </button>
        </div>
      ) : (
        <>
          {/* Mermaid Container */}
          <div className="relative bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            {isRendering && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center z-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-700">Memuat Flowchart...</p>
              </div>
            )}
            <div
              ref={mermaidElementRef}
              id="mermaid-flowchart"
              className="p-4 min-h-[400px] flex items-center justify-center"
              style={{ opacity: isRendering ? 0.5 : 1 }}></div>
          </div>

          {/* Legend and Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Keterangan Simbol Flowchart
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-600 mr-3"></div>
                <span className="text-gray-700">
                  Mulai/Selesai (Terminator)
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600 mr-3"></div>
                <span className="text-gray-700">Proses (Process)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 transform rotate-45 bg-orange-500 border-2 border-orange-600 mr-3"></div>
                <span className="text-gray-700">Pilihan (Decision)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 mr-3">
                  <div className="h-0.5 bg-gray-700 mt-2"></div>
                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-gray-700 border-t-transparent border-b-transparent ml-2"></div>
                </div>
                <span className="text-gray-700">Alur Normal</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 mr-3">
                  <div className="h-0.5 border-b border-dashed border-gray-700 mt-2"></div>
                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-gray-700 border-t-transparent border-b-transparent ml-2"></div>
                </div>
                <span className="text-gray-700">Alur Kembali (Tidak)</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 mr-3">
                  <div className="h-0.5 bg-gray-700 mt-2"></div>
                  <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-gray-700 border-t-transparent border-b-transparent ml-2"></div>
                  <div className="text-xs text-center text-gray-700 mt-1">
                    Ya
                  </div>
                </div>
                <span className="text-gray-700">Lanjut (Ya)</span>
              </div>
            </div>

            {/* Role Colors - Keterangan Warna Peran */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Keterangan Warna Peran
              </h4>
              <div className="flex flex-wrap gap-3">
                {flowchartExecutors.map(({ executor, colorIndex }, index) => {
                  const roleColor = roleColors[colorIndex];
                  return (
                    <div
                      key={index}
                      className="flex items-center bg-gray-50 rounded-md px-3 py-2 border"
                      style={{ borderColor: roleColor.border }}>
                      <div
                        className="w-4 h-4 rounded-sm mr-2 border"
                        style={{
                          backgroundColor: roleColor.bg,
                          borderColor: roleColor.border,
                        }}></div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: roleColor.text }}>
                        {executor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Flow Information */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Informasi Flowchart
              </h4>
              <ul className="list-disc pl-5 text-gray-700 space-y-1">
                <li>Angka menunjukkan urutan kegiatan</li>
                <li>
                  Kegiatan dikelompokkan dalam kotak berdasarkan penanggung
                  jawab
                </li>
                <li>
                  Warna node menunjukkan status kegiatan (Hijau=Mulai/Selesai,
                  Biru=Proses, Orange=Pilihan)
                </li>
                <li>
                  Warna latar belakang kelompok menunjukkan penanggung jawab
                  kegiatan
                </li>
                <li>
                  Garis lurus menunjukkan alur normal dari kegiatan ke kegiatan
                  berikutnya
                </li>
                <li>
                  Garis putus-putus menunjukkan alur kembali untuk pilihan
                  "Tidak"
                </li>
                <li>Label "Ya" dan "Tidak" menunjukkan cabang keputusan</li>
                <li>
                  <strong>Urutan Kegiatan:</strong> Flowchart mengikuti urutan
                  kegiatan, bukan urutan pelaksana
                </li>
              </ul>
            </div>

            {/* Detail Data Visualisasi */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Detail Data Visualisasi
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        No
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Kegiatan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Penanggung Jawab
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Kelengkapan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Waktu
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Output
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => {
                      // Cari data visualisasi untuk item ini
                      const sopKey = Object.keys(selectedSops).find((key) =>
                        key.startsWith(`${item.id}-`)
                      );

                      if (sopKey) {
                        const colId = sopKey.split("-")[1];
                        const col = cols.find((c) => c.id === parseInt(colId));
                        const sopData = selectedSops[sopKey];
                        const personName =
                          col?.user_name ||
                          col?.name ||
                          col?.role ||
                          `Person ${col?.id}` ||
                          "Tidak ada";

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-b">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {item.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {personName}
                            </td>
                            <td className="px-4 py-3 text-sm border-b">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  sopData?.status === "Mulai"
                                    ? "bg-green-100 text-green-800"
                                    : sopData?.status === "Proses"
                                    ? "bg-blue-100 text-blue-800"
                                    : sopData?.status === "Pilihan"
                                    ? "bg-orange-100 text-orange-800"
                                    : sopData?.status === "Selesai"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}>
                                {sopData?.status || "Belum ditentukan"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {sopData?.kelengkapan || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {sopData?.waktu || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {sopData?.output || "-"}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {sopData?.keterangan || "-"}
                            </td>
                          </tr>
                        );
                      } else {
                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-b">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 border-b">
                              {item.name}
                            </td>
                            <td
                              className="px-4 py-3 text-sm text-gray-500 border-b italic"
                              colSpan="6">
                              Belum dikonfigurasi
                            </td>
                          </tr>
                        );
                      }
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Data Summary */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Ringkasan Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                  <span className="block text-3xl font-bold text-blue-700">
                    {items.length}
                  </span>
                  <span className="text-sm text-blue-600">Total Kegiatan</span>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                  <span className="block text-3xl font-bold text-green-700">
                    {cols.length}
                  </span>
                  <span className="text-sm text-green-600">
                    Penanggung Jawab
                  </span>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                  <span className="block text-3xl font-bold text-purple-700">
                    {Object.keys(selectedSops).length}
                  </span>
                  <span className="text-sm text-purple-600">Assignment</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default FlowchartVisualizationPage;
