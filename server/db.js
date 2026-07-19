let mongoose = require('mongoose');

async function connectDb() {
  let uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in .env');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

module.exports = connectDb;
