const express = require('express');
const crypto = require('crypto');
const passport = require('passport');
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');

const router = express.Router();

// ─── REGISTER ──────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Plotësoni të gjitha fushat.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Fjalëkalimi duhet të ketë të paktën 6 karaktere.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Ky email është regjistruar tashmë.' });

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë regjistrimit.', error: err.message });
  }
});

// ─── LOGIN ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email dhe fjalëkalimi kërkohen.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password)
      return res.status(401).json({ message: 'Kredencialet janë të gabuara.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: 'Kredencialet janë të gabuara.' });

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë hyrjes.', error: err.message });
  }
});

// ─── ME ────────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  res.json({ user: req.user });
});

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'Nëse ky email ekziston, do merrni një email.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;
    await sendPasswordResetEmail({ to: email, resetLink });

    res.json({ message: 'Nëse ky email ekziston, do merrni udhëzimet për rivendosje.' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim i serverit.', error: err.message });
  }
});

// ─── RESET PASSWORD ────────────────────────────────────────────────────────
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Token i pavlefshëm ose ka skaduar.' });

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: 'Gabim i serverit.', error: err.message });
  }
});

// ─── GOOGLE OAUTH ──────────────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/login?error=oauth` }),
  (req, res) => {
    const token = signToken(req.user._id);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// ─── UPDATE PROFILE ────────────────────────────────────────────────────────
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë përditësimit.', error: err.message });
  }
});

// ─── CHANGE PASSWORD ───────────────────────────────────────────────────────
router.patch('/change-password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (user.password) {
      const ok = await user.comparePassword(currentPassword);
      if (!ok) return res.status(401).json({ message: 'Fjalëkalimi aktual është i gabuar.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Fjalëkalimi u ndryshua me sukses.' });
  } catch (err) {
    res.status(500).json({ message: 'Gabim gjatë ndryshimit.', error: err.message });
  }
});

module.exports = router;
