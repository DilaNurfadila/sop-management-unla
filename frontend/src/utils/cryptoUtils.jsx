// Import crypto-js untuk dekripsi
import crypto from "crypto-js";

/**
 * Function helper untuk mengambil user data dari localStorage
 * @returns {string|null} - Raw user data string dari localStorage
 */
export const getUserDataFromStorage = () => {
  try {
    // Cek localStorage untuk userData (sesuai dengan implementasi login)
    const userData = localStorage.getItem("userData");
    if (userData) {
      return JSON.parse(userData);
    }

    // Fallback ke sessionStorage untuk kompatibilitas
    const sessionData = sessionStorage.getItem("user");
    if (sessionData) {
      return JSON.parse(sessionData);
    }

    return null;
  } catch (error) {
    console.error("Error accessing storage:", error);
    return null;
  }
};

/**
 * Function untuk dekripsi data yang dienkripsi dengan AES
 * @param {string} encryptedData - Data yang sudah dienkripsi dalam format "iv:encrypted"
 * @returns {string} - Data yang sudah didekripsi
 */
export const decryptData = (encryptedData) => {
  // Return original jika data kosong, null, atau tidak dalam format yang benar
  if (!encryptedData || typeof encryptedData !== "string") {
    return encryptedData || ""; // Return original atau empty string
  }

  // Jika data tidak mengandung ':', kemungkinan tidak terenkripsi
  if (!encryptedData.includes(":")) {
    return encryptedData; // Return original data
  }

  try {
    // Cek apakah VITE_SECRET_KEY tersedia
    if (!import.meta.env.VITE_SECRET_KEY) {
      return encryptedData;
    }

    // Ambil secret key dari environment variable (gunakan sebagai string, sama seperti backend)
    const secretKey = import.meta.env.VITE_SECRET_KEY;

    // Split IV dan cipher text dari encrypted data
    const [ivHex, cipherText] = encryptedData.split(":");

    // Validasi bahwa kedua bagian ada dan memiliki panjang yang wajar
    if (!ivHex || !cipherText || ivHex.length < 16 || cipherText.length < 8) {
      return encryptedData;
    }

    // Validasi format hex untuk IV
    if (!/^[0-9a-fA-F]+$/.test(ivHex)) {
      return encryptedData;
    }

    // Parse IV dari hex string
    const iv = crypto.enc.Hex.parse(ivHex);

    // Decrypt menggunakan AES
    const bytes = crypto.AES.decrypt(cipherText, secretKey, { iv });

    // Validasi hasil dekripsi sebelum konversi ke UTF-8
    if (bytes.sigBytes <= 0) {
      return encryptedData;
    }

    // Convert bytes hasil dekripsi ke string UTF-8
    const decryptedText = bytes.toString(crypto.enc.Utf8);

    // Validasi hasil dekripsi tidak kosong
    if (!decryptedText || decryptedText.trim() === "") {
      return encryptedData;
    }

    return decryptedText;
  } catch (error) {
    console.warn("Decryption failed, returning original data:", error.message);
    return encryptedData; // Return original jika dekripsi gagal
  }
};

/**
 * Function untuk dekripsi semua data user yang diterima dari backend
 * @param {Object} encryptedUser - Object user dengan data yang dienkripsi
 * @returns {Object} - Object user dengan data yang sudah didekripsi
 */
export const decryptUserData = (encryptedUser) => {
  if (!encryptedUser || typeof encryptedUser !== "object") return null;

  try {
    // Helper function untuk safely decrypt field
    const safeDecrypt = (field) => {
      if (!field) return "";
      const decrypted = decryptData(field);
      return decrypted || field || "";
    };

    const result = {
      id: encryptedUser.id, // ID tidak perlu dekripsi
      email: safeDecrypt(encryptedUser.email),
      name: safeDecrypt(encryptedUser.name),
      role: safeDecrypt(encryptedUser.role),
      unit: safeDecrypt(encryptedUser.unit),
      position: safeDecrypt(encryptedUser.position),
      // Tambahkan fields lain yang mungkin ada
      photo: encryptedUser.photo || null,
      created_at: encryptedUser.created_at,
      updated_at: encryptedUser.updated_at,
    };
    // Optional: unit_name if provided by backend /auth/me
    if (encryptedUser.unit_name) {
      result.unit_name = safeDecrypt(encryptedUser.unit_name);
    }
    return result;
  } catch (error) {
    console.error("User data decryption error:", error);
    // Return original dengan fallback values
    return {
      id: encryptedUser.id || null,
      email: encryptedUser.email || "",
      name: encryptedUser.name || "",
      role: encryptedUser.role || "",
      unit: encryptedUser.unit || "",
      position: encryptedUser.position || "",
      photo: encryptedUser.photo || null,
      created_at: encryptedUser.created_at,
      updated_at: encryptedUser.updated_at,
    };
  }
};

