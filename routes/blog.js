const express = require("express");
const Blog = require("../models/blog");
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
const router = express.Router();

// ✅ GET semua berita (terbaru dulu)
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ tanggal: -1 });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET berita by ID
router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res.status(404).json({ message: "Berita tidak ditemukan" });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ POST berita baru + upload gambar
router.post("/", upload.single("foto"), async (req, res) => {
  try {
    const { judul, deskripsi, isi, penulis } = req.body;
    const foto = req.file?.path;

    const blog = new Blog({
      judul,
      deskripsi,
      isi,
      penulis,
      foto,
      tanggal: new Date(),
    });

    const savedBlog = await blog.save();
    res.status(201).json(savedBlog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ✅ PUT update berita + ganti gambar
router.put("/:id", upload.single("foto"), async (req, res) => {
  try {
    const update = req.body;

    if (req.file && req.file.path) {
      update.foto = req.file.path;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, update, {
      new: true,
    });

    if (!updatedBlog)
      return res.status(404).json({ message: "Berita tidak ditemukan" });

    res.json(updatedBlog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE berita
router.delete("/:id", async (req, res) => {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ message: "Berita berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ GET search + sort + paginasi
router.get("/search/all", async (req, res) => {
  try {
    const { q = "", sort = "desc", page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {
      judul: { $regex: q, $options: "i" },
    };

    const [data, total] = await Promise.all([
      Blog.find(query)
        .sort({ tanggal: sort === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Blog.countDocuments(query),
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

module.exports = router;
