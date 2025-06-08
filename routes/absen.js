const express = require("express");
const router = express.Router();
const Absen = require("../models/absen");
const User = require("../models/user");
const { verifyToken, isAdmin } = require("../middleware/auth");

// ✅ POST /api/absensi
router.post("/absensi", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Validasi: harus user dan sudah jadi member
    if (!user || !user.isMember) {
      return res
        .status(403)
        .json({ message: "Hanya member aktif yang dapat absen" });
    }

    // Ambil waktu sekarang (langsung waktu lokal server)
    const now = new Date();

    // ✅ Validasi hanya hari Minggu (0)
    if (now.getDay() !== 0) {
      return res
        .status(400)
        .json({ message: "Absensi hanya dibuka setiap hari Minggu" });
    }

    // ✅ Validasi waktu 08:30 – 12:00
    const totalMenit = now.getHours() * 60 + now.getMinutes();
    const batasAwal = 8 * 60 + 30;
    const batasAkhir = 12 * 60;

    if (totalMenit < batasAwal || totalMenit > batasAkhir) {
      return res
        .status(400)
        .json({ message: "Waktu absensi hanya antara 08:30 hingga 12:00 WIB" });
    }

    // ✅ Cek apakah user sudah absen hari ini
    const awalHari = new Date(now);
    awalHari.setHours(0, 0, 0, 0);

    const akhirHari = new Date(now);
    akhirHari.setHours(23, 59, 59, 999);

    const sudahAbsen = await Absen.findOne({
      user: user._id,
      waktu: { $gte: awalHari, $lte: akhirHari },
    });

    if (sudahAbsen) {
      return res.status(400).json({ message: "Anda sudah absen hari ini" });
    }

    // ✅ Simpan data absen
    const absen = new Absen({ user: user._id, keterangan: "hadir" });
    await absen.save();

    res.status(201).json({ message: "Absensi berhasil dicatat", absen });
  } catch (err) {
    console.error("[ABSEN ERROR]", err);
    res
      .status(500)
      .json({ message: "Gagal melakukan absensi", error: err.message });
  }
});

// ✅ GET /api/absensi/cek
router.get("/absensi/cek", verifyToken, async (req, res) => {
  try {
    const now = new Date();

    const awalHari = new Date(now);
    awalHari.setHours(0, 0, 0, 0);

    const akhirHari = new Date(now);
    akhirHari.setHours(23, 59, 59, 999);

    const absen = await Absen.findOne({
      user: req.user.id,
      waktu: { $gte: awalHari, $lte: akhirHari },
    });

    res.json({ sudahAbsen: !!absen });
  } catch (err) {
    console.error("[ABSEN CEK ERROR]", err);
    res.status(500).json({ message: "Gagal mengecek status absen" });
  }
});

// ✅ GET /api/absensi/riwayat
router.get("/absensi/riwayat", verifyToken, async (req, res) => {
  try {
    const { start, end, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { user: req.user.id };

    if (start && end) {
      query.waktu = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const [data, total] = await Promise.all([
      Absen.find(query).sort({ waktu: -1 }).skip(skip).limit(parseInt(limit)),
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
      message: "Gagal mengambil riwayat absen",
      error: err.message,
    });
  }
});

module.exports = router;
