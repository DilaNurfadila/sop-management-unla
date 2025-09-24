import { useState, useEffect } from "react";
import mermaid from "mermaid";
import {
  getSopNames as fetchSopNamesApi,
  createSop as createSopApi,
  deleteSop as deleteSopApi,
  getItems as getItemsApi,
  createItem as createItemApi,
  updateItem as updateItemApi,
  deleteItem as deleteItemApi,
  getCols as getColsApi,
  createCol as createColApi,
  updateCol as updateColApi,
  deleteCol as deleteColApi,
  getSops as getSopsApi,
  saveSopsBulk as saveSopsBulkApi,
  clearAllSops as clearAllSopsApi,
  getAvailableUsers,
} from "../services/flowchartApi.jsx";

function FlowchartView() {
  // State declarations
  const [sopNames, setSopNames] = useState([]);
  const [items, setItems] = useState([]);
  const [cols, setCols] = useState([]);
  const [currentSopId, setCurrentSopId] = useState(null);
  const [sopName, setSopName] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingColId, setEditingColId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingColName, setEditingColName] = useState("");
  const [selectedSops, setSelectedSops] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // State untuk users dan responsible person management
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [responsibleRole, setResponsibleRole] = useState("");
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'create'

  // Initialize Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
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
        // Enhanced terminator styling
        tertiaryColor: "#fff",
        background: "#fff",
        secondaryColor: "#fff",
      },
      // Custom configuration for terminator nodes
      flowchartConfig: {
        htmlLabels: true,
        nodeSpacing: 60,
        rankSpacing: 100,
        // Enable proper terminator rendering
        diagramPadding: 20,
      },
      securityLevel: "loose",
    });
  }, []);

  // Effects
  useEffect(() => {
    fetchSopNames();
    fetchAvailableUsers();
  }, []);

  useEffect(() => {
    if (currentSopId) {
      fetchAllDataForSop(currentSopId);
    }
  }, [currentSopId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Data fetching functions
  const fetchSopNames = async () => {
    try {
      const response = await fetchSopNamesApi();
      const data = response.data || response;
      setSopNames(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching SOP names:", error);
      setSopNames([]);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await getAvailableUsers();
      const data = response.data || response;
      setAvailableUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching available users:", error);
      setAvailableUsers([]);
    }
  };

  const fetchAllDataForSop = async (sopId) => {
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
  };

  const fetchItems = async (sopId) => {
    try {
      const response = await getItemsApi(sopId);
      const data = response.data || response;
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching items:", error);
      setItems([]);
    }
  };

  const fetchCols = async (sopId) => {
    try {
      const response = await getColsApi(sopId);
      const data = response.data || response;
      setCols(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching cols:", error);
      setCols([]);
    }
  };

  const fetchSops = async (sopId) => {
    try {
      const response = await getSopsApi(sopId);
      const data = response.data || response;

      // Initialize selectedSops from database
      const initialSops = {};
      if (Array.isArray(data)) {
        data.forEach((sop) => {
          initialSops[`${sop.items_id}-${sop.cols_id}`] = {
            status: sop.status,
            return_to_item_id: sop.return_to_item_id,
            choice_note: sop.choice_note,
          };
        });
      }
      setSelectedSops(initialSops);
    } catch (error) {
      console.error("Error fetching sops:", error);
      setSelectedSops({});
    }
  };

  // CRUD operations for SOP
  const createSop = async (e) => {
    e.preventDefault();
    if (!sopName) return;
    try {
      const response = await createSopApi({ name: sopName });
      const data = response.data || response;
      setSopName("");
      fetchSopNames();
      setCurrentSopId(data.id);
      setViewMode("create");
      alert("SOP baru berhasil dibuat!");
    } catch (error) {
      console.error("Error creating SOP:", error);
      alert("Error creating SOP");
    }
  };

  const deleteSop = async (sopId) => {
    if (
      window.confirm(
        "Apakah Anda yakin ingin menghapus SOP ini? Semua data terkait akan terhapus."
      )
    ) {
      try {
        await deleteSopApi(sopId);
        fetchSopNames();
        if (currentSopId === sopId) {
          setCurrentSopId(null);
          setViewMode("list");
        }
        alert("SOP berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting SOP:", error);
        alert("Error menghapus SOP");
      }
    }
  };

  // CRUD operations for Items
  const createItem = async (e) => {
    e.preventDefault();
    if (!name || !currentSopId) return;
    try {
      await createItemApi({ name, sop_doc_id: currentSopId });
      setName("");
      fetchItems(currentSopId);
    } catch (error) {
      console.error("Error creating item:", error);
      alert("Error creating item");
    }
  };

  const updateItem = async (id) => {
    if (!editingName) return;
    try {
      await updateItemApi(id, { name: editingName });
      setEditingId(null);
      setEditingName("");
      fetchItems(currentSopId);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error updating item");
    }
  };

  const deleteItem = async (id) => {
    try {
      await deleteItemApi(id);
      fetchItems(currentSopId);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    }
  };

  // CRUD operations for Columns (Responsible Persons)
  const createCol = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !currentSopId) {
      alert("Pilih pengguna dan pastikan SOP sudah dipilih");
      return;
    }
    try {
      await createColApi({
        user_id: selectedUserId,
        sop_doc_id: currentSopId,
        role: responsibleRole || "Pelaksana",
      });
      setSelectedUserId("");
      setResponsibleRole("");
      fetchCols(currentSopId);
    } catch (error) {
      console.error("Error creating responsible person:", error);
      alert("Error creating responsible person");
    }
  };

  const updateCol = async (id) => {
    if (!editingColName) return;
    try {
      await updateColApi(id, {
        user_id: editingColName,
        role: responsibleRole,
      });
      setEditingColId(null);
      setEditingColName("");
      setResponsibleRole("");
      fetchCols(currentSopId);
    } catch (error) {
      console.error("Error updating responsible person:", error);
      alert("Error updating responsible person");
    }
  };

  const deleteCol = async (id) => {
    try {
      await deleteColApi(id);
      fetchCols(currentSopId);
    } catch (error) {
      console.error("Error deleting col:", error);
      alert("Error deleting col");
    }
  };

  // SOP assignment handling
  const handleSopChange = (
    itemId,
    colId,
    status,
    returnToItemId = null,
    choiceNote = ""
  ) => {
    setSelectedSops((prev) => {
      const newSops = { ...prev };

      // Hapus semua status untuk item ini sebelumnya
      Object.keys(newSops).forEach((key) => {
        if (key.startsWith(`${itemId}-`)) {
          delete newSops[key];
        }
      });

      // Tambahkan status baru hanya jika status tidak kosong
      if (status && colId) {
        newSops[`${itemId}-${colId}`] = {
          status,
          return_to_item_id: returnToItemId,
          choice_note: choiceNote,
        };
      }

      return newSops;
    });
  };

  const saveSops = async (e) => {
    e.preventDefault();
    if (!currentSopId) return;

    setLoading(true);

    try {
      const updates = [];

      // Prepare data for bulk update
      for (const key in selectedSops) {
        if (selectedSops[key]) {
          const [items_id, cols_id] = key.split("-").map(Number);
          const sopData = selectedSops[key];

          const update = {
            items_id,
            cols_id,
            status: typeof sopData === "string" ? sopData : sopData.status,
            return_to_item_id:
              typeof sopData === "object" ? sopData.return_to_item_id : null,
            choice_note:
              typeof sopData === "object" ? sopData.choice_note : null,
          };

          updates.push(update);
        }
      }

      // Send bulk update
      await saveSopsBulkApi(updates, currentSopId);
      alert("Data SOP berhasil disimpan!");
      fetchSops(currentSopId);
    } catch (error) {
      console.error("Error saving SOPs:", error);
      alert("Error menyimpan data SOP");
    } finally {
      setLoading(false);
    }
  };

  const clearAllSops = async () => {
    if (!currentSopId) return;
    if (
      window.confirm("Apakah Anda yakin ingin menghapus semua data SOP ini?")
    ) {
      try {
        await clearAllSopsApi(currentSopId);
        setSelectedSops({});
        fetchSops(currentSopId);
        alert("Semua data SOP berhasil dihapus!");
      } catch (error) {
        console.error("Error clearing SOPs:", error);
        alert("Error menghapus data SOP");
      }
    }
  };

  const getCurrentSopName = () => {
    const sop = sopNames.find((s) => s.id === currentSopId);
    return sop ? sop.name : "";
  };

  // Enhanced color scheme for role grouping
  const roleColors = [
    { bg: "#E3F2FD", border: "#1976D2", text: "#0D47A1" }, // Blue
    { bg: "#E8F5E8", border: "#388E3C", text: "#1B5E20" }, // Green
    { bg: "#FFF3E0", border: "#F57C00", text: "#E65100" }, // Orange
    { bg: "#F3E5F5", border: "#7B1FA2", text: "#4A148C" }, // Purple
    { bg: "#FCE4EC", border: "#C2185B", text: "#880E4F" }, // Pink
    { bg: "#E0F2F1", border: "#00796B", text: "#004D40" }, // Teal
    { bg: "#F1F8E9", border: "#689F38", text: "#33691E" }, // Light Green
    { bg: "#FFF8E1", border: "#FFA000", text: "#FF6F00" }, // Yellow
    { bg: "#FFEBEE", border: "#D32F2F", text: "#B71C1C" }, // Light Red
    { bg: "#E8EAF6", border: "#303F9F", text: "#1A237E" }, // Indigo
  ];

  // Function to get color for a role
  const getRoleColor = (roleIndex) => {
    return roleColors[roleIndex % roleColors.length];
  };

  // Get roles with activities for legend
  const getRolesWithActivities = () => {
    if (!items.length || !cols.length) return [];

    const activitiesByRole = {};
    cols.forEach((col) => {
      const personName =
        col.user_name || col.name || col.role || `Person ${col.id}`;
      activitiesByRole[personName] = [];
    });

    items.forEach((item, index) => {
      const sopKey = Object.keys(selectedSops).find((key) =>
        key.startsWith(`${item.id}-`)
      );
      if (sopKey) {
        const colId = sopKey.split("-")[1];
        const col = cols.find((c) => c.id === parseInt(colId));
        if (col) {
          const personName =
            col.user_name || col.name || col.role || `Person ${col.id}`;
          activitiesByRole[personName].push({
            activityOrder: index,
          });
        }
      }
    });

    return Object.entries(activitiesByRole)
      .filter(([, activities]) => activities.length > 0)
      .sort(([, activitiesA], [, activitiesB]) => {
        const minOrderA = Math.min(...activitiesA.map((a) => a.activityOrder));
        const minOrderB = Math.min(...activitiesB.map((a) => a.activityOrder));
        return minOrderA - minOrderB;
      });
  };

  const generateMermaidFlowchart = () => {
    if (!items.length || !cols.length) {
      return "";
    }

    let mermaidCode = "flowchart TD\n";

    // Sort items by their original order (based on activity sequence)
    const sortedItems = [...items].sort((a, b) => {
      const aIndex = items.findIndex((item) => item.id === a.id);
      const bIndex = items.findIndex((item) => item.id === b.id);
      return aIndex - bIndex;
    });

    // Group activities by responsible person, but keep them sorted by activity order
    const activitiesByRole = {};

    // Initialize groups for each responsible person
    cols.forEach((col) => {
      const personName =
        col.user_name || col.name || col.role || `Person ${col.id}`;
      activitiesByRole[personName] = [];
    });

    // Categorize activities by their responsible person, maintaining activity order
    sortedItems.forEach((item, index) => {
      const sopKey = Object.keys(selectedSops).find((key) =>
        key.startsWith(`${item.id}-`)
      );
      if (sopKey) {
        const colId = sopKey.split("-")[1];
        const col = cols.find((c) => c.id === parseInt(colId));
        const sopData = selectedSops[sopKey];

        if (col && sopData) {
          const status = typeof sopData === "string" ? sopData : sopData.status;
          const choiceNote =
            typeof sopData === "object" ? sopData.choice_note : "";
          const personName =
            col.user_name || col.name || col.role || `Person ${col.id}`;

          activitiesByRole[personName].push({
            ...item,
            status,
            choiceNote,
            itemNumber: index + 1, // Use sequential number based on activity order
            colId: parseInt(colId),
            activityOrder: index, // Keep track of original activity order
          });
        }
      }
    });

    // Generate subgraphs for each role, ordered by first appearance in activity sequence
    const rolesWithActivities = Object.entries(activitiesByRole)
      .filter(([, activities]) => activities.length > 0)
      .sort(([, activitiesA], [, activitiesB]) => {
        // Sort roles by the earliest activity order they have
        const minOrderA = Math.min(...activitiesA.map((a) => a.activityOrder));
        const minOrderB = Math.min(...activitiesB.map((a) => a.activityOrder));
        return minOrderA - minOrderB;
      });

    rolesWithActivities.forEach(([roleName, activities], roleIndex) => {
      const roleId = roleName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_]/g, "");

      // Create subgraph with empty/invisible role name
      mermaidCode += `    subgraph ${roleId}[" "]\n`;

      const roleColor = getRoleColor(roleIndex);

      // Sort activities within this role by activity order (not by role order)
      const sortedActivitiesInRole = activities.sort(
        (a, b) => a.activityOrder - b.activityOrder
      );

      sortedActivitiesInRole.forEach((activity) => {
        const nodeId = `${roleId}_${activity.id}`;
        let nodeShape = "";
        let nodeLabel = `${activity.itemNumber}`; // Only show number

        // Determine node shape based on status
        switch (activity.status) {
          case "Mulai":
            // Terminator shape (oval/ellipse) for start
            nodeShape = `${nodeId}((${nodeLabel}))`;
            break;
          case "Proses":
            nodeShape = `${nodeId}["${nodeLabel}"]`;
            break;
          case "Pilihan": {
            // For choice nodes, only show number (no choice note in the flowchart)
            nodeShape = `${nodeId}{"${nodeLabel}"}`;
            break;
          }
          case "Selesai":
            // Terminator shape (oval/ellipse) for end
            nodeShape = `${nodeId}((${nodeLabel}))`;
            break;
          default:
            nodeShape = `${nodeId}["${nodeLabel}"]`;
        }

        mermaidCode += `        ${nodeShape}\n`;

        // Add styling based on status
        switch (activity.status) {
          case "Mulai":
            mermaidCode += `        style ${nodeId} fill:#4CAF50,stroke:#45a049,color:#fff,stroke-width:3px\n`;
            break;
          case "Proses":
            mermaidCode += `        style ${nodeId} fill:#2196F3,stroke:#1976D2,color:#fff,stroke-width:2px\n`;
            break;
          case "Pilihan":
            mermaidCode += `        style ${nodeId} fill:#FF9800,stroke:#F57C00,color:#fff,stroke-width:2px\n`;
            break;
          case "Selesai":
            mermaidCode += `        style ${nodeId} fill:#F44336,stroke:#d32f2f,color:#fff,stroke-width:3px\n`;
            break;
        }
      });

      // Add subgraph background styling
      mermaidCode += `        style ${roleId} fill:${roleColor.bg},stroke:${roleColor.border},stroke-width:3px,stroke-dasharray:none\n`;
      mermaidCode += `    end\n\n`;
    });

    // Create sequential connections between activities
    // Function to get node ID for an item (updated for responsible person structure)
    const getNodeId = (itemId) => {
      const sopKey = Object.keys(selectedSops).find((key) =>
        key.startsWith(`${itemId}-`)
      );
      if (sopKey) {
        const colId = sopKey.split("-")[1];
        const col = cols.find((c) => c.id === parseInt(colId));
        if (col) {
          // Handle both old structure (col.name) and new structure (col.user_name or col.name)
          const personName =
            col.user_name || col.name || col.role || `Person_${col.id}`;
          const roleId = personName
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_]/g, "");
          return `${roleId}_${itemId}`;
        }
      }
      return `Item_${itemId}`; // Fallback to prevent null
    };

    // Function to get status of an item
    const getItemStatus = (itemId) => {
      const sopKey = Object.keys(selectedSops).find((key) =>
        key.startsWith(`${itemId}-`)
      );
      if (sopKey) {
        const sopData = selectedSops[sopKey];
        return typeof sopData === "string" ? sopData : sopData.status;
      }
      return null;
    };

    // Function to get return target for choice items
    const getReturnTarget = (itemId) => {
      const sopKey = Object.keys(selectedSops).find((key) =>
        key.startsWith(`${itemId}-`)
      );
      if (sopKey) {
        const sopData = selectedSops[sopKey];
        if (typeof sopData === "object" && sopData.return_to_item_id) {
          return sopData.return_to_item_id;
        }
      }
      return null;
    };

    // Create sequential flow connections
    for (let i = 0; i < sortedItems.length; i++) {
      const currentItem = sortedItems[i];
      const currentNodeId = getNodeId(currentItem.id);
      const currentStatus = getItemStatus(currentItem.id);

      if (!currentNodeId || !currentStatus) continue;

      if (currentStatus === "Pilihan") {
        // For choice nodes, create two paths: Yes and No
        const returnTarget = getReturnTarget(currentItem.id);

        // "No" path - return to specified item
        if (returnTarget) {
          const returnNodeId = getNodeId(returnTarget);
          if (returnNodeId) {
            mermaidCode += `    ${currentNodeId} -->|"Tidak"| ${returnNodeId}\n`;
          }
        }

        // "Yes" path - continue to next item
        if (i + 1 < sortedItems.length) {
          const nextItem = sortedItems[i + 1];
          const nextNodeId = getNodeId(nextItem.id);
          if (nextNodeId) {
            mermaidCode += `    ${currentNodeId} -->|"Ya"| ${nextNodeId}\n`;
          }
        }
      } else {
        // For non-choice nodes, create normal flow to next item
        if (i + 1 < sortedItems.length) {
          const nextItem = sortedItems[i + 1];
          const nextNodeId = getNodeId(nextItem.id);
          const nextStatus = getItemStatus(nextItem.id);

          if (nextNodeId && nextStatus) {
            // Only connect if next item is not a starting point
            if (nextStatus !== "Mulai" || i === 0) {
              mermaidCode += `    ${currentNodeId} --> ${nextNodeId}\n`;
            }
          }
        }
      }
    }

    return mermaidCode;
  };

  // Function to add tooltips to flowchart nodes
  const addTooltipsToFlowchart = () => {
    try {
      const flowchartElement = document.getElementById("mermaid-flowchart");
      if (!flowchartElement) {
        return;
      }

      // Find all flowchart nodes dengan berbagai selector yang mungkin
      const nodeSelectors = [
        "g.node",
        'g[id*="flowchart"]',
        ".node",
        "g.nodeLabel",
      ];

      let nodes = [];
      for (const selector of nodeSelectors) {
        const foundNodes = flowchartElement.querySelectorAll(selector);
        if (foundNodes.length > 0) {
          nodes = foundNodes;
          break;
        }
      }

      if (nodes.length === 0) {
        // Fallback: cari semua elemen yang mungkin node
        const allGroups = flowchartElement.querySelectorAll("g");
        nodes = Array.from(allGroups).filter((g) => {
          const id = g.getAttribute("id");
          return (
            id &&
            (id.includes("flowchart") ||
              g.querySelector("rect, circle, polygon"))
          );
        });
      }

      nodes.forEach((node, index) => {
        try {
          const nodeId = node.getAttribute("id");

          if (!nodeId) return;

          // Improved regex untuk extract item ID dengan berbagai format
          let itemId = null;
          const patterns = [
            /_(\d+)-/, // Format: roleId_itemId-uniqueId
            /-(\d+)$/, // Format: flowchart-roleId-itemId
            /(\d+)/, // Format: ambil angka pertama
          ];

          for (const pattern of patterns) {
            const match = nodeId.match(pattern);
            if (match) {
              itemId = parseInt(match[1]);
              break;
            }
          }

          if (!itemId) {
            return;
          }

          const item = items.find((item) => item.id === itemId);
          if (!item) {
            return;
          }

          // Get activity order (1-based)
          const activityOrder = items.findIndex((i) => i.id === itemId) + 1;

          // Get responsible person
          const sopKey = Object.keys(selectedSops).find((key) =>
            key.startsWith(`${item.id}-`)
          );
          let responsiblePerson = "-";
          let status = "-";
          let keterangan = "";

          if (sopKey) {
            const colId = sopKey.split("-")[1];
            const col = cols.find((c) => c.id === parseInt(colId));
            const sopData = selectedSops[sopKey];

            if (col) {
              // Handle both old structure (col.name) and new structure (col.user_name or col.role)
              responsiblePerson =
                col.user_name || col.name || col.role || `Person ${col.id}`;
            }
            if (sopData) {
              status = typeof sopData === "string" ? sopData : sopData.status;

              if (status === "Pilihan" && typeof sopData === "object") {
                const returnToItemId = sopData.return_to_item_id;
                const choiceNote = sopData.choice_note;
                const returnItem = items.find((i) => i.id === returnToItemId);
                const returnNumber = returnItem
                  ? items.findIndex((i) => i.id === returnItem.id) + 1
                  : "";

                keterangan = `Kembali ke kegiatan ${returnNumber}`;
                if (choiceNote) keterangan += ` - ${choiceNote}`;
              }
            }
          }

          // Remove existing event listeners
          node.removeEventListener("mouseenter", node._mouseEnterHandler);
          node.removeEventListener("mouseleave", node._mouseLeaveHandler);

          // Create improved tooltip content
          const createTooltipContent = () => `
            <div class="flowchart-tooltip-content" style="
              background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(30, 30, 30, 0.95));
              color: white;
              padding: 16px;
              border-radius: 12px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 14px;
              line-height: 1.5;
              max-width: 320px;
              min-width: 200px;
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
            ">
              <div style="
                font-weight: bold; 
                color: #4CAF50; 
                margin-bottom: 8px;
                font-size: 16px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 6px;
              ">
                📋 Kegiatan ${activityOrder}
              </div>
              <div style="margin-bottom: 6px;">
                <strong style="color: #E0E0E0;">Nama:</strong> 
                <span style="color: white;">${item.name}</span>
              </div>
              <div style="margin-bottom: 6px;">
                <strong style="color: #E0E0E0;">Penanggungjawab:</strong> 
                <span style="color: white;">${responsiblePerson}</span>
              </div>
              <div style="margin-bottom: 6px;">
                <strong style="color: #E0E0E0;">Status:</strong> 
                <span style="
                  background: ${getStatusColor(status)};
                  color: white;
                  padding: 4px 8px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: bold;
                  margin-left: 6px;
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                ">${status}</span>
              </div>
              ${
                keterangan
                  ? `
                <div style="
                  margin-top: 10px; 
                  padding: 8px;
                  background: rgba(255, 193, 7, 0.1);
                  border-left: 3px solid #FFD700;
                  border-radius: 4px;
                  font-style: italic; 
                  color: #FFD700;
                  font-size: 13px;
                ">
                  💡 ${keterangan}
                </div>
              `
                  : ""
              }
            </div>
          `;

          // Mouse enter handler
          const mouseEnterHandler = (e) => {
            // Remove existing tooltip
            const existingTooltip =
              document.getElementById("flowchart-tooltip");
            if (existingTooltip) {
              existingTooltip.remove();
            }

            // Create new tooltip
            const tooltip = document.createElement("div");
            tooltip.id = "flowchart-tooltip";
            tooltip.innerHTML = createTooltipContent();
            tooltip.style.cssText = `
              position: fixed;
              z-index: 10000;
              pointer-events: none;
              opacity: 0;
              transform: translateY(5px);
              transition: opacity 0.2s ease, transform 0.2s ease;
            `;

            document.body.appendChild(tooltip);

            // Position tooltip function
            const updateTooltipPosition = (event) => {
              if (!tooltip || !tooltip.parentNode) return;

              const x = event.clientX;
              const y = event.clientY;
              const tooltipRect = tooltip.getBoundingClientRect();
              const windowWidth = window.innerWidth;
              const windowHeight = window.innerHeight;

              let left = x + 15;
              let top = y - 15;

              // Adjust if tooltip goes outside viewport
              if (left + tooltipRect.width > windowWidth - 10) {
                left = x - tooltipRect.width - 15;
              }
              if (top < 10) {
                top = y + 20;
              }
              if (top + tooltipRect.height > windowHeight - 10) {
                top = windowHeight - tooltipRect.height - 10;
              }

              // Ensure tooltip stays within bounds
              left = Math.max(
                10,
                Math.min(left, windowWidth - tooltipRect.width - 10)
              );
              top = Math.max(
                10,
                Math.min(top, windowHeight - tooltipRect.height - 10)
              );

              tooltip.style.left = `${left}px`;
              tooltip.style.top = `${top}px`;
            };

            // Initial positioning and show animation
            updateTooltipPosition(e);
            requestAnimationFrame(() => {
              if (tooltip && tooltip.parentNode) {
                tooltip.style.opacity = "1";
                tooltip.style.transform = "translateY(0)";
              }
            });

            // Mouse move handler
            const mouseMoveHandler = (event) => {
              updateTooltipPosition(event);
            };

            // Store handlers
            node._mouseMoveHandler = mouseMoveHandler;
            node._currentTooltip = tooltip;

            // Add mousemove to node
            node.addEventListener("mousemove", mouseMoveHandler);
          };

          // Mouse leave handler
          const mouseLeaveHandler = () => {
            const tooltip = document.getElementById("flowchart-tooltip");
            if (tooltip) {
              tooltip.style.opacity = "0";
              tooltip.style.transform = "translateY(-5px)";
              setTimeout(() => {
                if (tooltip && tooltip.parentNode) {
                  tooltip.remove();
                }
              }, 200);
            }

            // Remove mouse move handler
            if (node._mouseMoveHandler) {
              node.removeEventListener("mousemove", node._mouseMoveHandler);
              delete node._mouseMoveHandler;
            }
            delete node._currentTooltip;
          };

          // Store handlers for cleanup
          node._mouseEnterHandler = mouseEnterHandler;
          node._mouseLeaveHandler = mouseLeaveHandler;

          // Add event listeners
          node.addEventListener("mouseenter", mouseEnterHandler);
          node.addEventListener("mouseleave", mouseLeaveHandler);

          // Add cursor pointer and hover effect
          node.style.cursor = "pointer";
          node.style.transition = "filter 0.2s ease"; // Only transition filter, not transform
        } catch (nodeError) {
          console.error(`Error processing node ${index}:`, nodeError);
        }
      });
    } catch (error) {
      console.error("Error adding tooltips:", error);
    }
  };

  // Helper function to get status color for tooltip
  const getStatusColor = (status) => {
    switch (status) {
      case "Mulai":
        return "#4CAF50";
      case "Proses":
        return "#2196F3";
      case "Pilihan":
        return "#FF9800";
      case "Selesai":
        return "#F44336";
      default:
        return "#666";
    }
  };

  // Function to render Mermaid diagram
  const renderMermaidDiagram = async (elementId, mermaidCode) => {
    try {
      // Cleanup existing tooltips before rendering
      cleanupTooltips();

      const element = document.getElementById(elementId);
      if (element && mermaidCode) {
        // Clear previous content
        element.innerHTML = "";
        element.removeAttribute("data-processed");

        // Set the mermaid code
        element.textContent = mermaidCode;

        // Re-initialize mermaid
        await mermaid.init(undefined, element);

        // Add tooltips after mermaid renders dengan multiple attempts
        let tooltipAttempts = 0;
        const maxAttempts = 5;

        const tryAddTooltips = () => {
          tooltipAttempts++;

          const flowchartElement = document.getElementById("mermaid-flowchart");
          if (flowchartElement && flowchartElement.querySelector("g")) {
            addTooltipsToFlowchart();
          } else if (tooltipAttempts < maxAttempts) {
            setTimeout(tryAddTooltips, 300 * tooltipAttempts); // Increasing delay
          } else {
            console.warn("Failed to add tooltips after maximum attempts");
          }
        };

        setTimeout(tryAddTooltips, 200);
      } else {
        console.error(
          "Element not found or mermaid code is empty:",
          elementId,
          mermaidCode
        );
      }
    } catch (error) {
      console.error("Error rendering Mermaid diagram:", error);
    }
  };

  // Function to cleanup tooltips
  const cleanupTooltips = () => {
    try {
      // Remove any existing tooltip
      const existingTooltip = document.getElementById("flowchart-tooltip");
      if (existingTooltip) {
        existingTooltip.remove();
      }

      // Remove event listeners from nodes
      const flowchartElement = document.getElementById("mermaid-flowchart");
      if (flowchartElement) {
        const nodeSelectors = [
          "g.node",
          'g[id*="flowchart"]',
          ".node",
          "g.nodeLabel",
        ];

        let nodes = [];
        for (const selector of nodeSelectors) {
          const foundNodes = flowchartElement.querySelectorAll(selector);
          if (foundNodes.length > 0) {
            nodes = foundNodes;
            break;
          }
        }

        if (nodes.length === 0) {
          // Fallback cleanup
          const allGroups = flowchartElement.querySelectorAll("g");
          nodes = Array.from(allGroups).filter((g) => {
            const id = g.getAttribute("id");
            return (
              id &&
              (id.includes("flowchart") ||
                g.querySelector("rect, circle, polygon"))
            );
          });
        }

        nodes.forEach((node) => {
          try {
            // Remove all custom event handlers
            if (node._mouseEnterHandler) {
              node.removeEventListener("mouseenter", node._mouseEnterHandler);
              delete node._mouseEnterHandler;
            }
            if (node._mouseLeaveHandler) {
              node.removeEventListener("mouseleave", node._mouseLeaveHandler);
              delete node._mouseLeaveHandler;
            }
            if (node._mouseMoveHandler) {
              node.removeEventListener("mousemove", node._mouseMoveHandler);
              delete node._mouseMoveHandler;
            }

            // Remove current tooltip reference
            if (node._currentTooltip) {
              delete node._currentTooltip;
            }

            // Reset cursor and styles
            node.style.cursor = "";
            node.style.transition = "";
          } catch (nodeError) {
            console.error("Error cleaning up node:", nodeError);
          }
        });
      }
    } catch (error) {
      console.error("Error in cleanup tooltips:", error);
    }
  };

  // Trigger Mermaid rendering when data changes
  useEffect(() => {
    // Cleanup previous tooltips before rendering new ones
    cleanupTooltips();

    if (
      items.length > 0 &&
      cols.length > 0 &&
      Object.keys(selectedSops).length > 0
    ) {
      const mermaidCode = generateMermaidFlowchart();
      setTimeout(() => {
        renderMermaidDiagram("mermaid-flowchart", mermaidCode);
      }, 100);
    }

    // Cleanup function for when dependencies change or component unmounts
    return () => {
      cleanupTooltips();
    };
  }, [items, cols, selectedSops]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup tooltips on component unmount
  useEffect(() => {
    return () => {
      cleanupTooltips();
    };
  }, []);

  // Render loading state
  if (loading) {
    return (
      <div className="container">
        <div style={{ textAlign: "center", padding: "50px" }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="container">
      <h1>Sistem Manajemen SOP - Flowchart View</h1>

      {/* Navigation */}
      <div className="navigation">
        <button
          onClick={() => {
            setViewMode("list");
            setCurrentSopId(null);
          }}
          className={viewMode === "list" ? "active" : ""}>
          Daftar SOP
        </button>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn-primary">
          {showCreateForm ? "Batal" : "Tambah SOP Baru"}
        </button>
      </div>

      {/* Form Tambah SOP Baru */}
      {showCreateForm && (
        <div className="section">
          <h2>Tambah SOP Baru</h2>
          <form onSubmit={createSop} className="form">
            <input
              type="text"
              value={sopName}
              onChange={(e) => setSopName(e.target.value)}
              placeholder="Masukkan nama SOP"
              required
              autoComplete="off"
            />
            <button type="submit">Buat SOP</button>
          </form>
        </div>
      )}

      {/* Daftar SOP */}
      {viewMode === "list" && (
        <div className="section">
          <h2>Daftar SOP ({sopNames.length})</h2>
          {sopNames.length === 0 ? (
            <p>Belum ada SOP. Tambahkan SOP baru untuk memulai.</p>
          ) : (
            <div className="sop-list">
              {sopNames.map((sop) => (
                <div key={sop.id} className="sop-card">
                  <div className="sop-info">
                    <h3>{sop.name}</h3>
                    <p>
                      Dibuat:{" "}
                      {new Date(sop.created_at).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <div className="button-group">
                    <button
                      onClick={() => {
                        setCurrentSopId(sop.id);
                        setViewMode("create");
                      }}
                      className="btn-primary">
                      Kelola
                    </button>
                    <button
                      onClick={() => deleteSop(sop.id)}
                      className="btn-danger">
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Form Kelola SOP */}
      {viewMode === "create" && currentSopId && (
        <>
          <div className="section">
            <h2>Kelola SOP: {getCurrentSopName()}</h2>

            {/* Form Tambah Data */}
            <div className="form-section">
              <h3>Tambah Data</h3>
              <form onSubmit={createItem} className="form">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama kegiatan"
                  autoComplete="off"
                />
                <button type="submit">Tambah Kegiatan</button>
              </form>

              <form onSubmit={createCol} className="form">
                <div className="form-group">
                  <label>Pilih Pengguna:</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required>
                    <option value="">Pilih pengguna...</option>
                    {availableUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} - {user.position} ({user.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Role dalam SOP:</label>
                  <input
                    type="text"
                    value={responsibleRole}
                    onChange={(e) => setResponsibleRole(e.target.value)}
                    placeholder="Contoh: Pelaksana Utama, Penanggung Jawab, dll"
                    autoComplete="off"
                  />
                </div>
                <button type="submit">Tambah Penanggungjawab</button>
              </form>
            </div>

            {/* List Data */}
            <div className="grid-2">
              <div className="data-section">
                <h3>Daftar Kegiatan ({items.length})</h3>
                {items.map((item) => (
                  <div key={item.id} className="card">
                    {editingId === item.id ? (
                      <>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoComplete="off"
                        />
                        <div className="button-group">
                          <button onClick={() => updateItem(item.id)}>
                            Simpan
                          </button>
                          <button onClick={() => setEditingId(null)}>
                            Batal
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{item.name}</span>
                        <div className="button-group">
                          <button
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingName(item.name);
                            }}>
                            Edit
                          </button>
                          <button onClick={() => deleteItem(item.id)}>
                            Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="data-section">
                <h3>Daftar Penanggungjawab ({cols.length})</h3>
                {cols.map((col) => (
                  <div key={col.id} className="card">
                    {editingColId === col.id ? (
                      <>
                        <select
                          value={editingColName}
                          onChange={(e) => setEditingColName(e.target.value)}>
                          <option value="">Pilih pengguna...</option>
                          {availableUsers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.position} ({user.unit})
                            </option>
                          ))}
                        </select>
                        <div className="button-group">
                          <button onClick={() => updateCol(col.id)}>
                            Simpan
                          </button>
                          <button onClick={() => setEditingColId(null)}>
                            Batal
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="responsible-person-info">
                          <div>
                            <strong>{col.user_name || col.name}</strong>
                          </div>
                          <div className="user-details">
                            {col.user_position && (
                              <span>Posisi: {col.user_position}</span>
                            )}
                            {col.user_unit && (
                              <span> | Unit: {col.user_unit}</span>
                            )}
                            {col.role && <span> | Role: {col.role}</span>}
                          </div>
                          {col.user_email && (
                            <div className="user-email">
                              Email: {col.user_email}
                            </div>
                          )}
                        </div>
                        <div className="button-group">
                          <button
                            onClick={() => {
                              setEditingColId(col.id);
                              setEditingColName(col.user_id || col.name);
                            }}>
                            Edit
                          </button>
                          <button onClick={() => deleteCol(col.id)}>
                            Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Form Assignment SOP */}
          {items.length > 0 && cols.length > 0 && (
            <div className="section">
              <h3>Kelola Penanggungjawab Kegiatan</h3>
              <form onSubmit={saveSops}>
                <div className="table-wrapper">
                  <table className="sop-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama Kegiatan</th>
                        <th>Penanggungjawab</th>
                        <th>Status</th>
                        <th>Kembali ke Kegiatan</th>
                        <th>Keterangan Pilihan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => {
                        // Get current SOP data for this item
                        const sopKey = Object.keys(selectedSops).find((key) =>
                          key.startsWith(`${item.id}-`)
                        );
                        const sopData = sopKey ? selectedSops[sopKey] : null;
                        const currentColId = sopKey ? sopKey.split("-")[1] : "";

                        // Extract values from sopData (handle both string and object formats)
                        let currentStatus = "";
                        let returnToItemId = "";
                        let choiceNote = "";

                        if (sopData) {
                          if (typeof sopData === "string") {
                            currentStatus = sopData;
                          } else if (typeof sopData === "object") {
                            currentStatus = sopData.status || "";
                            returnToItemId = sopData.return_to_item_id || "";
                            choiceNote = sopData.choice_note || "";
                          }
                        }

                        return (
                          <tr key={item.id}>
                            <td>{index + 1}</td>
                            <td>{item.name}</td>
                            <td>
                              <select
                                value={currentColId}
                                onChange={(e) => {
                                  const colId = e.target.value;
                                  if (colId) {
                                    handleSopChange(
                                      item.id,
                                      parseInt(colId),
                                      currentStatus || "Mulai",
                                      returnToItemId
                                        ? parseInt(returnToItemId)
                                        : null,
                                      choiceNote
                                    );
                                  } else {
                                    // Clear all data for this item
                                    setSelectedSops((prev) => {
                                      const newSops = { ...prev };
                                      Object.keys(newSops).forEach((key) => {
                                        if (key.startsWith(`${item.id}-`)) {
                                          delete newSops[key];
                                        }
                                      });
                                      return newSops;
                                    });
                                  }
                                }}>
                                <option value="">Pilih penanggungjawab</option>
                                {cols.map((col) => (
                                  <option key={col.id} value={col.id}>
                                    {col.user_name ||
                                      col.name ||
                                      col.role ||
                                      `Person ${col.id}`}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <select
                                value={currentStatus}
                                onChange={(e) => {
                                  if (currentColId) {
                                    const newStatus = e.target.value;
                                    // Reset return_to_item_id and choice_note if status is not "Pilihan"
                                    handleSopChange(
                                      item.id,
                                      parseInt(currentColId),
                                      newStatus,
                                      newStatus === "Pilihan"
                                        ? returnToItemId
                                          ? parseInt(returnToItemId)
                                          : null
                                        : null,
                                      newStatus === "Pilihan" ? choiceNote : ""
                                    );
                                  } else {
                                    alert(
                                      "Pilih penanggungjawab terlebih dahulu!"
                                    );
                                  }
                                }}
                                disabled={!currentColId}>
                                <option value="">Pilih status</option>
                                <option value="Mulai">Mulai</option>
                                <option value="Proses">Proses</option>
                                <option value="Pilihan">Pilihan</option>
                                <option value="Selesai">Selesai</option>
                              </select>
                            </td>
                            <td>
                              <select
                                value={returnToItemId}
                                onChange={(e) => {
                                  const returnId = e.target.value
                                    ? parseInt(e.target.value)
                                    : null;
                                  if (currentColId && currentStatus) {
                                    handleSopChange(
                                      item.id,
                                      parseInt(currentColId),
                                      currentStatus,
                                      returnId,
                                      choiceNote
                                    );
                                  }
                                }}
                                disabled={
                                  !currentColId || currentStatus !== "Pilihan"
                                }
                                style={{
                                  backgroundColor:
                                    currentStatus !== "Pilihan"
                                      ? "#f5f5f5"
                                      : "white",
                                }}>
                                <option value="">Pilih kegiatan tujuan</option>
                                {items.map((targetItem, targetIndex) => (
                                  <option
                                    key={targetItem.id}
                                    value={targetItem.id}>
                                    {targetIndex + 1}. {targetItem.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                value={choiceNote}
                                onChange={(e) => {
                                  if (currentColId && currentStatus) {
                                    handleSopChange(
                                      item.id,
                                      parseInt(currentColId),
                                      currentStatus,
                                      returnToItemId
                                        ? parseInt(returnToItemId)
                                        : null,
                                      e.target.value
                                    );
                                  }
                                }}
                                placeholder="Keterangan pilihan (opsional)"
                                disabled={
                                  !currentColId || currentStatus !== "Pilihan"
                                }
                                style={{
                                  width: "100%",
                                  padding: "5px",
                                  backgroundColor:
                                    currentStatus !== "Pilihan"
                                      ? "#f5f5f5"
                                      : "white",
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="button-group">
                  <button type="submit" className="btn-primary">
                    Simpan Perubahan
                  </button>
                  <button
                    type="button"
                    onClick={clearAllSops}
                    className="btn-danger">
                    Hapus Semua Data
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Mermaid Flowchart View */}
          {items.length > 0 && cols.length > 0 && (
            <div className="section">
              <h3>Flowchart View - {getCurrentSopName()}</h3>

              {/* Container untuk layout vertikal (tabel di atas, flowchart di bawah) */}
              <div className="vertical-layout-container">
                {/* Activity Table */}
                <div className="activity-table-section">
                  <h4>Tabel Kegiatan dan Penanggungjawab</h4>
                  <div className="table-wrapper">
                    <table className="activity-table">
                      <thead>
                        <tr>
                          <th>No</th>
                          <th>Nama Kegiatan</th>
                          <th>Penanggungjawab</th>
                          <th>Status</th>
                          <th>Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const sopKey = Object.keys(selectedSops).find((key) =>
                            key.startsWith(`${item.id}-`)
                          );
                          let responsiblePerson = "-";
                          let status = "-";
                          let keterangan = "-";

                          if (sopKey) {
                            const colId = sopKey.split("-")[1];
                            const col = cols.find(
                              (c) => c.id === parseInt(colId)
                            );
                            const sopData = selectedSops[sopKey];

                            if (col) {
                              responsiblePerson =
                                col.user_name ||
                                col.name ||
                                col.role ||
                                `Person ${col.id}`;
                            }
                            if (sopData) {
                              status =
                                typeof sopData === "string"
                                  ? sopData
                                  : sopData.status;

                              if (
                                status === "Pilihan" &&
                                typeof sopData === "object"
                              ) {
                                const returnToItemId =
                                  sopData.return_to_item_id;
                                const choiceNote = sopData.choice_note;
                                const returnItem = items.find(
                                  (i) => i.id === returnToItemId
                                );
                                const returnNumber = returnItem
                                  ? items.findIndex(
                                      (i) => i.id === returnItem.id
                                    ) + 1
                                  : "";

                                keterangan = `Kembali ke kegiatan ${returnNumber}`;
                                if (choiceNote)
                                  keterangan += ` - ${choiceNote}`;
                              }
                            }
                          }

                          return (
                            <tr key={item.id}>
                              <td>{index + 1}</td>
                              <td>{item.name}</td>
                              <td>{responsiblePerson}</td>
                              <td>
                                <span
                                  className={`status-badge status-${status.toLowerCase()}`}>
                                  {status}
                                </span>
                              </td>
                              <td>{keterangan}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mermaid Flowchart */}
                <div className="mermaid-section">
                  <h4>Diagram Flowchart</h4>
                  <div className="mermaid-container">
                    <div className="mermaid" id="mermaid-flowchart">
                      {/* Mermaid diagram will be rendered here */}
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="flowchart-legend">
                <h5>Keterangan Simbol dan Notasi Flowchart:</h5>
                <div className="legend-items">
                  <div className="legend-item">
                    <div className="legend-symbol start">⭕</div>
                    <span>Mulai / Selesai (Oval) - berisi nomor urut</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-symbol process">⬜</div>
                    <span>Proses (Rectangle) - berisi nomor urut</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-symbol decision">♦️</div>
                    <span>
                      Pilihan / Keputusan (Diamond) - berisi nomor urut
                    </span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-symbol connection">→</div>
                    <span>Alur Normal dengan Panah Tajam (Sharp Arrow)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-symbol choice-yes">Ya</div>
                    <span>Pilihan "Ya" - Lanjut ke kegiatan berikutnya</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-symbol choice-no">Tidak</div>
                    <span>
                      Pilihan "Tidak" - Kembali ke kegiatan yang ditentukan
                    </span>
                  </div>
                </div>

                {/* Role Color Legend */}
                <div className="role-color-legend">
                  <h5>Keterangan Warna Background Peran:</h5>
                  <div className="role-legend-items">
                    {getRolesWithActivities().map(([roleName], index) => {
                      const roleColor = getRoleColor(index);
                      return (
                        <div key={roleName} className="role-legend-item">
                          <div
                            className="role-color-box"
                            style={{
                              backgroundColor: roleColor.bg,
                              border: `2px solid ${roleColor.border}`,
                              color: roleColor.text,
                            }}>
                            {roleName.substring(0, 2).toUpperCase()}
                          </div>
                          <span>{roleName}</span>
                        </div>
                      );
                    })}
                  </div>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginTop: "8px",
                    }}>
                    * Warna di atas merupakan background area/kelompok untuk
                    setiap peran
                  </p>
                </div>

                <div className="flow-explanation">
                  <p>
                    <strong>Alur Flowchart:</strong>
                  </p>
                  <ul>
                    <li>
                      Setiap notasi berisi <strong>nomor urut kegiatan</strong>{" "}
                      saja untuk tampilan yang lebih clean
                    </li>
                    <li>
                      Kegiatan dikelompokkan dalam subgraph berdasarkan{" "}
                      <strong>penanggung jawab</strong>
                      (tanpa label visible untuk tampilan yang lebih bersih)
                    </li>
                    <li>
                      Urutan kegiatan mengikuti{" "}
                      <strong>sequence aktivitas</strong>, bukan urutan peran
                    </li>
                    <li>
                      Kegiatan mengalir berurutan dengan garis dan panah yang
                      tajam: 1 → 2 → 3 → ...
                    </li>
                    <li>
                      Warna node berdasarkan status: Hijau (Mulai), Biru
                      (Proses), Orange (Pilihan), Merah (Selesai)
                    </li>
                    <li>
                      Pada kegiatan "Pilihan":
                      <ul>
                        <li>
                          Jika <strong>"Ya"</strong> → Panah lanjut ke kegiatan
                          berikutnya
                        </li>
                        <li>
                          Jika <strong>"Tidak"</strong> → Panah kembali ke
                          kegiatan yang ditentukan
                        </li>
                      </ul>
                    </li>
                    <li>
                      Setiap peran memiliki area background dengan warna berbeda
                      (lihat keterangan warna di atas)
                    </li>
                    <li>
                      <strong>Referensi:</strong> Gunakan tabel di sebelah kiri
                      untuk melihat detail kegiatan
                    </li>
                    <li style={{ color: "#4CAF50", fontWeight: "bold" }}>
                      <strong>💡 Tip:</strong> Arahkan kursor mouse (hover) ke
                      notasi flowchart untuk melihat detail kegiatan secara
                      lengkap dalam tooltip
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
          color: #333;
        }

        .form-group select,
        .form-group input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .responsible-person-info {
          padding: 10px 0;
        }

        .responsible-person-info > div:first-child {
          font-size: 16px;
          margin-bottom: 5px;
          color: #2c3e50;
        }

        .user-details {
          font-size: 13px;
          color: #7f8c8d;
          margin-bottom: 3px;
        }

        .user-email {
          font-size: 12px;
          color: #95a5a6;
          font-style: italic;
        }

        .card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 10px;
          background-color: #fff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .button-group {
          margin-top: 10px;
          display: flex;
          gap: 8px;
        }

        .button-group button {
          padding: 5px 10px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .button-group button:first-child {
          background-color: #3498db;
          color: white;
        }

        .button-group button:last-child {
          background-color: #e74c3c;
          color: white;
        }

        .button-group button:hover {
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
}

export default FlowchartView;
