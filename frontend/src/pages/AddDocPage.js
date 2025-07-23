import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDoc } from "../services/api";

const AddDocPage = () => {
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
  const navigate = useNavigate();

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

    // Format payload
    const formattedData = {
      ...formData,
      sop_created: formData.sop_created || null,
    };

    const response = await createDoc(formattedData);
    if (response.error) {
      setErrorMessage(response.message);
      setIsSubmitting(false);
      return;
    }

    navigate("/docs", {
      state: {
        message: "Dokumen SOP berhasil ditambahkan",
        type: "success",
      },
    });
    setIsSubmitting(false);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Tambah Dokumen SOP Baru</h2>
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
        <div className="flex gap-5">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-md text-white ${
              isSubmitting
                ? "bg-green-600 opacity-70"
                : "bg-green-500 hover:bg-green-600"
            }`}>
            {isSubmitting ? "Menyimpan..." : "Simpan"}
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

export default AddDocPage;
