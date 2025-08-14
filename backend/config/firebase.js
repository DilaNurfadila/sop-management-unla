// Import functions yang diperlukan dari Firebase SDK
const initializeApp = require("firebase/app").initializeApp;
const {
  getStorage, // Untuk mendapatkan instance Firebase Storage
  ref, // Untuk membuat referensi ke file/folder di storage
  uploadBytes, // Untuk upload file sebagai byte array
  getDownloadURL, // Untuk mendapatkan URL download file
  listAll, // Untuk list semua file dalam folder
  getMetadata, // Untuk mendapatkan metadata file
  deleteObject, // Untuk menghapus file dari storage
} = require("firebase/storage");

// Load environment variables dari .env file
require("dotenv").config();

/**
 * Konfigurasi Firebase menggunakan environment variables
 * Semua credential disimpan di .env untuk keamanan
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Inisialisasi Firebase app dengan konfigurasi
const app = initializeApp(firebaseConfig);

// Mendapatkan instance Firebase Storage
const storage = getStorage(app);

/**
 * Export semua functions Firebase Storage yang diperlukan
 * Memudahkan import di file lain tanpa perlu import individual
 */
module.exports = {
  storage, // Instance Firebase Storage
  ref, // Function untuk membuat storage reference
  uploadBytes, // Function untuk upload file
  getDownloadURL, // Function untuk mendapatkan download URL
  listAll, // Function untuk list files
  getMetadata, // Function untuk mendapatkan metadata file
  deleteObject, // Function untuk menghapus file
};
