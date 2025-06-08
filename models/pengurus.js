const mongoose = require("mongoose");

const pengurusSchema = new mongoose.Schema({
  nama: { type: String, required: true },
  jabatan: { type: String, required: true },
  foto: { type: String, required: true },
});

module.exports = mongoose.model("Pengurus", pengurusSchema);
