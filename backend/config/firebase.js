// Import the functions you need from the SDKs you need
const initializeApp = require("firebase/app").initializeApp;
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject,
} = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyBK5vWAnlnxyEGPc1VPyH5zH3KYdzwr-8Q",
  authDomain: "sop-management-7280d.firebaseapp.com",
  projectId: "sop-management-7280d",
  storageBucket: "sop-management-7280d.firebasestorage.app",
  messagingSenderId: "270235719217",
  appId: "1:270235719217:web:73f0313f2404b6cc2ee710",
  measurementId: "G-RQ8Z6G5NKD",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

module.exports = {
  storage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject,
};
