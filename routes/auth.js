const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const { verifyToken } = require("../middleware/auth");

const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
const router = express.Router();

// ✅ REGISTER
router.post("/register", async (req, res) => {
  const { namaLengkap, nik, tglLahir, noHp, username, password, asal, alamat } =
    req.body;

  try {
    const userExist = await User.findOne({ username });
    if (userExist) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      namaLengkap,
      nik,
      tglLahir,
      noHp,
      username,
      password: hashed,
      asal,
      alamat,
    });

    await user.save();
    res.status(201).json({ message: "Registrasi berhasil" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ LOGIN (dengan role disertakan di token)
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({ message: "Username tidak ditemukan" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Password salah" });

    const token = jwt.sign(
      { id: user._id, role: user.role }, // ⬅️ role disertakan
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        namaLengkap: user.namaLengkap,
        role: user.role,
        fotoProfil: user.fotoProfil || "",
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ GET PROFIL USER
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Gagal mengambil data profil" });
  }
});

// ✅ UPDATE PROFIL USER + FOTO
router.put("/profile", verifyToken, upload.single("foto"), async (req, res) => {
  try {
    const update = req.body;

    if (req.file && req.file.path) {
      update.fotoProfil = req.file.path; // simpan URL cloudinary
    }

    const user = await User.findByIdAndUpdate(req.user.id, update, {
      new: true,
    }).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Gagal update profil",
      error: err.message,
    });
  }
});

// ✅ GANTI PASSWORD
router.put("/change-password", verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Password lama dan baru wajib diisi" });
  }

  try {
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Password lama salah" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password berhasil diubah" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Gagal mengganti password", error: err.message });
  }
});

// ✅ VERIFIKASI IDENTITAS UNTUK LUPA PASSWORD
router.post("/forgot-password/verify", async (req, res) => {
  const { nik, namaLengkap, tglLahir } = req.body;

  if (!nik || !namaLengkap || !tglLahir) {
    return res.status(400).json({ message: "Semua data wajib diisi" });
  }

  try {
    const tanggal = new Date(tglLahir);

    const user = await User.findOne({
      nik,
      namaLengkap,
      tglLahir: {
        $gte: new Date(tanggal.setHours(0, 0, 0, 0)),
        $lt: new Date(tanggal.setHours(23, 59, 59, 999)),
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Data tidak ditemukan" });
    }

    res.json({ userId: user._id });
  } catch (err) {
    console.log("❌ Error:", err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
});

// ✅ SET PASSWORD BARU SETELAH VERIFIKASI BERHASIL
router.put("/forgot-password/reset/:id", async (req, res) => {
  const { newPassword } = req.body;
  const { id } = req.params;

  if (!newPassword) {
    return res.status(400).json({ message: "Password baru wajib diisi" });
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashed },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.json({ message: "Password berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ message: "Gagal memperbarui password" });
  }
});

module.exports = router;
