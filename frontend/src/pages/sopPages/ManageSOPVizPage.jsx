import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
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
  getSopNames as fetchSopNamesApi,
} from "../../services/flowchartApi.jsx";

// Waktu helpers: parse and format "<angka> <unit>" strings
const TIME_UNITS = ["detik", "menit", "jam", "hari", "minggu", "bulan"];

function normalizeUnit(unit) {
  if (!unit) return "menit";
  const u = String(unit).toLowerCase().trim();
  if (TIME_UNITS.includes(u)) return u;
  if (u.startsWith("detik")) return "detik";
  if (u.startsWith("menit")) return "menit";
  if (u.startsWith("jam")) return "jam";
  if (u.startsWith("hari")) return "hari";
  if (u.startsWith("minggu")) return "minggu";
  if (u.startsWith("bulan")) return "bulan";
  return "menit";
}

function parseTimeRequired(str) {
  if (!str || typeof str !== "string") return { value: "", unit: "menit" };
  const m = str.trim().match(/(\d+(?:[.,]\d+)?)(?:\s*)([A-Za-zÀ-ÿ]+)/);
  if (!m) return { value: "", unit: "menit" };
  const rawVal = m[1].replace(",", ".");
  const num = isNaN(Number(rawVal)) ? "" : rawVal;
  const unit = normalizeUnit(m[2]);
  return { value: num, unit };
}

function toTimeRequiredString(value, unit) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return "";
  }
  const u = normalizeUnit(unit);
  return `${value} ${u}`;
}

function ManageSOPVizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sopName, setSopName] = useState("");
  const [items, setItems] = useState([]);
  const [cols, setCols] = useState([]);
  const [selectedSops, setSelectedSops] = useState({});
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingColId, setEditingColId] = useState(null);
  const [editingColName, setEditingColName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchAllDataForSop(id);
      fetchAvailableUsers();
      fetchSopName();
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSopName = async () => {
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
      const initialSops = {};
      if (Array.isArray(data)) {
        data.forEach((sop) => {
          // Sesuaikan dengan struktur data dari backend
          const key = `${sop.activity_id}-${sop.person_id}`;
          const parsed = parseTimeRequired(sop.time_required || "");
          initialSops[key] = {
            status: sop.status,
            return_to_item_id: sop.return_to_activity_id,
            kelengkapan: sop.completeness || "", // Backend: completeness
            waktu: sop.time_required || "", // Backend: time_required
            waktu_value: parsed.value,
            waktu_unit: parsed.unit,
            output: sop.output || "",
            keterangan: sop.notes || "", // Backend: notes
          };
        });
      }
      setSelectedSops(initialSops);
    } catch (error) {
      console.error("Error fetching sops:", error);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await getAvailableUsers();
      const data = response.data || response;
      setAvailableUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching available users:", error);
    }
  };

  const createItem = async (e) => {
    e.preventDefault();
    if (!name || !id) return;
    try {
      await createItemApi({ name, sop_doc_id: id });
      setName("");
      fetchItems(id);
    } catch (error) {
      console.error("Error creating item:", error);
      alert("Error creating item");
    }
  };

  const updateItem = async (itemId) => {
    if (!editingName) return;
    try {
      await updateItemApi(itemId, { name: editingName });
      setEditingId(null);
      setEditingName("");
      fetchItems(id);
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Error updating item");
    }
  };

  const deleteItem = async (itemId) => {
    try {
      await deleteItemApi(itemId);
      fetchItems(id);
      // Refresh sops data after deleting item to ensure consistency
      fetchSops(id);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Error deleting item");
    }
  };

  const createCol = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !id) {
      alert("Pilih pengguna dan pastikan SOP sudah dipilih");
      return;
    }
    try {
      await createColApi({
        user_id: selectedUserId,
        sop_doc_id: id,
      });
      setSelectedUserId("");
      fetchCols(id);
    } catch (error) {
      console.error("Error creating responsible person:", error);
      alert("Error creating responsible person");
    }
  };

  const updateCol = async (colId) => {
    if (!editingColName) return;
    try {
      await updateColApi(colId, {
        user_id: editingColName,
      });
      setEditingColId(null);
      setEditingColName("");
      fetchCols(id);
    } catch (error) {
      console.error("Error updating responsible person:", error);
      alert("Error updating responsible person");
    }
  };

  const deleteCol = async (colId) => {
    try {
      await deleteColApi(colId);
      fetchCols(id);
      // Refresh sops data after deleting col to ensure consistency
      fetchSops(id);
    } catch (error) {
      console.error("Error deleting col:", error);
      alert("Error deleting col");
    }
  };

  const handleSopChange = (
    itemId,
    colId,
    status,
    returnToItemId = null,
    kelengkapan = "",
    waktu = "",
    output = "",
    keterangan = "",
    waktuValue = undefined,
    waktuUnit = undefined
  ) => {
    setSelectedSops((prev) => {
      const newSops = { ...prev };
      // Remove any existing assignment for this item
      Object.keys(newSops).forEach((key) => {
        if (key.startsWith(`${itemId}-`)) {
          delete newSops[key];
        }
      });

      // Add new assignment if status and colId are provided
      if (status && colId) {
        const finalWaktu =
          waktuValue !== undefined && waktuUnit !== undefined
            ? toTimeRequiredString(waktuValue, waktuUnit)
            : waktu;
        newSops[`${itemId}-${colId}`] = {
          status,
          return_to_item_id: returnToItemId,
          kelengkapan,
          waktu: finalWaktu,
          waktu_value:
            waktuValue !== undefined
              ? waktuValue
              : prev[`${itemId}-${colId}`]?.waktu_value,
          waktu_unit:
            waktuUnit !== undefined
              ? waktuUnit
              : prev[`${itemId}-${colId}`]?.waktu_unit,
          output,
          keterangan,
        };
      }
      return newSops;
    });
  };

  const saveSops = async (e) => {
    e.preventDefault();
    if (!id) return;
    // Frontend validation: completeness (kelengkapan), time_required (waktu), output must be non-empty for selected rows
    const errors = [];
    for (const key in selectedSops) {
      const val = selectedSops[key];
      if (!val || typeof val !== "object") continue;
      const missing = [];
      if (!val.kelengkapan || String(val.kelengkapan).trim() === "")
        missing.push("Kelengkapan");
      const timeStr =
        val.waktu_value !== undefined && val.waktu_unit
          ? toTimeRequiredString(val.waktu_value, val.waktu_unit)
          : val.waktu;
      if (!timeStr || String(timeStr).trim() === "") missing.push("Waktu");
      if (!val.output || String(val.output).trim() === "")
        missing.push("Output");
      if (missing.length) {
        errors.push({ key, missing });
      }
    }
    if (errors.length) {
      alert("Pastikan kelengkapan, waktu, dan output terisi semua");
      return;
    }
    setLoading(true);
    try {
      const updates = [];
      for (const key in selectedSops) {
        if (selectedSops[key]) {
          const [activity_id, person_id] = key.split("-").map(Number);
          const sopData = selectedSops[key];
          const timeStr =
            typeof sopData === "object"
              ? sopData.waktu_value !== undefined && sopData.waktu_unit
                ? toTimeRequiredString(sopData.waktu_value, sopData.waktu_unit)
                : sopData.waktu || ""
              : "";
          updates.push({
            activity_id, // Sesuaikan dengan backend
            person_id, // Sesuaikan dengan backend
            status: typeof sopData === "string" ? sopData : sopData.status,
            return_to_activity_id:
              typeof sopData === "object" ? sopData.return_to_item_id : null,
            completeness:
              typeof sopData === "object" ? sopData.kelengkapan : "", // Backend field
            time_required: timeStr, // Backend field
            output: typeof sopData === "object" ? sopData.output : "",
            notes: typeof sopData === "object" ? sopData.keterangan : "", // Backend field
          });
        }
      }
      await saveSopsBulkApi(updates, id);
      alert("Data SOP berhasil disimpan!");
      // Refresh data from database after save
      await fetchSops(id);
    } catch (error) {
      console.error("Error saving SOPs:", error);
      const msg =
        error?.response?.data?.message ||
        error.message ||
        "Error menyimpan data SOP";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearAllSops = async () => {
    if (!id) return;
    if (
      window.confirm("Apakah Anda yakin ingin menghapus semua data SOP ini?")
    ) {
      try {
        await clearAllSopsApi(id);
        // Clear local state and refresh from database
        setSelectedSops({});
        await fetchSops(id);
        alert("Semua data SOP berhasil dihapus!");
      } catch (error) {
        console.error("Error clearing SOPs:", error);
        alert("Error menghapus data SOP");
      }
    }
  };

  // Get current assignment from database data
  const getCurrentAssignment = (itemId) => {
    const sopKey = Object.keys(selectedSops).find((key) =>
      key.startsWith(`${itemId}-`)
    );

    if (sopKey) {
      const colId = sopKey.split("-")[1];
      const sopData = selectedSops[sopKey];

      let status = "";
      let returnToItemId = "";
      let kelengkapan = "";
      let waktu = "";
      let output = "";
      let keterangan = "";
      let waktu_value = "";
      let waktu_unit = "menit";

      if (typeof sopData === "string") {
        status = sopData;
      } else if (typeof sopData === "object") {
        status = sopData.status || "";
        returnToItemId = sopData.return_to_item_id || "";
        kelengkapan = sopData.kelengkapan || "";
        waktu = sopData.waktu || "";
        // read parsed fields or parse on the fly
        if (
          sopData.waktu_value !== undefined &&
          sopData.waktu_unit !== undefined
        ) {
          waktu_value = sopData.waktu_value;
          waktu_unit = sopData.waktu_unit;
        } else {
          const parsed = parseTimeRequired(waktu);
          waktu_value = parsed.value;
          waktu_unit = parsed.unit;
        }
        output = sopData.output || "";
        keterangan = sopData.keterangan || "";
      }

      return {
        colId,
        status,
        returnToItemId,
        kelengkapan,
        waktu,
        waktu_value,
        waktu_unit,
        output,
        keterangan,
      };
    }

    return {
      colId: "",
      status: "",
      returnToItemId: "",
      kelengkapan: "",
      waktu: "",
      waktu_value: "",
      waktu_unit: "menit",
      output: "",
      keterangan: "",
    };
  };

  // Track current unique status owners so only one "Mulai" and one "Selesai" can exist
  const currentMulaiKey =
    Object.keys(selectedSops).find((key) => {
      const v = selectedSops[key];
      return (typeof v === "object" ? v.status : v) === "Mulai";
    }) || null;

  const currentSelesaiKey =
    Object.keys(selectedSops).find((key) => {
      const v = selectedSops[key];
      return (typeof v === "object" ? v.status : v) === "Selesai";
    }) || null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Kelola SOP</h1>
            <p className="text-lg text-gray-600 mt-2">{sopName}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center">
            ← Kembali
          </button>
        </div>

        {/* Form Tambah Data */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Tambah Data
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Tambah Kegiatan */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-4">
                Tambah Kegiatan
              </h4>
              <form onSubmit={createItem}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Kegiatan
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Masukkan nama kegiatan"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoComplete="off"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                    Tambah Kegiatan
                  </button>
                </div>
              </form>
            </div>

            {/* Form Tambah Penanggungjawab */}
            <div>
              <h4 className="text-lg font-medium text-gray-700 mb-4">
                Tambah Penanggungjawab
              </h4>
              <form onSubmit={createCol}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pilih Pengguna
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Pilih pengguna...</option>
                      {availableUsers
                        .filter(
                          (user) =>
                            user.role !== "superadmin" &&
                            !cols.some((col) => col.user_id === user.id)
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} - {user.position} ({user.unit})
                          </option>
                        ))}
                    </select>
                    {availableUsers.filter(
                      (user) =>
                        user.role !== "superadmin" &&
                        !cols.some((col) => col.user_id === user.id)
                    ).length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        Semua pengguna sudah ditambahkan sebagai penanggungjawab
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={
                      availableUsers.filter(
                        (user) =>
                          user.role !== "superadmin" &&
                          !cols.some((col) => col.user_id === user.id)
                      ).length === 0
                    }
                    className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md">
                    Tambah Penanggungjawab
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* List Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daftar Kegiatan */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Daftar Kegiatan ({items.length})
            </h3>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  {editingId === item.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-3 py-1 border border-gray-300 rounded-md"
                        autoComplete="off"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateItem(item.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-800">{item.name}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditingName(item.name);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm">
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">
                          Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Daftar Penanggungjawab */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Daftar Penanggungjawab ({cols.length})
            </h3>
            <div className="space-y-3">
              {cols.map((col) => (
                <div
                  key={col.id}
                  className="border border-gray-200 rounded-lg p-3">
                  {editingColId === col.id ? (
                    <div className="space-y-3">
                      <select
                        value={editingColName}
                        onChange={(e) => setEditingColName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option value="">Pilih pengguna...</option>
                        {availableUsers
                          .filter(
                            (user) =>
                              user.id === col.user_id || // Include current user
                              !cols.some(
                                (otherCol) => otherCol.user_id === user.id
                              ) // Exclude other assigned users
                          )
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.name} - {user.position} ({user.unit})
                            </option>
                          ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateCol(col.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingColId(null)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm">
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2">
                        <strong className="text-gray-800">
                          {col.user_name || col.name}
                        </strong>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {col.user_position && (
                          <span>Posisi: {col.user_position}</span>
                        )}
                        {col.user_unit && <span> | Unit: {col.user_unit}</span>}
                      </div>
                      {col.user_email && (
                        <div className="text-sm text-gray-500">
                          Email: {col.user_email}
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setEditingColId(col.id);
                            setEditingColName(col.user_id || col.name);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm">
                          Edit
                        </button>
                        <button
                          onClick={() => deleteCol(col.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm">
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
      </div>

      {/* Form Assignment SOP - Full Width Table */}
      {items.length > 0 && cols.length > 0 && (
        <div className="w-full bg-white shadow-md mt-8">
          <div className="px-4 sm:px-6 lg:px-8 py-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6">
              Kelola Penanggungjawab Kegiatan
            </h3>

            <form onSubmit={saveSops}>
              <div className="overflow-x-auto w-full h-96 overflow-y-auto rounded-lg border border-gray-200">
                <table className="w-full table-fixed h-full text-sm">
                  <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
                    <tr className="h-12">
                      <th className="w-16 px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        No
                      </th>
                      <th className="w-64 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Nama Kegiatan
                      </th>
                      <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Penanggungjawab
                      </th>
                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kembali ke Kegiatan
                      </th>
                      <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Kelengkapan <span className="text-red-600">*</span>
                      </th>
                      <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Waktu <span className="text-red-600">*</span>
                      </th>
                      <th className="w-40 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Output <span className="text-red-600">*</span>
                      </th>
                      <th className="w-48 px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Keterangan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item, index) => {
                      // Get current assignment from database
                      const assignment = getCurrentAssignment(item.id);
                      const {
                        colId,
                        status,
                        returnToItemId,
                        kelengkapan,
                        waktu,
                        waktu_value: waktuValue,
                        waktu_unit: waktuUnit,
                        output,
                        keterangan,
                      } = assignment;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 h-12 odd:bg-white even:bg-gray-50/50">
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap overflow-hidden">
                            <div
                              className="truncate max-w-[16rem]"
                              title={item.name}>
                              {item.name}
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={colId}
                              onChange={(e) => {
                                const newColId = e.target.value;
                                if (newColId) {
                                  const parsedNewColId = parseInt(newColId);
                                  // Default status: activity #1 -> Mulai, others -> Proses
                                  let defaultStatus =
                                    status && status !== ""
                                      ? status
                                      : index === 0
                                      ? "Mulai"
                                      : "Proses";
                                  // Ensure uniqueness: if Mulai already owned by other row, fallback to Proses
                                  if (
                                    defaultStatus === "Mulai" &&
                                    currentMulaiKey &&
                                    currentMulaiKey !==
                                      `${item.id}-${parsedNewColId}`
                                  ) {
                                    defaultStatus = "Proses";
                                  }

                                  handleSopChange(
                                    item.id,
                                    parsedNewColId,
                                    defaultStatus,
                                    defaultStatus === "Pilihan"
                                      ? returnToItemId
                                        ? parseInt(returnToItemId)
                                        : null
                                      : null,
                                    kelengkapan,
                                    waktu,
                                    output,
                                    keterangan,
                                    waktuValue,
                                    waktuUnit
                                  );
                                } else {
                                  // Clear assignment
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
                              }}
                              className="w-full px-2 py-2 h-10 border border-gray-300 rounded-md text-sm flex items-center leading-6">
                              <option value="">Pilih penanggungjawab</option>
                              {cols.map((col) => (
                                <option key={col.id} value={col.id}>
                                  {col.user_name ||
                                    col.name ||
                                    `Person ${col.id}`}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-3">
                            <select
                              value={status}
                              onChange={(e) => {
                                if (colId) {
                                  const newStatus = e.target.value;
                                  handleSopChange(
                                    item.id,
                                    parseInt(colId),
                                    newStatus,
                                    newStatus === "Pilihan"
                                      ? returnToItemId
                                        ? parseInt(returnToItemId)
                                        : null
                                      : null,
                                    kelengkapan,
                                    waktu,
                                    output,
                                    keterangan,
                                    waktuValue,
                                    waktuUnit
                                  );
                                } else {
                                  alert(
                                    "Pilih penanggungjawab terlebih dahulu!"
                                  );
                                }
                              }}
                              disabled={!colId}
                              className="w-full px-2 py-2 h-10 border border-gray-300 rounded-md text-sm flex items-center leading-6 disabled:bg-gray-100">
                              <option value="">Pilih status</option>
                              <option
                                value="Mulai"
                                disabled={
                                  !!currentMulaiKey &&
                                  currentMulaiKey !== `${item.id}-${colId}`
                                }>
                                Mulai
                              </option>
                              <option value="Proses">Proses</option>
                              <option value="Pilihan">Pilihan</option>
                              <option
                                value="Selesai"
                                disabled={
                                  !!currentSelesaiKey &&
                                  currentSelesaiKey !== `${item.id}-${colId}`
                                }>
                                Selesai
                              </option>
                            </select>
                          </td>
                          {/* Kembali ke Kegiatan */}
                          <td className="px-3 py-3">
                            <select
                              value={returnToItemId}
                              onChange={(e) => {
                                const returnId = e.target.value
                                  ? parseInt(e.target.value)
                                  : null;
                                if (colId && status) {
                                  handleSopChange(
                                    item.id,
                                    parseInt(colId),
                                    status,
                                    returnId,
                                    kelengkapan,
                                    waktu,
                                    output,
                                    keterangan,
                                    waktuValue,
                                    waktuUnit
                                  );
                                }
                              }}
                              disabled={!colId || status !== "Pilihan"}
                              className="w-full px-2 py-2 h-10 border border-gray-300 rounded-md text-sm flex items-center leading-6 disabled:bg-gray-100">
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
                          {/* Kelengkapan */}
                          <td className="px-3 py-3 whitespace-nowrap overflow-hidden">
                            <input
                              type="text"
                              value={kelengkapan}
                              onChange={(e) => {
                                if (colId) {
                                  handleSopChange(
                                    item.id,
                                    parseInt(colId),
                                    status,
                                    returnToItemId
                                      ? parseInt(returnToItemId)
                                      : null,
                                    e.target.value,
                                    waktu,
                                    output,
                                    keterangan,
                                    waktuValue,
                                    waktuUnit
                                  );
                                }
                              }}
                              placeholder="Kelengkapan"
                              disabled={!colId}
                              className="w-full px-2 py-2 h-10 border border-gray-300 rounded-md text-sm flex items-center leading-6 disabled:bg-gray-100 truncate"
                              autoComplete="off"
                              title={kelengkapan || ""}
                            />
                          </td>
                          {/* Waktu (angka + unit) */}
                          <td className="px-3 py-3 align-middle">
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={waktuValue}
                                onChange={(e) => {
                                  if (colId) {
                                    const newVal = e.target.value;
                                    handleSopChange(
                                      item.id,
                                      parseInt(colId),
                                      status,
                                      returnToItemId
                                        ? parseInt(returnToItemId)
                                        : null,
                                      kelengkapan,
                                      waktu,
                                      output,
                                      keterangan,
                                      newVal,
                                      waktuUnit
                                    );
                                  }
                                }}
                                placeholder="0"
                                disabled={!colId}
                                className="w-20 px-2 py-2 h-10 border border-gray-300 rounded-md text-sm disabled:bg-gray-100"
                                autoComplete="off"
                              />
                              <select
                                value={waktuUnit}
                                onChange={(e) => {
                                  if (colId) {
                                    const newUnit = e.target.value;
                                    handleSopChange(
                                      item.id,
                                      parseInt(colId),
                                      status,
                                      returnToItemId
                                        ? parseInt(returnToItemId)
                                        : null,
                                      kelengkapan,
                                      waktu,
                                      output,
                                      keterangan,
                                      waktuValue,
                                      newUnit
                                    );
                                  }
                                }}
                                disabled={!colId}
                                className="w-24 px-2 py-2 h-10 border border-gray-300 rounded-md text-sm disabled:bg-gray-100">
                                {TIME_UNITS.map((u) => (
                                  <option key={u} value={u}>
                                    {u.charAt(0).toUpperCase() + u.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>
                          {/* Output */}
                          <td className="px-3 py-3 whitespace-nowrap overflow-hidden">
                            <input
                              type="text"
                              value={output}
                              onChange={(e) => {
                                if (colId) {
                                  handleSopChange(
                                    item.id,
                                    parseInt(colId),
                                    status,
                                    returnToItemId
                                      ? parseInt(returnToItemId)
                                      : null,
                                    kelengkapan,
                                    waktu,
                                    e.target.value,
                                    keterangan,
                                    waktuValue,
                                    waktuUnit
                                  );
                                }
                              }}
                              placeholder="Output"
                              disabled={!colId}
                              className="w-full px-2 py-2 h-10 border border-gray-300 rounded-md text-sm flex items-center leading-6 disabled:bg-gray-100 truncate"
                              autoComplete="off"
                              title={output || ""}
                            />
                          </td>
                          {/* Keterangan */}
                          <td className="px-3 py-3 whitespace-nowrap overflow-hidden">
                            <input
                              type="text"
                              value={keterangan}
                              onChange={(e) => {
                                if (colId) {
                                  handleSopChange(
                                    item.id,
                                    parseInt(colId),
                                    status,
                                    returnToItemId
                                      ? parseInt(returnToItemId)
                                      : null,
                                    kelengkapan,
                                    waktu,
                                    output,
                                    e.target.value,
                                    waktuValue,
                                    waktuUnit
                                  );
                                }
                              }}
                              placeholder="Keterangan"
                              disabled={!colId}
                              className="w-full px-2 py-2 h-10 border border-gray-300 rounded-md text-sm flex items-center leading-6 disabled:bg-gray-100 truncate"
                              autoComplete="off"
                              title={keterangan || ""}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={clearAllSops}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md">
                  Hapus Semua Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageSOPVizPage;
