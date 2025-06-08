const express = require("express");
const Pengurus = require("../models/pengurus");
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });

const router = express.Router();

// GET semua pengurus (dengan search, filter jabatan, dan paginasi)
router.get("/", async (req, res) => {
  try {
    const {
      q = "", // keyword search nama
      jabatan = "", // filter jabatan
      page = 1, // halaman
      limit = 10, // jumlah per halaman
    } = req.query;

    const query = {
      nama: { $regex: q, $options: "i" }, // search by nama (case-insensitive)
    };

    if (jabatan) {
      query.jabatan = jabatan;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, totalItems] = await Promise.all([
      Pengurus.find(query).skip(skip).limit(parseInt(limit)),
      Pengurus.countDocuments(query),
    ]);

    res.json({
      data,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalItems / parseInt(limit)),
      totalItems,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//  GET semua pengurus tanpa paginasi (untuk dropdown atau listing lengkap)
router.get("/all", async (req, res) => {
  try {
    const { jabatan = "" } = req.query;

    const query = jabatan ? { jabatan } : {};
    const pengurus = await Pengurus.find(query).sort({ nama: 1 });

    res.json(pengurus);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET pengurus by ID
router.get("/:id", async (req, res) => {
  try {
    const data = await Pengurus.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST tambah pengurus
router.post("/", upload.single("foto"), async (req, res) => {
  try {
    const { nama, jabatan } = req.body;
    const foto = req.file?.path;

    const pengurus = new Pengurus({ nama, jabatan, foto });
    const saved = await pengurus.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update pengurus
router.put("/:id", upload.single("foto"), async (req, res) => {
  try {
    const update = {
      nama: req.body.nama,
      jabatan: req.body.jabatan,
    };
    if (req.file?.path) update.foto = req.file.path;

    const updated = await Pengurus.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Data tidak ditemukan" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE pengurus
router.delete("/:id", async (req, res) => {
  try {
    await Pengurus.findByIdAndDelete(req.params.id);
    res.json({ message: "Data berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
