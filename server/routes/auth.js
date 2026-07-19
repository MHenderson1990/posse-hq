let express = require('express');
let bcrypt = require('bcryptjs');
let jwt = require('jsonwebtoken');
let User = require('../models/User');
let requireAuth = require('../middleware/auth');

let router = express.Router();

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function toPublicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    themePreference: user.themePreference,
    groupIds: user.groupIds,
  };
}

router.post('/register', async (req, res) => {
  let { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  let existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  let passwordHash = await bcrypt.hash(password, 10);
  let user = await User.create({ name, email, passwordHash });

  let token = signToken(user._id);
  res.status(201).json({ token, user: toPublicUser(user) });
});

router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  let user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  let match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: 'Invalid email or password' });

  let token = signToken(user._id);
  res.json({ token, user: toPublicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  let user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: toPublicUser(user) });
});

router.patch('/theme', requireAuth, async (req, res) => {
  let { themePreference } = req.body;
  if (!['light', 'dark', 'system'].includes(themePreference)) {
    return res.status(400).json({ error: 'themePreference must be light, dark, or system' });
  }
  let user = await User.findByIdAndUpdate(req.userId, { themePreference }, { new: true });
  res.json({ user: toPublicUser(user) });
});

module.exports = router;
