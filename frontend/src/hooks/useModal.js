/**
 * Hook: useModal
 *
 * State helper untuk menampilkan/menutup modal.
 * Kontrak: () => { isOpen: boolean, open: fn, close: fn, toggle: fn }
 */
import { useState } from "react";

/**
 * Custom hook untuk mengelola state modal
 * Menyediakan fungsi confirm dan alert yang dapat digunakan seperti window.confirm/alert
 */
export const useModal = () => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    confirmText: "OK",
    cancelText: "Batal",
    showCancel: false,
    isLoading: false,
    onConfirm: null,
    onCancel: null,
  });

  // Fungsi untuk menampilkan konfirmasi (menggantikan window.confirm)
  const showConfirm = ({
    title,
    message,
    type = "warning",
    confirmText = "Ya",
    cancelText = "Batal",
    onConfirm,
    onCancel,
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel: true,
        isLoading: false,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          if (onCancel) onCancel();
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  // Fungsi untuk menampilkan alert (menggantikan window.alert)
  const showAlert = ({
    title,
    message,
    type = "info",
    confirmText = "OK",
    onConfirm,
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText: "Batal",
        showCancel: false,
        isLoading: false,
        onConfirm: () => {
          if (onConfirm) onConfirm();
          setModalState((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: null,
      });
    });
  };

  // Fungsi khusus untuk konfirmasi hapus
  // Fungsi konfirmasi dengan default type delete, tapi bisa override type/teks
  const showDeleteConfirm = ({
    title = "Konfirmasi Hapus",
    message,
    onConfirm,
    onCancel,
    type = "delete",
    confirmText = "Hapus",
    cancelText = "Batal",
  }) => {
    return showConfirm({
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm,
      onCancel,
    });
  };

  // Fungsi khusus untuk konfirmasi restore
  const showRestoreConfirm = ({
    title = "Konfirmasi Restore",
    message,
    onConfirm,
    onCancel,
  }) => {
    return showConfirm({
      title,
      message,
      type: "restore",
      confirmText: "Restore",
      cancelText: "Batal",
      onConfirm,
      onCancel,
    });
  };

  // Fungsi untuk menampilkan loading state
  const setLoading = (isLoading) => {
    setModalState((prev) => ({ ...prev, isLoading }));
  };

  // Fungsi untuk menutup modal
  const closeModal = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    modalState,
    showConfirm,
    showAlert,
    showDeleteConfirm,
    showRestoreConfirm,
    setLoading,
    closeModal,
  };
};
