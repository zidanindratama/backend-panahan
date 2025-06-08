const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  judul: {
    type: String,
    required: true,
  },
  deskripsi: {
    type: String,
    required: true,
  },
  isi: {
    type: String,
    required: true,
  },
  penulis: {
    type: String,
    required: true,
  },
  foto: {
    type: String,
  },
  tanggal: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Blog", blogSchema);
