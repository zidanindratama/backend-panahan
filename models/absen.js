const mongoose = require('mongoose');

const absenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  waktu: { type: Date, default: Date.now },
  keterangan: { type: String, default: 'hadir' }
});

module.exports = mongoose.model('Absen', absenSchema);
