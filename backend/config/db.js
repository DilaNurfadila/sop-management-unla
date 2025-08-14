// Import mysql2 dengan promise support untuk async/await
const mysql = require("mysql2/promise");
// Load environment variables dari .env file
require("dotenv").config();

/**
 * Konfigurasi dan pembuatan connection pool MySQL
 * Connection pool digunakan untuk mengelola multiple database connections secara efisien
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Host database dari environment variable
  user: process.env.DB_USER, // Username database dari environment variable
  password: process.env.DB_PASS, // Password database dari environment variable
  database: process.env.DB_NAME, // Nama database dari environment variable
  waitForConnections: true, // Wait untuk connection jika pool penuh
  connectionLimit: 10, // Maksimal 10 connection concurrent
  queueLimit: 0, // Unlimited queue untuk waiting connections
});

/**
 * Test koneksi database saat aplikasi start
 * Mengambil satu connection untuk test kemudian release kembali ke pool
 */
pool
  .getConnection()
  .then((connection) => {
    console.log("Database connected successfully");
    // Release connection kembali ke pool setelah test berhasil
    connection.release();
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });

// Export pool untuk digunakan di models
module.exports = pool;