/**
 * Function untuk mengenkripsi data (jika diperlukan di frontend)
 * @param {string} data - Data yang akan dienkripsi
 * @returns {string} - Data yang sudah dienkripsi dalam format "iv:encrypted"
 */
export const encryptData = (data) => {
  try {
    const secretKey = import.meta.env.VITE_SECRET_KEY;
    const iv = crypto.lib.WordArray.random(16);

    const encrypted = crypto.AES.encrypt(data, secretKey, {
      mode: crypto.mode.CBC,
      iv: iv,
    }).toString();

    return iv.toString(crypto.enc.Hex) + ":" + encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return data;
  }
};

/**
 * Function untuk mengenkripsi user data object sebelum disimpan ke sessionStorage
 * @param {Object} userData - Object user data yang akan dienkripsi
 * @returns {Object} - Object user dengan field yang sudah dienkripsi
 */
export const encryptUserData = (userData) => {
  if (!userData || typeof userData !== "object") return userData;

  try {
    // Helper function untuk safely encrypt field
    const safeEncrypt = (field) => {
      if (!field) return "";
      return encryptData(String(field));
    };

    // Enkripsi field-field sensitive
    const encryptedUser = {
      id: userData.id, // ID tidak perlu dienkripsi (non-sensitive)
      email: safeEncrypt(userData.email),
      name: safeEncrypt(userData.name),
      role: safeEncrypt(userData.role),
      unit: safeEncrypt(userData.unit), // Menggunakan 'unit' bukan 'division'
      position: safeEncrypt(userData.position),
      phone: safeEncrypt(userData.phone),
      created_at: userData.created_at, // Timestamps tidak perlu dienkripsi
      updated_at: userData.updated_at,
    };

    return encryptedUser;
  } catch (error) {
    console.error("Failed to encrypt user data:", error);
    return userData; // Return original jika enkripsi gagal
  }
};

/**
 * Function untuk memvalidasi apakah data sudah terenkripsi
 * @param {string} data - Data yang akan divalidasi
 * @returns {boolean} - True jika data terenkripsi
 */
export const isEncrypted = (data) => {
  return (
    data &&
    typeof data === "string" &&
    data.includes(":") &&
    data.split(":").length === 2
  );
};

/**
 * Function untuk membersihkan sessionStorage dari data yang corrupted
 */
