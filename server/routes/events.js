let express = require('express');
let mongoose = require('mongoose');
let Event = require('../models/Event');
let { notifyGroup } = require('../services/push');
let { toISODate, addInterval } = require('../utils/dates');

let router = express.Router({ mergeParams: true });

let ROLLING_WINDOW_MONTHS = 3;
let MAX_OCCURRENCES = 12;

function buildOccurrences(base, seriesId, freq, startFrom) {
  let windowEnd = new Date();
  windowEnd.setMonth(windowEnd.getMonth() + ROLLING_WINDOW_MONTHS);
  let windowEndIso = toISODate(windowEnd);

  let occurrences = [];
  let cursor = startFrom;
  while (cursor <= windowEndIso && occurrences.length < MAX_OCCURRENCES) {
    occurrences.push({ ...base, startDate: cursor, endDate: cursor, seriesId });
    cursor = addInterval(cursor, freq);
  }
  return occurrences;
}

router.get('/', async (req, res) => {
  let events = await Event.find({ groupId: req.params.groupId, status: 'scheduled' }).sort({ startDate: 1 });
  res.json({ events });
});

router.post('/', async (req, res) => {
  let { title, startDate, endDate, startTime, endTime, location, categoryId, description, recurrenceRule } = req.body;
  if (!title || !title.trim() || !startDate || !endDate || !categoryId) {
    return res.status(400).json({ error: 'title, startDate, endDate, and categoryId are required' });
  }
  if (endDate < startDate) {
    return res.status(400).json({ error: 'endDate cannot be before startDate' });
  }

  let base = {
    groupId: req.params.groupId,
    title: title.trim(),
    startTime,
    endTime,
    location,
    categoryId,
    description,
    createdBy: req.userId,
    status: 'scheduled',
  };

  if (recurrenceRule?.freq) {
    if (startDate !== endDate) {
      return res.status(400).json({ error: 'Recurring events must be single-day' });
    }
    let seriesId = new mongoose.Types.ObjectId();
    let docs = buildOccurrences({ ...base, recurrenceRule }, seriesId, recurrenceRule.freq, startDate);
    let created = await Event.insertMany(docs);

    notifyGroup(req.params.groupId, {
      type: 'event_created',
      excludeUserId: req.userId,
      title: 'New recurring event',
      body: `${base.title} (${recurrenceRule.freq}, starting ${startDate})`,
    });

    return res.status(201).json({ event: created[0], occurrences: created });
  }

  let event = await Event.create({ ...base, startDate, endDate });

  notifyGroup(req.params.groupId, {
    type: 'event_created',
    excludeUserId: req.userId,
    title: 'New event',
    body: `${event.title} — ${event.startDate}`,
  });

  res.status(201).json({ event });
});

router.get('/:id', async (req, res) => {
  let event = await Event.findOne({ _id: req.params.id, groupId: req.params.groupId, status: 'scheduled' });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  res.json({ event });
});

router.put('/:id', async (req, res) => {
  let event = await Event.findOne({ _id: req.params.id, groupId: req.params.groupId, status: 'scheduled' });
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
  let event = await Event.findOne({ _id: req.params.id, groupId: req.params.groupId, status: 'scheduled' });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  await event.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
