import http from "http";
import app from "./app.js";
const PORT = 3000;
import { disconnectDB } from './db.js';

// Fungsi untuk menangani graceful shutdown
const startServer = async () => {
  const server = http.createServer(app()).listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });  

  // Graceful shutdown untuk menangani SIGINT (Ctrl+C) dan SIGTERM
  process.on('SIGINT', async () => {
    console.log('Menerima SIGINT, menutup aplikasi...');
    await disconnectDB(); // Menutup koneksi ke database
    server.close(() => {
      console.log('Server berhasil dimatikan');
      process.exit(0); // Keluar dari aplikasi
    });
  });

  process.on('SIGTERM', async () => {
    console.log('Menerima SIGTERM, menutup aplikasi...');
    await disconnectDB(); // Menutup koneksi ke database
    server.close(() => {
      console.log('Server berhasil dimatikan');
      process.exit(0); // Keluar dari aplikasi
    });
  });
};

startServer(); // Mulai server
