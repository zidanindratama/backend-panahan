const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  namaLengkap: String,
  nik: String,
  tglLahir: Date,
  noHp: String,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  asal: String,
  alamat: String,
  role: { type: String, default: 'user' },
  fotoProfil: { type: String, default: '' },
  isMember: { type: Boolean, default: false } // ✅ dimasukkan ke dalam schema
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
