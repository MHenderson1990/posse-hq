let express = require('express');
let Group = require('../models/Group');
let User = require('../models/User');
let Category = require('../models/Category');
let requireAuth = require('../middleware/auth');

let router = express.Router();

let INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let DEFAULT_CATEGORIES = [
  { name: 'Trips', color: '#0496FF' },
  { name: 'Food', color: '#FF9F1C' },
  { name: 'Games & Chill', color: '#8B5CF6' },
  { name: 'Parties', color: '#FF2E7E' },
  { name: 'Activities', color: '#2EC4B6' },
];

function randomInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

async function uniqueInviteCode() {
  let code = randomInviteCode();
  let existing = await Group.findOne({ inviteCode: code });
  if (existing) return uniqueInviteCode();
  return code;
}

router.get('/mine', requireAuth, async (req, res) => {
  let user = await User.findById(req.userId);
  let groups = await Group.find({ _id: { $in: user.groupIds } }).populate('members', 'name email');
  res.json({ groups });
});

router.post('/', requireAuth, async (req, res) => {
  let { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'name is required' });

  let inviteCode = await uniqueInviteCode();
  let group = await Group.create({ name: name.trim(), inviteCode, members: [req.userId] });
  await User.findByIdAndUpdate(req.userId, { $addToSet: { groupIds: group._id } });
  await Category.insertMany(DEFAULT_CATEGORIES.map((c) => ({ groupId: group._id, ...c })));

  let populated = await Group.findById(group._id).populate('members', 'name email');
  res.status(201).json({ group: populated });
});

router.post('/join', requireAuth, async (req, res) => {
  let { inviteCode } = req.body;
  if (!inviteCode || !inviteCode.trim()) return res.status(400).json({ error: 'inviteCode is required' });

  let group = await Group.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
  if (!group) return res.status(404).json({ error: 'No group found for that invite code' });

  await Group.findByIdAndUpdate(group._id, { $addToSet: { members: req.userId } });
  await User.findByIdAndUpdate(req.userId, { $addToSet: { groupIds: group._id } });

  let populated = await Group.findById(group._id).populate('members', 'name email');
  res.json({ group: populated });
});

router.get('/:id', requireAuth, async (req, res) => {
  let group = await Group.findById(req.params.id).populate('members', 'name email');
  if (!group) return res.status(404).json({ error: 'Group not found' });
  let isMember = group.members.some((m) => m._id.toString() === req.userId);
  if (!isMember) return res.status(403).json({ error: 'Not a member of this group' });
  res.json({ group });
});

module.exports = router;
