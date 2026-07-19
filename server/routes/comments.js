let express = require('express');
let Comment = require('../models/Comment');
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
  let comments = await Comment.find({ eventId: req.params.eventId })
    .populate('userId', 'name')
    .sort({ createdAt: 1 });
  res.json({ comments });
});

router.post('/', async (req, res) => {
  let { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });

  let comment = await Comment.create({ eventId: req.params.eventId, userId: req.userId, text: text.trim() });
  await comment.populate('userId', 'name');

  notifyGroup(req.params.groupId, {
    type: 'comment',
    excludeUserId: req.userId,
    title: `New comment on ${req.event.title}`,
    body: `${comment.userId.name}: ${comment.text}`,
  });

  res.status(201).json({ comment });
});

router.delete('/:id', async (req, res) => {
  let comment = await Comment.findOne({ _id: req.params.id, eventId: req.params.eventId });
  if (!comment) return res.status(404).json({ error: 'Comment not found' });
  if (comment.userId.toString() !== req.userId) {
    return res.status(403).json({ error: 'You can only delete your own comments' });
  }
  await comment.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
