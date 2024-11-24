import express from "express";
import morgan from "morgan";
import cors from "cors";
import bodyParser from "body-parser";
import newsRoutes from "./routes/newsRoutes.js";
import authRoutes from "./routes/authRoutes.js"
import connectDB from './db.js';

const app = express();

connectDB();

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/news", newsRoutes);
app.use("/api/auth", authRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});

export default app;
