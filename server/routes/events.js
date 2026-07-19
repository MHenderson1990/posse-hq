let express = require('express');
let Event = require('../models/Event');
let { notifyGroup } = require('../services/push');

let router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  let events = await Event.find({ groupId: req.params.groupId }).sort({ startDate: 1 });
  res.json({ events });
});

router.post('/', async (req, res) => {
  let { title, startDate, endDate, startTime, endTime, location, categoryId, description } = req.body;
  if (!title || !title.trim() || !startDate || !endDate || !categoryId) {
    return res.status(400).json({ error: 'title, startDate, endDate, and categoryId are required' });
  }
  if (endDate < startDate) {
    return res.status(400).json({ error: 'endDate cannot be before startDate' });
  }

  let event = await Event.create({
    groupId: req.params.groupId,
    title: title.trim(),
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    categoryId,
    description,
    createdBy: req.userId,
  });

  notifyGroup(req.params.groupId, {
    type: 'event_created',
    excludeUserId: req.userId,
    title: 'New event',
    body: `${event.title} — ${event.startDate}`,
  });

  res.status(201).json({ event });
});

router.get('/:id', async (req, res) => {
  let event = await Event.findOne({ _id: req.params.id, groupId: req.params.groupId });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ event });
});

router.put('/:id', async (req, res) => {
  let event = await Event.findOne({ _id: req.params.id, groupId: req.params.groupId });
  if (!event) return res.status(404).json({ error: 'Event not found' });

  let { title, startDate, endDate, startTime, endTime, location, categoryId, description } = req.body;
  if (title !== undefined) event.title = title.trim();
  if (startDate !== undefined) event.startDate = startDate;
  if (endDate !== undefined) event.endDate = endDate;
  if (startTime !== undefined) event.startTime = startTime;
  if (endTime !== undefined) event.endTime = endTime;
  if (location !== undefined) event.location = location;
  if (categoryId !== undefined) event.categoryId = categoryId;
  if (description !== undefined) event.description = description;

  if (event.endDate < event.startDate) {
    return res.status(400).json({ error: 'endDate cannot be before startDate' });
  }

  await event.save();
  res.json({ event });
});

router.delete('/:id', async (req, res) => {
  let event = await Event.findOne({ _id: req.params.id, groupId: req.params.groupId });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  await event.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
