// Import Firebase App initialization function
import { initializeApp } from "firebase/app";
// Import Firebase Storage service
import { getStorage } from "firebase/storage";

// Firebase configuration object menggunakan environment variables
// Konfigurasi ini aman karena menggunakan .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY, // API key untuk autentikasi
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, // Domain untuk Firebase Auth
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // Project ID Firebase
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, // Bucket untuk Firebase Storage
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, // Sender ID untuk messaging
  appId: import.meta.env.VITE_FIREBASE_APP_ID, // App ID unik Firebase
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, // ID untuk Google Analytics
};

// Initialize Firebase app dengan konfigurasi di atas
const app = initializeApp(firebaseConfig);

// Initialize Firebase Storage service untuk upload/download file
const storage = getStorage(app);

// Export storage object untuk digunakan di komponen lain
export { storage };
