let express = require('express');
let FreeBusy = require('../models/FreeBusy');

let router = express.Router({ mergeParams: true });

// Returns, for each requested date, which group members have a busy block that
// day and how many members there are total - so the client can show "N of M free".
router.get('/', async (req, res) => {
  let dates = (req.query.dates || '').split(',').map((d) => d.trim()).filter(Boolean);
  if (!dates.length) return res.json({ freeBusy: [] });

  let memberIds = req.group.members.map((m) => m.toString());
  let records = await FreeBusy.find({ userId: { $in: memberIds }, date: { $in: dates } });

  let freeBusy = dates.map((date) => ({
    date,
    busyUserIds: records.filter((r) => r.date === date && r.busyBlocks.length > 0).map((r) => r.userId.toString()),
    totalMembers: memberIds.length,
  }));

  res.json({ freeBusy });
});

// Upserts the current user's busy blocks (start/end timestamps only) for a batch of dates.
router.put('/', async (req, res) => {
  let entries = req.body.entries || [];
  await Promise.all(entries.map(({ date, busyBlocks }) =>
    FreeBusy.findOneAndUpdate(
      { userId: req.userId, date },
      { busyBlocks: busyBlocks || [] },
      { upsert: true }
    )
  ));
  res.json({ ok: true });
});

module.exports = router;
