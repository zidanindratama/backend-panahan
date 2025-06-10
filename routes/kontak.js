// routes/kontak.js
const express = require("express");
const router = express.Router();
const Kontak = require("../models/kontak");

// GET semua kontak (biasanya hanya 1)
router.get("/", async (req, res) => {
  const kontak = await Kontak.findOne(); // Ambil satu data
  res.json(kontak);
});

// POST atau UPDATE kontak
router.post("/", async (req, res) => {
  const { instagram, whatsapp } = req.body;
  let kontak = await Kontak.findOne();

  if (kontak) {
    // update
    kontak.instagram = instagram;
    kontak.whatsapp = whatsapp;
    await kontak.save();
  } else {
    // buat baru
    kontak = await Kontak.create({ instagram, whatsapp });
  }

  res.json(kontak);
});

module.exports = router;
