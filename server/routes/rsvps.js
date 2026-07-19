let express = require('express');
let Rsvp = require('../models/Rsvp');
let Event = require('../models/Event');
let { notifyGroup } = require('../services/push');

let router = express.Router({ mergeParams: true });

router.use(async (req, res, next) => {
  let event = await Event.findOne({ _id: req.params.eventId, groupId: req.params.groupId });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  req.event = event;
  next();
});

router.get('/', async (req, res) => {
  let rsvps = await Rsvp.find({ eventId: req.params.eventId }).populate('userId', 'name');
  res.json({ rsvps });
});

router.put('/me', async (req, res) => {
  let { status } = req.body;
  if (!['going', 'maybe', 'no'].includes(status)) {
    return res.status(400).json({ error: 'status must be going, maybe, or no' });
  }
  let rsvp = await Rsvp.findOneAndUpdate(
    { eventId: req.params.eventId, userId: req.userId },
    { status },
    { upsert: true, new: true }
  ).populate('userId', 'name');

  let statusLabel = status === 'going' ? 'is in' : status === 'maybe' ? 'might come' : "can't make it";
  notifyGroup(req.params.groupId, {
    type: 'rsvp',
    excludeUserId: req.userId,
    title: `RSVP on ${req.event.title}`,
    body: `${rsvp.userId.name} ${statusLabel}`,
  });

  res.json({ rsvp });
});

module.exports = router;
