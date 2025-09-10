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
import { getSopContent } from "../../services/apiPdf";
import { getSafeUserDataNoRedirect } from "../../utils/cryptoUtils.jsx";
import {
  getItems as getItemsApi,
  getCols as getColsApi,
  getSops as getSopsApi,
} from "../../services/flowchartApi.jsx";
import api from "../../services/api";
import "../../App.css";

import Notification from "../../components/Notification";
import { dateFormatter } from "../../utils/dateFormatter";
import {
  FiArrowLeft,
  FiUser,
  FiCalendar,
  FiFileText,
  FiTag,
  FiClock,
  FiList,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiShield,
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
          width: 128,
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
        <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      ) : qrCodeUrl ? (
        <div className="bg-white p-1 rounded border">
          <img
            src={qrCodeUrl}
            alt="QR Code Bukti Pengesahan SOP"
            className="w-20 h-20 object-contain"
          />
        </div>
      ) : (
        <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">Failed</span>
        </div>
      )}
    </div>
  );
};

const ReviewSOPDocument = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sopData, setSopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [items, setItems] = useState([]);
  const [cols, setCols] = useState([]);
  const [selectedSops, setSelectedSops] = useState({});
  const [mermaidSvg, setMermaidSvg] = useState("");
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const isMountedRef = useRef(false);
  const isRenderingRef = useRef(false);
  const renderTimeoutRef = useRef(null);
  const [flowchartExecutors, setFlowchartExecutors] = useState([]);

  // Review specific states
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showApproveAllModal, setShowApproveAllModal] = useState(false);
  const [showReviewerApproveModal, setShowReviewerApproveModal] =
    useState(false);
  const [rejectData, setRejectData] = useState({ note: "" });
  const [approveData, setApproveData] = useState({
    note: "",
    effective_date: new Date().toISOString().split("T")[0], // Default to today
  });
  const [approveAllData, setApproveAllData] = useState({
    note: "",
    effective_date: new Date().toISOString().split("T")[0],
  });
  const [reviewerApproveData, setReviewerApproveData] = useState({ note: "" });
  const currentUser = useMemo(() => getSafeUserDataNoRedirect(), []);

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
    const fetchAllSopData = async () => {
      if (!id) {
        setError("ID dokumen tidak valid");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch both view data and review data
        const [
          contentResponse,
          itemsResponse,
          colsResponse,
          sopsResponse,
          reviewResponse,
        ] = await Promise.all([
          getSopContent(id),
          getItemsApi(id),
          getColsApi(id),
          getSopsApi(id),
          api.get(`/review/sop/${id}`),
        ]);

        // Set SOP content data with review data merged
        const sopContentData = contentResponse.data;
        const reviewData = reviewResponse.data.data;

        // Merge the data
        const mergedSopData = {
          // Prefer content data as the source of truth for display fields
          ...sopContentData,
          // Overlay reviewData but avoid clobbering unit scope/name if reviewData lacks it
          ...reviewData,
          // Explicit field priorities
          review_status:
            reviewData.review_status ?? sopContentData.review_status,
          user_role: reviewData.user_role ?? sopContentData.user_role,
          creator_name: reviewData.creator_name || sopContentData.creator_name,
          reviewer_name:
            reviewData.reviewer_name || sopContentData.reviewer_name,
          approver_name:
            reviewData.approver_name || sopContentData.approver_name,
          unit_scope_name:
            reviewData.unit_scope_name || sopContentData.unit_scope_name,
          unit_name: reviewData.unit_name || sopContentData.unit_name,
        };

        setSopData(mergedSopData);

        // Handle items response
        const itemsData = itemsResponse.data || itemsResponse;
        setItems(Array.isArray(itemsData) ? itemsData : []);

        // Handle cols response
        const colsData = colsResponse.data || colsResponse;
        setCols(Array.isArray(colsData) ? colsData : []);

        // Handle sops response
        const sopsData = sopsResponse.data || sopsResponse;
        const sopsArray = Array.isArray(sopsData) ? sopsData : [];

        const initialSops = {};
        sopsArray.forEach((sop) => {
          // Sesuaikan dengan struktur data dari backend yang sudah diperbaiki
          const key = `${sop.activity_id}-${sop.person_id}`;
          initialSops[key] = {
            status: sop.status,
            return_to_item_id: sop.return_to_activity_id,
            kelengkapan: sop.completeness || "", // Backend: completeness
            waktu: sop.time_required || "", // Backend: time_required
            output: sop.output || "",
            keterangan: sop.notes || "", // Backend: notes
            choice_note: sop.choice_note || "",
          };
        });

        setSelectedSops(initialSops);
      } catch (err) {
        console.error("Error fetching SOP data:", err);
        setError(err.message || "Gagal memuat data SOP. Silakan coba lagi.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllSopData();
  }, [id]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted_for_review: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Menunggu Review",
      },
      reviewer_approved: {
        color: "bg-blue-100 text-blue-800",
        text: "Menunggu Pengesahan",
      },
      approved: { color: "bg-green-100 text-green-800", text: "Disetujui" },
      needs_revision: {
        color: "bg-red-100 text-red-800",
        text: "Perlu Revisi",
      },
    };

    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const canApprove = () => {
    if (!sopData) return false;

    const userRole = sopData.user_role;
    const reviewStatus = sopData.review_status;

    return (
      (userRole === "Reviewer" && reviewStatus === "submitted_for_review") ||
      (userRole === "Approver" && reviewStatus === "reviewer_approved") ||
      userRole === "admin" ||
      userRole === "admin_unit"
    );
  };

  const isSameReviewerAndApprover = useMemo(() => {
    if (!sopData) return false;
    return (
      sopData.reviewer_id &&
      sopData.approver_id &&
      sopData.reviewer_id === sopData.approver_id
    );
  }, [sopData]);

  const canUseCombinedApprove = useMemo(() => {
    if (!sopData || !currentUser) return false;
    if (!isSameReviewerAndApprover) return false;
    // Pastikan user saat ini adalah user yang ditetapkan sebagai reviewer/approver
    const sameUser = String(currentUser.id) === String(sopData.reviewer_id);
    // Hanya tampil saat status di salah satu tahap persetujuan
    const inFlow =
      sopData.review_status === "submitted_for_review" ||
      sopData.review_status === "reviewer_approved";
    return sameUser && inFlow;
  }, [sopData, currentUser, isSameReviewerAndApprover]);

  const handleApprove = async () => {
    // Jika user adalah Approver, tampilkan modal untuk set tanggal efektif
    if (sopData.user_role === "Approver") {
      setShowApproveModal(true);
      return;
    }
    // Untuk Reviewer, tampilkan modal input catatan
    setShowReviewerApproveModal(true);
  };

  const handleConfirmReviewerApprove = async () => {
    try {
      setActionLoading(true);
      await api.post(`/review/approve/${id}`, {
        note: reviewerApproveData.note,
      });
      showNotification("SOP berhasil disetujui", "success");
      setShowReviewerApproveModal(false);
      setTimeout(() => {
        navigate("/review");
      }, 1500);
    } catch (error) {
      console.error("Error approving SOP (Reviewer):", error);
      showNotification(
        error.response?.data?.message || "Error menyetujui SOP",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAll = async () => {
    setShowApproveAllModal(true);
  };

  const handleConfirmApproveAll = async () => {
    if (!approveAllData.effective_date) {
      showNotification("Tanggal efektif harus diisi", "error");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (approveAllData.effective_date < today) {
      showNotification("Tanggal efektif tidak boleh di masa lalu", "error");
      return;
    }

    try {
      setActionLoading(true);

      // Jika masih tahap reviewer, setujui dulu sebagai Reviewer
      if (sopData.review_status === "submitted_for_review") {
        await api.post(`/review/approve/${id}`, {
          note: approveAllData.note,
          act_as: "Reviewer",
        });
      }

      // Lanjutkan pengesahan sebagai Approver dengan tanggal efektif
      await api.post(`/review/approve/${id}`, {
        note: approveAllData.note,
        effective_date: approveAllData.effective_date,
        act_as: "Approver",
      });

      showNotification("SOP disetujui dan disahkan", "success");
      setShowApproveAllModal(false);
      setTimeout(() => navigate("/review"), 1500);
    } catch (error) {
      console.error("Error in combined approve flow:", error);
      showNotification(
        error.response?.data?.message ||
          "Terjadi kesalahan saat menyetujui dan mengesahkan SOP",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmApprove = async () => {
    if (!approveData.effective_date) {
      showNotification("Tanggal efektif harus diisi", "error");
      return;
    }

    // Validasi tanggal tidak boleh di masa lalu
    const today = new Date().toISOString().split("T")[0];
    if (approveData.effective_date < today) {
      showNotification("Tanggal efektif tidak boleh di masa lalu", "error");
      return;
    }

    try {
      setActionLoading(true);

      await api.post(`/review/approve/${id}`, {
        note: approveData.note,
        effective_date: approveData.effective_date,
      });

      showNotification("SOP berhasil disahkan", "success");
      setShowApproveModal(false);

      setTimeout(() => {
        navigate("/review");
      }, 2000);
    } catch (error) {
      console.error("Error approving SOP:", error);
      showNotification(
        error.response?.data?.message || "Error mengesahkan SOP",
        "error"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectData.note) {
      showNotification("Catatan penolakan harus diisi", "error");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/review/reject/${id}`, rejectData);
      showNotification("SOP ditolak dan dikembalikan untuk revisi", "success");

      setTimeout(() => {
        navigate("/review");
      }, 2000);
    } catch (error) {
      console.error("Error rejecting SOP:", error);
      showNotification(
        error.response?.data?.message || "Error menolak SOP",
        "error"
      );
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const generateMermaidFlowchart = useCallback(() => {
    if (items.length === 0 || cols.length === 0) {
      return "";
    }

    try {
      let mermaidCode = "flowchart TD\n";

      // Mengurutkan items berdasarkan urutan
      const sortedItems = [...items].sort((a, b) => a.id - b.id);

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

      // Menghubungkan node berdasarkan urutan kegiatan
      const visitedConnections = new Set(); // Untuk mencegah duplicate connections

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

        // Koneksi normal (Ya atau langsung)
        const normalConnection = `${currentNodeId}->${nextNodeId}`;
        if (!visitedConnections.has(normalConnection)) {
          visitedConnections.add(normalConnection);

          if (currentActivity.status === "Pilihan") {
            // Menambahkan link dengan notasi "Ya" di tengah
            mermaidCode += `${currentNodeId} -->|Ya| ${nextNodeId}\n`;

            // Menangani alur "Tidak" untuk keputusan
            const returnTarget =
              typeof selectedSops[
                `${currentActivity.id}-${currentActivity.colId}`
              ] === "object"
                ? selectedSops[`${currentActivity.id}-${currentActivity.colId}`]
                    .return_to_item_id
                : null;

            if (returnTarget && returnTarget !== currentActivity.id) {
              // Prevent self-loop
              const returnActivity = activitiesWithExecutors.find(
                (a) => a.id === returnTarget
              );
              if (returnActivity) {
                const returnExecutorId = returnActivity.executor
                  .replace(/\s+/g, "_")
                  .replace(/[^a-zA-Z0-9_]/g, "");
                const returnNodeId = `${returnExecutorId}_${returnActivity.id}`;

                // Cek untuk mencegah loop tak terhingga
                const returnConnection = `${currentNodeId}-.${returnNodeId}`;
                if (!visitedConnections.has(returnConnection)) {
                  visitedConnections.add(returnConnection);
                  // Menggunakan link dotted dengan notasi "Tidak" di tengah
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

    // Prevent multiple simultaneous renders
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
            `mermaid-flowchart-${Date.now()}`, // Unique ID to prevent caching issues
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
        console.warn(
          "Generated Mermaid code is empty or too short. Skipping render."
        );
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
    // Clear any existing timeout
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    const hasData = items.length > 0 && cols.length > 0;

    if (hasData) {
      // Debounce the rendering to prevent excessive re-renders
      renderTimeoutRef.current = setTimeout(() => {
        renderFlowchart();
      }, 300); // 300ms delay
    } else {
      setMermaidSvg("");
    }

    // Cleanup timeout on unmount
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat dokumen SOP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex-1">
            <button
              onClick={() => navigate(-1)}
              className="text-gray-600 hover:bg-gray-100 transition-colors duration-200 flex items-center px-3 py-2 rounded-md">
              <FiArrowLeft className="h-5 w-5 mr-2" />
              <span className="font-medium">Kembali</span>
            </button>
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Review Dokumen SOP
            </h1>
          </div>
          <div className="flex-1 flex justify-end">
            {/* Review Action Buttons */}
            {canApprove() && (
              <div className="flex gap-2">
                {/* Jika reviewer & approver user-nya sama, tampilkan tombol gabungan */}
                {canUseCombinedApprove && (
                  <button
                    onClick={handleApproveAll}
                    disabled={actionLoading}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 transition-colors">
                    <FiCheck className="w-4 h-4 mr-2" />
                    {actionLoading ? "Memproses..." : "Setujui & Sahkan"}
                  </button>
                )}
                {/* Tombol Tolak hanya untuk tahap reviewer */}
                {sopData?.review_status === "submitted_for_review" && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 transition-colors">
                    <FiX className="w-4 h-4 mr-2" />
                    {actionLoading ? "Memproses..." : "Tolak"}
                  </button>
                )}
                {!canUseCombinedApprove && (
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 transition-colors">
                    <FiCheck className="w-4 h-4 mr-2" />
                    {actionLoading
                      ? "Memproses..."
                      : sopData?.user_role === "Approver"
                      ? "Sahkan SOP"
                      : "Setujui"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Review Status Badge */}
      {sopData?.review_status && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Status Review:</span>
              {getStatusBadge(sopData.review_status)}
            </div>
          </div>
        </div>
      )}

      {/* Bagian SOP Info dengan ukuran standar */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6">
          {/* Header dengan Logo dan Nama Universitas */}
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
                      <h1 className="text-xl font-bold uppercase tracking-wide">
                        UNIVERSITAS LANGLANGBUANA
                      </h1>
                      <h1 className="text-xl font-semibold mt-3">
                        {(() => {
                          const name =
                            sopData?.unit_scope_name ||
                            sopData?.unit_name ||
                            "";
                          const normalized = name
                            .toString()
                            .trim()
                            .toLowerCase()
                            .replace(/\./g, "")
                            .replace(/\s+/g, " ");
                          const isUniversity =
                            normalized.includes("universitas") &&
                            normalized.includes("langlangbuana");
                          return isUniversity
                            ? ""
                            : name || "Unit Kerja Tidak Diketahui";
                        })()}
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
                            ? dateFormatter(sopData?.approval_date) || "-"
                            : "-"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Tanggal Revisi:
                        </span>
                        <span className=" text-right">
                          {/* Tampilkan tanggal revisi jika ada dan setelah tanggal pengesahan */}
                          {sopData?.revision_date
                            ? dateFormatter(sopData.revision_date)
                            : "Belum ada revisi"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-blue-100 font-semibold">
                          Tanggal Efektif:
                        </span>
                        <span className=" text-right">
                          {/* Tampilkan tanggal efektif hanya jika SOP sudah disahkan */}
                          {sopData?.approval_date &&
                          (sopData?.status === "published" ||
                            sopData?.status === "unpublished") &&
                          sopData?.review_status === "approved"
                            ? dateFormatter(
                                sopData?.effective_date ||
                                  sopData?.sop_applicable
                              )
                            : "Belum ditetapkan"}
                        </span>
                      </div>

                      <div className="flex justify-between items-start pt-2 border-t border-blue-300">
                        {/* Sementara di-comment sesuai permintaan */}
                        {/* <span className="text-blue-100">Disusun Oleh:</span>
                        <span className="font-semibold text-right">
                          {sopData?.creator_name || "Belum Disahkan"}
                        </span> */}
                      </div>
                      <div className="flex justify-between items-start pt-2">
                        {/* Sementara di-comment sesuai permintaan */}
                        {/* <span className="text-blue-100">Diperiksa Oleh:</span>
                        <span className="font-semibold text-right">
                          {sopData?.review_status &&
                          ![
                            "draft",
                            "pending",
                            "submitted_for_review",
                          ].includes(sopData.review_status) &&
                          sopData?.reviewer_name
                            ? sopData.reviewer_name
                            : "Belum Diperiksa"}
                        </span> */}
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
                        <span className="text-blue-100 font-semibold ">
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

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Konten SOP */}
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
                      {activityTableData.map((activity, index) => (
                        <tr
                          key={`activity-${activity.id}-${index}`}
                          className="hover:bg-gray-50 h-16">
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
                            ({ executor, colorIndex, executorId }, index) => {
                              const roleColor = roleColors[colorIndex];
                              return (
                                <div
                                  key={`executor-${executorId}-${index}`}
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

      {/* Approve Modal for Approver */}
      {showApproveModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApproveModal(false);
            }
          }}>
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <FiCheck className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-2 text-center">
                Pengesahan SOP
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Efektif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={approveData.effective_date}
                    onChange={(e) =>
                      setApproveData((prev) => ({
                        ...prev,
                        effective_date: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tanggal mulai berlakunya SOP (tidak boleh di masa lalu)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Pengesahan
                  </label>
                  <textarea
                    value={approveData.note}
                    onChange={(e) =>
                      setApproveData((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Catatan pengesahan (opsional)..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApprove}
                  disabled={actionLoading || !approveData.effective_date}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  {actionLoading ? "Memproses..." : "Sahkan SOP"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Combined Approve & Approve Modal for same user as Reviewer+Approver */}
      {showApproveAllModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowApproveAllModal(false);
            }
          }}>
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <FiCheck className="mx-auto h-12 w-12 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-2 text-center">
                Setujui & Sahkan SOP
              </h3>
              <p className="text-sm text-gray-600 text-center mt-1">
                Anda bertindak sebagai Reviewer dan Approver. Isi tanggal
                efektif untuk pengesahan.
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Efektif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={approveAllData.effective_date}
                    onChange={(e) =>
                      setApproveAllData((prev) => ({
                        ...prev,
                        effective_date: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tanggal mulai berlakunya SOP (tidak boleh di masa lalu)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    value={approveAllData.note}
                    onChange={(e) =>
                      setApproveAllData((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Catatan (opsional)..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowApproveAllModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproveAll}
                  disabled={actionLoading || !approveAllData.effective_date}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  {actionLoading ? "Memproses..." : "Setujui & Sahkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reviewer Approve Modal (note only) */}
      {showReviewerApproveModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowReviewerApproveModal(false);
            }
          }}>
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}>
            <div className="mt-3">
              <FiCheck className="mx-auto h-12 w-12 text-blue-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-2 text-center">
                Setujui Dokumen (Reviewer)
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Persetujuan (opsional)
                  </label>
                  <textarea
                    value={reviewerApproveData.note}
                    onChange={(e) =>
                      setReviewerApproveData({ note: e.target.value })
                    }
                    rows="3"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tulis catatan (opsional)..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowReviewerApproveModal(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReviewerApprove}
                  disabled={actionLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  {actionLoading ? "Memproses..." : "Setujui"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={(e) => {
            // Close modal if clicking on backdrop
            if (e.target === e.currentTarget) {
              setShowRejectModal(false);
            }
          }}>
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking inside
          >
            <div className="mt-3 text-center">
              <FiX className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-2">
                Tolak Dokumen SOP
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan Revisi
                  </label>
                  <textarea
                    value={rejectData.note}
                    onChange={(e) =>
                      setRejectData((prev) => ({
                        ...prev,
                        note: e.target.value,
                      }))
                    }
                    rows="4"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Berikan penjelasan detail tentang alasan penolakan dan apa yang perlu diperbaiki..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowRejectModal(false);
                  }}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors">
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-md transition-colors">
                  {actionLoading ? "Memproses..." : "Tolak"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReviewSOPDocument;
