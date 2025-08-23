// Import crypto-js untuk dekripsi
import crypto from "crypto-js";

/**
 * Function helper untuk mengambil user data dari sessionStorage
 * @returns {string|null} - Raw user data string dari sessionStorage
 */
export const getUserDataFromStorage = () => {
  try {
    // Prioritas utama dari sessionStorage (lebih aman dan sesuai implementasi login)
    return sessionStorage.getItem("user");
  } catch (error) {
    console.error("Error accessing sessionStorage:", error);
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
      console.warn("VITE_SECRET_KEY not found, returning original data");
      return encryptedData;
    }

    // Ambil secret key dari environment variable (gunakan sebagai string, sama seperti backend)
    const secretKey = import.meta.env.VITE_SECRET_KEY;

    // Split IV dan cipher text dari encrypted data
    const [ivHex, cipherText] = encryptedData.split(":");

    // Validasi bahwa kedua bagian ada dan memiliki panjang yang wajar
    if (!ivHex || !cipherText || ivHex.length < 16 || cipherText.length < 8) {
      console.warn("Invalid encrypted data format, returning original");
      return encryptedData;
    }

    // Validasi format hex untuk IV
    if (!/^[0-9a-fA-F]+$/.test(ivHex)) {
      console.warn("Invalid IV format, returning original");
      return encryptedData;
    }

    // Parse IV dari hex string
    const iv = crypto.enc.Hex.parse(ivHex);

    // Decrypt menggunakan AES
    const bytes = crypto.AES.decrypt(cipherText, secretKey, { iv });

    // Validasi hasil dekripsi sebelum konversi ke UTF-8
    if (bytes.sigBytes <= 0) {
      console.warn("Decryption resulted in empty data, returning original");
      return encryptedData;
    }

    // Convert bytes hasil dekripsi ke string UTF-8
    const decryptedText = bytes.toString(crypto.enc.Utf8);

    // Validasi hasil dekripsi tidak kosong
    if (!decryptedText || decryptedText.trim() === "") {
      console.warn("Decryption resulted in empty string, returning original");
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

    return {
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

    console.log("User data encrypted successfully");
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
    console.log("Corrupted user data cleared from sessionStorage");

    // Re-enable auto-redirect after fixing encryption compatibility
    if (typeof window !== "undefined" && window.location) {
      console.log("Redirecting to login due to corrupted data...");
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
      console.error("No current user data found in storage");
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

    console.log("Merging user data:", {
      currentUser,
      updatedData,
      mergedUserData,
    });

    // Enkripsi data yang sudah dimerge
    const encryptedUserData = encryptUserData(mergedUserData);

    // Simpan kembali ke sessionStorage
    sessionStorage.setItem("user", JSON.stringify(encryptedUserData));

    console.log("User data updated and encrypted in sessionStorage");
    return true;
  } catch (error) {
    console.error("Error updating user data in storage:", error);
    return false;
  }
};

/**
 * Function untuk debug dan inspect user data di sessionStorage
 */
export const debugUserData = () => {
  try {
    console.log("=== DEBUG USER DATA ===");
    const userStr = getUserDataFromStorage();
    console.log("Raw user data in sessionStorage:", userStr);

    if (userStr) {
      const userData = JSON.parse(userStr);

      // Test dekripsi untuk setiap field
      if (userData.email?.includes(":")) {
        console.log("Testing decryption:");
        console.log("- Email decrypt result:", decryptData(userData.email));
        if (userData.name?.includes(":")) {
          console.log("- Name decrypt result:", decryptData(userData.name));
        }
        if (userData.role?.includes(":")) {
          console.log("- Role decrypt result:", decryptData(userData.role));
        }
      } else {
        console.log("Data appears to be non-encrypted");
      }

      // Test getSafeUserData
      console.log("getSafeUserData result:", getSafeUserData());
    }

    // Check environment
    console.log(
      "VITE_SECRET_KEY available:",
      !!import.meta.env.VITE_SECRET_KEY
    );
    console.log(
      "VITE_SECRET_KEY length:",
      import.meta.env.VITE_SECRET_KEY?.length
    );

    console.log("=== END DEBUG ===");
  } catch (error) {
    console.error("Error debugging user data:", error);
  }
};

/**
 * Function untuk safely get user data tanpa auto-redirect dan auto-clear
 * @returns {Object|null} - User data atau null jika tidak ada/corrupted
 */
export const getSafeUserDataNoRedirect = () => {
  try {
    const userStr = getUserDataFromStorage();
    if (!userStr) return null;

    const userData = JSON.parse(userStr);
    if (!userData) return null;

    // Cek apakah data sudah dalam format yang benar
    if (!userData.email) {
      console.warn("Invalid user data structure");
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
          console.warn(
            "Decryption test failed, but keeping data for manual intervention"
          );
          console.warn(
            "Use window.clearCorruptedDataSilent() to clear manually if needed"
          );

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
        console.warn("Keeping data for manual troubleshooting");

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
      console.log("Detected plain text data, using as-is");
      // Data sudah plain text (sudah didekripsi sebelumnya), return as is
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
      console.warn("Invalid user data structure, clearing localStorage");
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
        console.warn("Decryption test failed, data appears corrupted");
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
        console.warn("Full decryption failed, clearing localStorage");
        clearCorruptedUserData();
        return null;
      }

      return decryptedUser;
    } else {
      console.log("Detected non-encrypted data, using as-is");
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

// Export ke window untuk debugging dari console (setelah semua function didefinisikan)
if (typeof window !== "undefined") {
  window.debugUserData = debugUserData;
  window.clearCorruptedUserData = clearCorruptedUserData;
  window.getSafeUserData = getSafeUserData;
  window.updateUserDataInStorage = updateUserDataInStorage;

  // Function untuk debug data flow dari login sampai storage
  window.debugDataFlow = () => {
    console.log("=== DATA FLOW DEBUG ===");

    // 1. Check sessionStorage content
    const rawStorage = sessionStorage.getItem("user");
    console.log("1. Raw sessionStorage content:", rawStorage);

    if (rawStorage) {
      try {
        // 2. Parse data
        const parsed = JSON.parse(rawStorage);
        console.log("2. Parsed data:", parsed);

        // 3. Check if data is encrypted or plain text
        const isEncrypted =
          parsed.email &&
          typeof parsed.email === "string" &&
          parsed.email.includes(":");
        console.log("3. Is data encrypted?", isEncrypted);

        if (isEncrypted) {
          console.log("   Data contains encrypted fields");
          console.log("   Sample encrypted email:", parsed.email);
        } else {
          console.log("   Data is plain text");
          console.log("   Sample plain email:", parsed.email);
        }

        // 4. Test getSafeUserDataNoRedirect
        const safeData = getSafeUserDataNoRedirect();
        console.log("4. getSafeUserDataNoRedirect result:", safeData);
      } catch (e) {
        console.error("2. Parse error:", e);
      }
    } else {
      console.log("No user data in sessionStorage");
    }

    console.log("=== END DATA FLOW DEBUG ===");
  };
  window.testSecretKey = () => {
    const key = import.meta.env.VITE_SECRET_KEY;
    console.log("Frontend SECRET_KEY:", key);
    console.log("Key length:", key?.length);

    // Test enkripsi/dekripsi
    const testData = "test@example.com";
    const encrypted = encryptData(testData);
    const decrypted = decryptData(encrypted);

    console.log("Test data:", testData);
    console.log("Encrypted:", encrypted);
    console.log("Decrypted:", decrypted);
    console.log("Round-trip success:", testData === decrypted);
  };

  // Function untuk check apakah backend dan frontend key cocok
  window.checkBackendKeyCompatibility = () => {
    const userData = getUserDataFromStorage();
    if (!userData) {
      console.log("No user data in storage to test");
      return;
    }

    try {
      const parsed = JSON.parse(userData);
      console.log("Current user data structure:", parsed);

      if (parsed.email?.includes(":")) {
        console.log("Data appears encrypted, testing decryption...");
        const decrypted = decryptData(parsed.email);
        console.log("Decryption result:", decrypted);
        console.log(
          "Success:",
          !decrypted.includes(":") && decrypted !== parsed.email
        );
      } else {
        console.log("Data appears to be plain text");
      }
    } catch (e) {
      console.error("Error parsing user data:", e);
    }
  };

  // Function untuk clear data corrupted tanpa redirect
  window.clearCorruptedDataSilent = () => {
    try {
      sessionStorage.removeItem("user");
      console.log("Corrupted user data cleared silently from sessionStorage");
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
    }
  };

  // Manual clear function tanpa redirect
  window.manualClearUserData = () => {
    try {
      sessionStorage.removeItem("user");
      console.log("User data manually cleared from sessionStorage");
    } catch (error) {
      console.error("Error manually clearing sessionStorage:", error);
    }
  };

  // Force refresh function
  window.forceRefresh = () => {
    window.location.reload();
  };

  // Test login function
  window.testLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const data = await response.json();
      console.log("Login test response:", data);

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User data saved to localStorage");
        window.debugUserData();
      }
    } catch (error) {
      console.error("Test login error:", error);
    }
  };

  // Test update user data function
  window.testUpdateUserData = () => {
    console.log("=== TEST UPDATE USER DATA ===");

    // Get current user data
    const currentUser = getSafeUserDataNoRedirect();
    console.log("1. Current user data:", currentUser);

    if (!currentUser) {
      console.log("No user data found, cannot test update");
      return;
    }

    // Test update with sample data
    const updateData = {
      name: "Updated Name Test",
      position: "Updated Position Test",
      unit: "Updated Unit Test",
    };

    console.log("2. Update data:", updateData);

    // Perform update
    const success = updateUserDataInStorage(updateData);
    console.log("3. Update success:", success);

    // Verify update
    const updatedUser = getSafeUserDataNoRedirect();
    console.log("4. Updated user data:", updatedUser);

    console.log("=== END TEST UPDATE ===");
  };
}
