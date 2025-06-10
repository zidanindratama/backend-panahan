const mongoose = require("mongoose");

const kontakSchema = new mongoose.Schema({
  instagram: {
    type: String,
    required: true,
  },
  whatsapp: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Kontak", kontakSchema);
