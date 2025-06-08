const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Absen = require("../models/absen");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Gabungan middleware admin
const verifyTokenAdmin = [verifyToken, isAdmin];

// ✅ Halaman dashboard admin
router.get("/dashboard", verifyTokenAdmin, (req, res) => {
  res.json({ message: "Selamat datang di halaman admin" });
});

// ✅ Ambil semua user (dengan pagination, search, tanpa password)
router.get("/users", verifyTokenAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const search = req.query.search?.toString() || "";
    const searchRegex = new RegExp(search, "i"); // case-insensitive

    const filter = {
      $or: [
        { username: searchRegex },
        { namaLengkap: searchRegex }, // opsional: cari di namaLengkap juga
      ],
    };

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      data: users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: err.message });
  }
});

// ✅ Angkat user jadi admin
router.put("/promote/:id", verifyTokenAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "admin" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json({ message: "Berhasil diangkat menjadi admin", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengangkat user", error: err.message });
  }
});

// ✅ Turunkan admin jadi user
router.put("/demote/:id", verifyTokenAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: "user" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });
    res.json({ message: "Admin berhasil diturunkan menjadi user", user });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menurunkan admin", error: err.message });
  }
});

// ✅ Toggle status member (aktif <-> non-member)
router.put("/toggle-member/:id", verifyTokenAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    user.isMember = !user.isMember;
    await user.save();

    res.json({
      message: `Status member ${user.namaLengkap} diubah menjadi ${
        user.isMember ? "Member" : "Non-Member"
      }`,
      user,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengubah status member", error: err.message });
  }
});

// ✅ Hapus user
router.delete("/users/:id", verifyTokenAdmin, async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "User tidak ditemukan" });
    res.json({ message: "User berhasil dihapus" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal menghapus user", error: err.message });
  }
});

// ✅ Ambil semua data absensi dengan pagination dan filter tanggal
router.get("/absensi", verifyTokenAdmin, async (req, res) => {
  try {
    const { start, end, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};

    if (start && end) {
      query.waktu = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const [data, total] = await Promise.all([
      Absen.find(query)
        .sort({ waktu: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "namaLengkap username"),
      Absen.countDocuments(query),
    ]);

    res.json({
      data,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      totalItems: total,
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil data absensi",
      error: err.message,
    });
  }
});

// ✅ Ambil riwayat absensi per user
router.get("/absensi/:userId", verifyTokenAdmin, async (req, res) => {
  try {
    const riwayat = await Absen.find({ user: req.params.userId }).sort({
      waktu: -1,
    });
    res.json(riwayat);
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil riwayat kehadiran",
      error: err.message,
    });
  }
});

module.exports = router;
