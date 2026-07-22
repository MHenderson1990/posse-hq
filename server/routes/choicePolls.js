let express = require('express');
let Poll = require('../models/Poll');
let { notifyGroup } = require('../services/push');

let router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  let polls = await Poll.find({ groupId: req.params.groupId })
    .populate('options.votes', 'name')
    .sort({ createdAt: -1 });
  res.json({ polls });
});

router.post('/', async (req, res) => {
  let { question, options } = req.body;
  if (!question || !question.trim()) return res.status(400).json({ error: 'question is required' });

  let labels = (options || []).map((o) => o.trim()).filter(Boolean);
  if (labels.length < 2 || labels.length > 6) {
    return res.status(400).json({ error: 'Provide 2-6 options' });
  }

  let poll = await Poll.create({
    groupId: req.params.groupId,
    question: question.trim(),
    createdBy: req.userId,
    options: labels.map((label) => ({ label, votes: [] })),
  });

  notifyGroup(req.params.groupId, {
    type: 'poll_created',
    excludeUserId: req.userId,
    title: 'New poll',
    body: poll.question,
  });

  res.status(201).json({ poll });
});

router.put('/:pollId/vote', async (req, res) => {
  let { optionId } = req.body;
  let poll = await Poll.findOne({ _id: req.params.pollId, groupId: req.params.groupId });
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.status !== 'open') return res.status(400).json({ error: 'This poll is closed' });

  let option = poll.options.id(optionId);
  if (!option) return res.status(404).json({ error: 'Option not found' });

  poll.options.forEach((o) => {
    o.votes = o.votes.filter((v) => v.toString() !== req.userId);
  });
  option.votes.push(req.userId);
  await poll.save();
  await poll.populate('options.votes', 'name');

  res.json({ poll });
});

router.post('/:pollId/lock', async (req, res) => {
  let { optionId } = req.body;
  let poll = await Poll.findOne({ _id: req.params.pollId, groupId: req.params.groupId });
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the poll creator can lock in a winner' });
  }

  let option = poll.options.id(optionId);
  if (!option) return res.status(404).json({ error: 'Option not found' });

  poll.status = 'closed';
  poll.winningOptionId = option._id;
  await poll.save();
  await poll.populate('options.votes', 'name');

  res.json({ poll });
});

router.delete('/:pollId', async (req, res) => {
  let poll = await Poll.findOne({ _id: req.params.pollId, groupId: req.params.groupId });
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.createdBy.toString() !== req.userId) {
    return res.status(403).json({ error: 'Only the poll creator can delete this poll' });
  }
  await poll.deleteOne();
  res.json({ ok: true });
});

module.exports = router;
