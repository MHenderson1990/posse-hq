let mongoose = require('mongoose');

let userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  themePreference: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  groupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
