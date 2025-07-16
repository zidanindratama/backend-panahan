const express = require("express");
const ExcelJS = require("exceljs");
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

// ✅ EXPORT SEMUA USER KE EXCEL
router.get("/export-users", verifyTokenAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password");

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "Nama Lengkap", key: "namaLengkap", width: 25 },
      { header: "Username", key: "username", width: 20 },
      { header: "Role", key: "role", width: 15 },
      { header: "NIK", key: "nik", width: 20 },
      { header: "Tanggal Lahir", key: "tglLahir", width: 20 },
      { header: "No HP", key: "noHp", width: 20 },
      { header: "Asal", key: "asal", width: 25 },
      { header: "Alamat", key: "alamat", width: 30 },
      { header: "Is Member", key: "isMember", width: 15 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        ...user.toObject(),
        tglLahir: new Date(user.tglLahir).toLocaleDateString(),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=daftar_users.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: "Gagal export data", error: err.message });
  }
});

// ✅ EXPORT ABSENSI KE EXCEL
router.get("/export-absensi", verifyTokenAdmin, async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = {};

    if (start && end) {
      query.waktu = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const absensi = await Absen.find(query).populate(
      "user",
      "namaLengkap username"
    );

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data Absensi");

    // Header
    worksheet.columns = [
      { header: "No", key: "no", width: 6 },
      { header: "Nama", key: "nama", width: 30 },
      { header: "Username", key: "username", width: 25 },
      { header: "Tanggal", key: "tanggal", width: 25 },
      { header: "Keterangan", key: "keterangan", width: 20 },
    ];

    // Isi Data
    absensi.forEach((item, index) => {
      worksheet.addRow({
        no: index + 1,
        nama: item.user?.namaLengkap || "-",
        username: item.user?.username || "-",
        tanggal: item.waktu.toLocaleString("id-ID"),
        keterangan: item.keterangan,
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=absensi.xlsx");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengekspor data absensi",
      error: err.message,
    });
  }
});

// ✅ Route untuk menghitung total admin, member, dan non-member
router.get("/stats", verifyTokenAdmin, async (req, res) => {
  try {
    const [totalAdmin, totalMember, totalNonMember] = await Promise.all([
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ isMember: true }),
      User.countDocuments({ isMember: false }),
    ]);

    res.json({
      totalAdmin,
      totalMember,
      totalNonMember,
    });
  } catch (err) {
    res.status(500).json({
      message: "Gagal mengambil statistik",
      error: err.message,
    });
  }
});

module.exports = router;
