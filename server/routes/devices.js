let express = require('express');
let DeviceToken = require('../models/DeviceToken');
let requireAuth = require('../middleware/auth');

let router = express.Router();

// Called by the Capacitor push plugin once it's wired up in Phase 4.
router.post('/', requireAuth, async (req, res) => {
  let { token, platform } = req.body;
  if (!token) return res.status(400).json({ error: 'token is required' });

  let device = await DeviceToken.findOneAndUpdate(
    { token },
    { userId: req.userId, token, platform: platform || 'ios' },
    { upsert: true, new: true }
  );
  res.status(201).json({ device });
});

router.delete('/:token', requireAuth, async (req, res) => {
  await DeviceToken.deleteOne({ token: req.params.token, userId: req.userId });
  res.json({ ok: true });
});

module.exports = router;
