import RSVPBar from './RSVPBar';
import { formatTime12h } from '../utils/calendar';

export default function EventCard({ event, category, rsvps = [], currentUserId, onSetStatus, onEdit, commentCount }) {
  let timeLabel = [event.startTime, event.endTime].filter(Boolean).map(formatTime12h).join('–');
  let meta = [
    event.dayLabel ? `Day ${event.dayLabel}` : timeLabel,
    event.location,
    commentCount ? `💬 ${commentCount}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="card">
      <div className="stripe" style={{ background: category?.color || 'var(--dim)' }} />
      <div style={{ flex: 1 }}>
        <div onClick={onEdit} style={{ cursor: onEdit ? 'pointer' : 'default' }}>
          <div className="t">{event.title}</div>
          {meta && <div className="m">{meta}</div>}
        </div>
        <RSVPBar rsvps={rsvps} currentUserId={currentUserId} onSetStatus={onSetStatus} />
      </div>
    </div>
  );
}
