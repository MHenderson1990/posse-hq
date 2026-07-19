let express = require('express');
let Event = require('../models/Event');
let DatePollOption = require('../models/DatePollOption');
let { notifyGroup } = require('../services/push');

let router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  let polls = await Event.find({ groupId: req.params.groupId, status: 'poll' }).sort({ createdAt: -1 });
  let withOptions = await Promise.all(
    polls.map(async (event) => {
      let options = await DatePollOption.find({ eventId: event._id }).populate('votes', 'name');
      return { event, options };
    })
  );
  res.json({ polls: withOptions });
});

router.post('/', async (req, res) => {
  let { title, categoryId, location, description, candidateDates } = req.body;
  if (!title || !title.trim() || !categoryId) {
    return res.status(400).json({ error: 'title and categoryId are required' });
  }
  if (!Array.isArray(candidateDates) || candidateDates.length < 2 || candidateDates.length > 3) {
    return res.status(400).json({ error: 'Provide 2-3 candidate dates' });
  }

  let event = await Event.create({
    groupId: req.params.groupId,
    title: title.trim(),
    categoryId,
    location,
    description,
    createdBy: req.userId,
    status: 'poll',
  });
  let options = await DatePollOption.insertMany(
    candidateDates.map((d) => ({ eventId: event._id, candidateDate: d }))
  );

  notifyGroup(req.params.groupId, {
    type: 'event_created',
    excludeUserId: req.userId,
    title: 'New date poll',
    body: `Vote on when to do ${event.title}`,
  });

  res.status(201).json({ event, options });
});

router.put('/:eventId/vote', async (req, res) => {
  let { optionId } = req.body;
  let event = await Event.findOne({ _id: req.params.eventId, groupId: req.params.groupId, status: 'poll' });
  if (!event) return res.status(404).json({ error: 'Poll not found' });

  let option = await DatePollOption.findOne({ _id: optionId, eventId: event._id });
  if (!option) return res.status(404).json({ error: 'Option not found' });

  await DatePollOption.updateMany({ eventId: event._id }, { $pull: { votes: req.userId } });
  await DatePollOption.updateOne({ _id: optionId }, { $addToSet: { votes: req.userId } });

  let options = await DatePollOption.find({ eventId: event._id }).populate('votes', 'name');
  res.json({ options });
});

router.post('/:eventId/lock', async (req, res) => {
  let { optionId } = req.body;
  let event = await Event.findOne({ _id: req.params.eventId, groupId: req.params.groupId, status: 'poll' });
  if (!event) return res.status(404).json({ error: 'Poll not found' });
  if (event.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the poll creator can lock the date' });
  }

  let option = await DatePollOption.findOne({ _id: optionId, eventId: event._id });
  if (!option) return res.status(404).json({ error: 'Option not found' });

  event.startDate = option.candidateDate;
  event.endDate = option.candidateDate;
  event.status = 'scheduled';
  await event.save();

  notifyGroup(req.params.groupId, {
    type: 'event_created',
    excludeUserId: req.userId,
    title: `${event.title} is locked in`,
    body: `Happening ${option.candidateDate}`,
  });

  res.json({ event });
});

router.delete('/:eventId', async (req, res) => {
  let event = await Event.findOne({ _id: req.params.eventId, groupId: req.params.groupId, status: 'poll' });
  if (!event) return res.status(404).json({ error: 'Poll not found' });
  if (event.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the poll creator can cancel this poll' });
  }
  await DatePollOption.deleteMany({ eventId: event._id });
  await event.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
