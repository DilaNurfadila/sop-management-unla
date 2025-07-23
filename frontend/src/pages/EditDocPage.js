import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoc, updateDoc } from "../services/api";
import { dateFormatterDB } from "../utils/dateFormatter";

const EditDocPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sop_code: "",
    sop_title: "",
    sop_value: "",
    organization: "",
    sop_created: "",
    sop_version: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchDoc = async () => {
      const response = await getDoc(id);
      if (response.error) {
        navigate("/docs", {
          state: {
            message: response.message,
            type: "error",
          },
        });
        return;
      }
      setFormData({
        sop_code: response.sop_code || "",
        sop_title: response.sop_title || "",
        sop_value: response.sop_value || "",
        organization: response.organization || "",
        sop_created: response.sop_created
          ? dateFormatterDB(response.sop_created)
          : "",
        sop_version: response.sop_version || "",
      });
    };
    fetchDoc();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    // Client-side validation
    if (!formData.sop_code || !formData.sop_title || !formData.organization) {
      setErrorMessage("Kode SOP, Judul SOP, dan Organisasi wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const formattedData = {
      ...formData,
      sop_created: formData.sop_created || null,
    };

    const response = await updateDoc(id, formattedData);
    if (response.error) {
      setErrorMessage(response.message);
      setIsSubmitting(false);
      return;
    }

    navigate("/docs", {
      state: {
        message: "Dokumen SOP berhasil diperbarui",
        type: "success",
      },
    });
    setIsSubmitting(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Edit Dokumen SOP</h2>
      {errorMessage && (
        <div className="mb-4 text-red-600 font-semibold">{errorMessage}</div>
      )}
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Kode SOP:</label>
          <input
            type="text"
            name="sop_code"
            value={formData.sop_code}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Judul SOP:</label>
          <input
            type="text"
            name="sop_title"
            value={formData.sop_title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Organisasi:</label>
          <input
            type="text"
            name="organization"
            value={formData.organization}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">
            Tanggal Pembuatan SOP:
          </label>
          <input
            type="date"
            name="sop_created"
            value={formData.sop_created}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Versi SOP:</label>
          <input
            type="text"
            name="sop_version"
            value={formData.sop_version}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Isi SOP:</label>
          <textarea
            name="sop_value"
            value={formData.sop_value}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md min-h-[100px]"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white ${
              isSubmitting
                ? "bg-blue-600 opacity-70"
                : "bg-blue-500 hover:bg-blue-600"
            }`}>
            {isSubmitting ? "Memperbarui..." : "Update"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/docs")}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditDocPage;
