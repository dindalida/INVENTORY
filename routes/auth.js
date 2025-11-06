const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // pastikan path model benar

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // cek field
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Semua field harus diisi' });
    }

    // cek apakah user sudah ada
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // buat user baru
    const newUser = await User.create({ name, email, password: hashedPassword });

    // buat token JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      },
      token
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
