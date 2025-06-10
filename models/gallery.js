const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema({
  judul: {
    type: String,
    required: true,
  },
  deskripsi: {
    type: String,
    required: false,
  },
  gambar: {
    type: String,
    required: true,
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Gallery", gallerySchema);
