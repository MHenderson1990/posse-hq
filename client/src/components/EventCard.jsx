import RSVPBar from './RSVPBar';

export default function EventCard({ event, category, rsvps = [], currentUserId, onSetStatus, onEdit }) {
  let meta = [event.dayLabel ? `Day ${event.dayLabel}` : event.startTime, event.location]
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
