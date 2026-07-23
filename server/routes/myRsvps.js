let express = require('express');
let Event = require('../models/Event');
let Rsvp = require('../models/Rsvp');

let router = express.Router({ mergeParams: true });

router.get('/', async (req, res) => {
  let events = await Event.find({ groupId: req.params.groupId, status: 'scheduled' }, '_id');
  let eventIds = events.map((e) => e._id);
  let rsvps = await Rsvp.find({ eventId: { $in: eventIds }, userId: req.userId });
  res.json({ rsvps });
});

module.exports = router;