export const clearCorruptedUserData = () => {
  try {
    sessionStorage.removeItem("user");

    // Re-enable auto-redirect after fixing encryption compatibility
    if (typeof window !== "undefined" && window.location) {
      // Add small delay to ensure console log is visible
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
  } catch (error) {
    console.error("Error clearing sessionStorage:", error);
  }
};

/**
 * Function untuk update user data di sessionStorage dengan enkripsi
 * @param {Object} updatedData - Data user yang sudah diupdate
 * @returns {boolean} - True jika berhasil update
 */
export const updateUserDataInStorage = (updatedData) => {
  try {
    // Ambil data user saat ini dari sessionStorage
    const currentUser = getSafeUserDataNoRedirect();
    if (!currentUser) {
      return false;
    }

    // Merge data lama dengan data baru
    const mergedUserData = {
      ...currentUser,
      ...updatedData,
      // Preserve ID dan timestamps dari data lama
      id: currentUser.id,
      created_at: currentUser.created_at,
      updated_at: currentUser.updated_at,
    };

    // (debug log removed)

    // Enkripsi data yang sudah dimerge
    const encryptedUserData = encryptUserData(mergedUserData);

    // Simpan kembali ke sessionStorage
    sessionStorage.setItem("user", JSON.stringify(encryptedUserData));

    return true;
  } catch (error) {
    console.error("Error updating user data in storage:", error);
    return false;
  }
};

/**
 * Function untuk safely get user data tanpa auto-redirect dan auto-clear
 * @returns {Object|null} - User data atau null jika tidak ada/corrupted
 */
export const getSafeUserDataNoRedirect = () => {
  try {
    const userData = getUserDataFromStorage();
    if (!userData) return null;

    // userData sudah dalam bentuk object dari getUserDataFromStorage
    // Tidak perlu JSON.parse lagi

    // Cek apakah data sudah dalam format yang benar
    if (!userData.email) {
      return null;
    }

    // Coba detect apakah data terenkripsi atau tidak
    // Data terenkripsi akan berupa string dengan format "iv:encrypted"
    const isDataEncrypted =
      userData.email &&
      typeof userData.email === "string" &&
      userData.email.includes(":");

    if (isDataEncrypted) {
      try {
        // Test dekripsi pada email field dulu
        const testDecrypt = decryptData(userData.email);

        // Jika test dekripsi gagal, coba fallback tanpa hapus data dulu
        if (
          !testDecrypt ||
          testDecrypt === userData.email ||
          testDecrypt.includes(":")
        ) {
          // Return data mentah untuk troubleshooting (jangan hapus otomatis)
          return {
            id: userData.id || null,
            email: userData.email || "Encrypted data (decryption failed)",
            name: userData.name || "Encrypted data (decryption failed)",
            role: userData.role || "Unknown",
            unit: userData.unit || "Unknown",
            position: userData.position || "Unknown",
            _encrypted: true,
            _needsDecryption: true,
          };
        }

        // Jika test berhasil, lakukan dekripsi penuh
        const decryptedUser = decryptUserData(userData);

        return decryptedUser;
      } catch (decryptError) {
        console.error("Decryption error:", decryptError);
        // Return fallback data tanpa hapus sessionStorage
        return {
          id: userData.id || null,
          email: "Decryption error occurred",
          name: "Decryption error occurred",
          role: "Unknown",
          unit: "Unknown",
          position: "Unknown",
          _encrypted: true,
          _error: decryptError.message,
        };
      }
    } else {
      return {
        id: userData.id || null,
        email: userData.email || "",
        name: userData.name || "",
        role: userData.role || "",
        unit: userData.unit || "",
        position: userData.position || "",
        photo: userData.photo || null,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    // JANGAN hapus data otomatis, biarkan untuk debugging
    return null;
  }
};

/**
 * Function untuk safely get user data dari localStorage
 * @returns {Object|null} - User data atau null jika tidak ada/corrupted
 */
export const getSafeUserData = () => {
  try {
    const userStr = getUserDataFromStorage();
    if (!userStr) return null;

    const userData = JSON.parse(userStr);
    if (!userData) return null;

    // Cek apakah data sudah dalam format yang benar
    if (!userData.email) {
      clearCorruptedUserData();
      return null;
    }

    // Coba detect apakah data terenkripsi atau tidak
    const isDataEncrypted =
      userData.email &&
      typeof userData.email === "string" &&
      userData.email.includes(":");

    if (isDataEncrypted) {
      // Test dekripsi pada email field dulu
      const testDecrypt = decryptData(userData.email);

      // Jika hasil dekripsi masih mengandung ':', kemungkinan data corrupted
      if (testDecrypt && testDecrypt.includes(":")) {
        clearCorruptedUserData();
        return null;
      }

      // Jika test berhasil, lakukan dekripsi penuh
      const decryptedUser = decryptUserData(userData);

      // Validasi hasil dekripsi
      if (
        !decryptedUser ||
        !decryptedUser.email ||
        decryptedUser.email.includes(":")
      ) {
        clearCorruptedUserData();
        return null;
      }

      return decryptedUser;
    } else {
      // Data tidak terenkripsi, return as is dengan normalisasi
      return {
        id: userData.id || null,
        email: userData.email || "",
        name: userData.name || "",
        role: userData.role || "",
        unit: userData.unit || "",
        position: userData.position || "",
        photo: userData.photo || null,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
      };
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    clearCorruptedUserData();
    return null;
  }
};
