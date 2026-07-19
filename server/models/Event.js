let mongoose = require('mongoose');

let eventSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  title: { type: String, required: true },
  startDate: { type: String },
  endDate: { type: String },
  startTime: { type: String },
  endTime: { type: String },
  location: { type: String },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  reminderSentAt: { type: Date, default: null },
  status: { type: String, enum: ['poll', 'scheduled'], default: 'scheduled' },
  recurrenceRule: {
    freq: { type: String, enum: ['weekly', 'biweekly', 'monthly'] },
  },
  seriesId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
