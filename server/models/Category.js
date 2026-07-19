let mongoose = require('mongoose');

let categorySchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
