let express = require('express');
let BringItem = require('../models/BringItem');
let Event = require('../models/Event');

let router = express.Router({ mergeParams: true });

router.use(async (req, res, next) => {
  let event = await Event.findOne({ _id: req.params.eventId, groupId: req.params.groupId });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  next();
});

router.get('/', async (req, res) => {
  let items = await BringItem.find({ eventId: req.params.eventId })
    .populate('claimedBy', 'name')
    .sort({ createdAt: 1 });
  res.json({ items });
});

router.post('/', async (req, res) => {
  let { label } = req.body;
  if (!label || !label.trim()) return res.status(400).json({ error: 'label is required' });
  let item = await BringItem.create({ eventId: req.params.eventId, label: label.trim() });
  res.status(201).json({ item });
});

router.put('/:id/claim', async (req, res) => {
  let item = await BringItem.findOne({ _id: req.params.id, eventId: req.params.eventId });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  item.claimedBy = req.userId;
  await item.save();
  await item.populate('claimedBy', 'name');
  res.json({ item });
});

router.put('/:id/unclaim', async (req, res) => {
  let item = await BringItem.findOne({ _id: req.params.id, eventId: req.params.eventId });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.claimedBy?.toString() !== req.userId) {
    return res.status(403).json({ error: 'You can only unclaim items you claimed' });
  }
  item.claimedBy = null;
  await item.save();
  res.json({ item });
});

router.delete('/:id', async (req, res) => {
  let item = await BringItem.findOne({ _id: req.params.id, eventId: req.params.eventId });
  if (!item) return res.status(404).json({ error: 'Item not found' });
  await item.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
