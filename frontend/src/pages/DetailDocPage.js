import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDoc } from "../services/api";
import { dateFormatter } from "../utils/dateFormatter";

const EditDocPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sop_code: "",
    sop_title: "",
    sop_value: "",
    status: "",
    organization: "",
    sop_created: "",
    sop_version: "",
  });

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const doc = await getDoc(id);
        setFormData({
          sop_code: doc.sop_code,
          sop_title: doc.sop_title,
          sop_value: doc.sop_value,
          status: doc.status,
          organization: doc.organization,
          sop_created: dateFormatter(doc.sop_created),
          sop_version: doc.sop_version,
        });
      } catch (error) {
        navigate("/docs", {
          state: {
            message: "Gagal memuat data dokumen SOP",
            type: "error",
          },
        });
      }
    };
    fetchDoc();
  }, [id, navigate]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Detail Dokumen SOP</h2>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Kode SOP: {formData.sop_code}
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Judul SOP: {formData.sop_title}
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Organisasi: {formData.organization}
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Tanggal Pembuatan SOP: {formData.sop_created}
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">
          Versi SOP: {formData.sop_version}
        </label>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Isi SOP:</label>
        <p>{formData.sop_value}</p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate("/docs")}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md">
          Kembali
        </button>
      </div>
    </div>
  );
};

export default EditDocPage;
