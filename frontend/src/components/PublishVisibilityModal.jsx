import { useState, useEffect } from "react";

const PublishVisibilityModal = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const [visibility, setVisibility] = useState("everyone");

  useEffect(() => {
    if (isOpen) setVisibility("everyone");
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 lg:w-1/3 p-6">
        <h3 className="text-lg font-semibold mb-4">
          Pilih Visibilitas Publikasi
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Tentukan siapa yang dapat melihat SOP ini setelah dipublikasikan.
        </p>
        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              className="mt-1"
              name="visibility"
              value="everyone"
              checked={visibility === "everyone"}
              onChange={() => setVisibility("everyone")}
            />
            <div>
              <div className="font-medium">Semua Orang</div>
              <div className="text-xs text-gray-500">
                SOP bisa dilihat oleh semua orang.
              </div>
            </div>
          </label>
          <label className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              className="mt-1"
              name="visibility"
              value="unit"
              checked={visibility === "unit"}
              onChange={() => setVisibility("unit")}
            />
            <div>
              <div className="font-medium">Hanya Unit</div>
              <div className="text-xs text-gray-500">
                SOP hanya bisa dilihat oleh anggota unit terkait.
              </div>
            </div>
          </label>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border text-gray-700 hover:bg-gray-50"
            disabled={isLoading}>
            Batal
          </button>
          <button
            onClick={() => onConfirm(visibility)}
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}>
            {isLoading ? "Memproses..." : "Publikasikan"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublishVisibilityModal;
