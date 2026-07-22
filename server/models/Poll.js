let mongoose = require('mongoose');

let optionSchema = new mongoose.Schema({
  label: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

let pollSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  question: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  options: [optionSchema],
  status: { type: String, enum: ['open', 'closed'], default: 'open' },
  winningOptionId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Poll', pollSchema);
