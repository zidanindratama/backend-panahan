require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const absenRoutes = require("./routes/absen");
const blogRoutes = require("./routes/blog");
const pengurusRoutes = require("./routes/pengurus");

const app = express();

// Middleware CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware JSON body-parser
app.use(express.json());

// Koneksi MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routing
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", absenRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/pengurus", pengurusRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.send("Server API aktif - Fatahillah Archery");
});

// Jalankan server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
