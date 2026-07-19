require('dotenv').config();
let express = require('express');
let cors = require('cors');
let connectDb = require('./db');
let requireAuth = require('./middleware/auth');
let requireGroupMember = require('./middleware/groupMember');
let authRoutes = require('./routes/auth');
let groupRoutes = require('./routes/groups');
let categoryRoutes = require('./routes/categories');
let eventRoutes = require('./routes/events');
let rsvpRoutes = require('./routes/rsvps');

let app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/groups/:groupId/categories', requireAuth, requireGroupMember, categoryRoutes);
app.use('/api/groups/:groupId/events', requireAuth, requireGroupMember, eventRoutes);
app.use('/api/groups/:groupId/events/:eventId/rsvps', requireAuth, requireGroupMember, rsvpRoutes);

let port = process.env.PORT || 4000;

connectDb()
  .then(() => {
    app.listen(port, () => console.log(`Posse HQ server listening on port ${port}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
