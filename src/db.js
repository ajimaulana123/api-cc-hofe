import mongoose from 'mongoose';

const connectDB = async () => {
  const DB_URI = 'mongodb://hofe_istrailthy:5c67cfd4cf5e27de6fbb443f12e55fec8b782d55@fhx2u.h.filess.io:27018/hofe_istrailthy'; // Ganti sesuai URI MongoDB

  try {
    await mongoose.connect(DB_URI);
    console.log('✔ MongoDB connected successfully');
  } catch (error) {
    console.error('✘ MongoDB connection error:', error.message);
    process.exit(1); // Berhenti jika gagal koneksi
  }
};

export default connectDB;
