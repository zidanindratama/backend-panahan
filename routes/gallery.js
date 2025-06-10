const express = require("express");
const router = express.Router();
const Gallery = require("../models/gallery");
const { storage } = require("../utils/cloudinary");
const multer = require("multer");
const upload = multer({ storage });

// ✅ GET semua galeri atau search + sort + paginasi
router.get("/", async (req, res) => {
  try {
    const { q = "", sort = "desc", page = 1, limit = 5 } = req.query;

    const isSearching = q || page || sort || limit;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      judul: { $regex: q, $options: "i" },
    };

    const [data, total] = await Promise.all([
      Gallery.find(isSearching ? query : {})
        .sort({ tanggal: sort === "asc" ? 1 : -1 })
        .skip(isSearching ? skip : 0)
        .limit(isSearching ? parseInt(limit) : 0),
      Gallery.countDocuments(isSearching ? query : {}),
    ]);

    res.json({
      data,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET galeri by ID
router.get("/:id", async (req, res) => {
  try {
    const item = await Gallery.findById(req.params.id);
    if (!item)
      return res.status(404).json({ message: "Gambar tidak ditemukan" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST galeri baru + upload gambar
router.post("/", upload.single("gambar"), async (req, res) => {
  try {
    const { judul, deskripsi } = req.body;
    const gambar = req.file?.path;

    const item = new Gallery({ judul, deskripsi, gambar });
    const saved = await item.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ PUT update galeri + ganti gambar
router.put("/:id", upload.single("gambar"), async (req, res) => {
  try {
    const update = {
      judul: req.body.judul,
      deskripsi: req.body.deskripsi,
    };

    if (req.file && req.file.path) {
      update.gambar = req.file.path;
    }

    const updated = await Gallery.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!updated)
      return res.status(404).json({ message: "Gambar tidak ditemukan" });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE galeri
router.delete("/:id", async (req, res) => {
  try {
    await Gallery.findByIdAndDelete(req.params.id);
    res.json({ message: "Gambar berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
