let Group = require('../models/Group');

async function requireGroupMember(req, res, next) {
  let group = await Group.findById(req.params.groupId);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  if (!group.members.some((m) => m.toString() === req.userId)) {
    return res.status(403).json({ error: 'Not a member of this group' });
  }
  req.group = group;
  next();
}

module.exports = requireGroupMember;
