let mongoose = require('mongoose');

let rsvpSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['going', 'maybe', 'no'], required: true },
}, { timestamps: true });

rsvpSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Rsvp', rsvpSchema);
