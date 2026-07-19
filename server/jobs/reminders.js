let Event = require('../models/Event');
let { notifyGroup } = require('../services/push');

function tomorrowIso() {
  let d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Events don't carry a timezone, so "~24h before start" is approximated as
// "starts tomorrow" — this job is meant to run once a day.
async function sendUpcomingEventReminders() {
  let targetDate = tomorrowIso();
  let events = await Event.find({ startDate: targetDate, reminderSentAt: null });

  for (let event of events) {
    await notifyGroup(event.groupId, {
      type: 'reminder',
      title: 'Coming up tomorrow',
      body: `${event.title}${event.startTime ? ' at ' + event.startTime : ''}`,
    });
    event.reminderSentAt = new Date();
    await event.save();
  }

  return events.length;
}

module.exports = { sendUpcomingEventReminders };
