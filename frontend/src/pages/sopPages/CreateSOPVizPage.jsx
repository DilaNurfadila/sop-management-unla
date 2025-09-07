import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSop as createSopApi } from "../../services/flowchartApi.jsx";

function CreateSOPVizPage() {
  const [sopName, setSopName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createSop = async (e) => {
    e.preventDefault();
    if (!sopName) return;

    setLoading(true);
    try {
      const response = await createSopApi({ name: sopName });
      const data = response.data || response;
      alert("SOP baru berhasil dibuat!");
      navigate(`/sop/${data.id}/manage`);
    } catch (error) {
      console.error("Error creating SOP:", error);
      alert("Error creating SOP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h1>Buat SOP Baru</h1>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          ← Kembali
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={createSop} className="sop-form">
          <div className="form-group">
            <label htmlFor="sopName">Nama SOP</label>
            <input
              type="text"
              id="sopName"
              value={sopName}
              onChange={(e) => setSopName(e.target.value)}
              placeholder="Masukkan nama SOP"
              required
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={loading}>
              Batal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !sopName}>
              {loading ? "Membuat..." : "Buat SOP"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSOPVizPage;
