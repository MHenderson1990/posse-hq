let mongoose = require('mongoose');

let deviceTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  token: { type: String, required: true, unique: true },
  platform: { type: String, enum: ['ios'], default: 'ios' },
}, { timestamps: true });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
