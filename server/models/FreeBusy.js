let mongoose = require('mongoose');

let freeBusySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  busyBlocks: [{
    start: { type: Number, required: true },
    end: { type: Number, required: true },
  }],
}, { timestamps: true });

freeBusySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('FreeBusy', freeBusySchema);
