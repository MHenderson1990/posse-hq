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
let commentRoutes = require('./routes/comments');
let deviceRoutes = require('./routes/devices');
let pollRoutes = require('./routes/polls');
let choicePollRoutes = require('./routes/choicePolls');
let bringItemRoutes = require('./routes/bringItems');
let myRsvpsRoutes = require('./routes/myRsvps');
let { sendUpcomingEventReminders } = require('./jobs/reminders');
let { extendRecurringSeries } = require('./jobs/recurrence');

let app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/groups/:groupId/categories', requireAuth, requireGroupMember, categoryRoutes);
app.use('/api/groups/:groupId/events', requireAuth, requireGroupMember, eventRoutes);
app.use('/api/groups/:groupId/polls', requireAuth, requireGroupMember, pollRoutes);
app.use('/api/groups/:groupId/choice-polls', requireAuth, requireGroupMember, choicePollRoutes);
app.use('/api/groups/:groupId/my-rsvps', requireAuth, requireGroupMember, myRsvpsRoutes);
app.use('/api/groups/:groupId/events/:eventId/rsvps', requireAuth, requireGroupMember, rsvpRoutes);
app.use('/api/groups/:groupId/events/:eventId/comments', requireAuth, requireGroupMember, commentRoutes);
app.use('/api/groups/:groupId/events/:eventId/bring-items', requireAuth, requireGroupMember, bringItemRoutes);

let port = process.env.PORT || 4000;
let JOB_INTERVAL_MS = 60 * 60 * 1000;

function runJobs() {
  sendUpcomingEventReminders().catch((err) => console.error('Reminder job failed:', err.message));
  extendRecurringSeries().catch((err) => console.error('Recurrence extension job failed:', err.message));
}

connectDb()
  .then(() => {
    app.listen(port, () => console.log(`Posse HQ server listening on port ${port}`));
    runJobs();
    setInterval(runJobs, JOB_INTERVAL_MS);
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
