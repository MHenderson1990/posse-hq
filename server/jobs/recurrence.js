let Event = require('../models/Event');
let { toISODate, addInterval } = require('../utils/dates');

let ROLLING_WINDOW_MONTHS = 3;
let MAX_OCCURRENCES_PER_RUN = 12;

// Keeps each recurring series generated ~3 months into the future. Runs
// alongside the reminder job — no push notifications here, since these are
// routine future occurrences of an event the group was already told about.
async function extendRecurringSeries() {
  let windowEnd = new Date();
  windowEnd.setMonth(windowEnd.getMonth() + ROLLING_WINDOW_MONTHS);
  let windowEndIso = toISODate(windowEnd);

  let seriesIds = await Event.distinct('seriesId', { seriesId: { $ne: null } });
  let createdTotal = 0;

  for (let seriesId of seriesIds) {
    let latest = await Event.findOne({ seriesId }).sort({ startDate: -1 });
    if (!latest || !latest.recurrenceRule?.freq || latest.startDate >= windowEndIso) continue;

    let freq = latest.recurrenceRule.freq;
    let cursor = addInterval(latest.startDate, freq);
    let batch = [];

    while (cursor <= windowEndIso && batch.length < MAX_OCCURRENCES_PER_RUN) {
      batch.push({
        groupId: latest.groupId,
        title: latest.title,
        startDate: cursor,
        endDate: cursor,
        startTime: latest.startTime,
        endTime: latest.endTime,
        location: latest.location,
        categoryId: latest.categoryId,
        createdBy: latest.createdBy,
        description: latest.description,
        status: 'scheduled',
        recurrenceRule: latest.recurrenceRule,
        seriesId,
      });
      cursor = addInterval(cursor, freq);
    }

    if (batch.length) {
      await Event.insertMany(batch);
      createdTotal += batch.length;
    }
  }

  return createdTotal;
}

module.exports = { extendRecurringSeries };
