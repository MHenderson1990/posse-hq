let DeviceToken = require('../models/DeviceToken');
let Group = require('../models/Group');

// Real APNs delivery lands once the Capacitor push plugin (Phase 4) is wired
// up on the client and users have registered device tokens. Until then this
// just logs what would have been sent, so every trigger point below already
// calls the real interface and Phase 4 only has to swap the inner loop.
async function notifyGroup(groupId, { type, title, body, excludeUserId }) {
  let group = await Group.findById(groupId);
  if (!group) return;

  let recipientIds = group.members
    .map((m) => m.toString())
    .filter((id) => id !== String(excludeUserId));
  if (!recipientIds.length) return;

  let tokens = await DeviceToken.find({ userId: { $in: recipientIds } });
  if (!tokens.length) {
    console.log(`[push:${type}] ${title} — ${body} (no registered devices yet)`);
    return;
  }

  tokens.forEach((t) => {
    console.log(`[push:${type}] -> device ${t.token.slice(0, 8)}…: ${title} — ${body}`);
  });
}

module.exports = { notifyGroup };
