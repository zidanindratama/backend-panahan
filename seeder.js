const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/user");

dotenv.config();

const users = [];

for (let i = 1; i <= 10; i++) {
  users.push({
    namaLengkap: `Member ${i}`,
    nik: `32000${i.toString().padStart(4, "0")}`,
    tglLahir: new Date(2000, 0, i),
    noHp: `0812345678${i}`,
    username: `member${i}`,
    password: `password`,
    asal: `Asal ${i}`,
    alamat: `Alamat No.${i}`,
    isMember: true,
  });
}

async function seedMembers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Hash password semua user
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    await User.insertMany(hashedUsers);

    console.log("✅ 10 member berhasil ditambahkan");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Gagal menambahkan member:", err.message);
  }
}

seedMembers();
