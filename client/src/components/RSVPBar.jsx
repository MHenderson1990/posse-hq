let FACE_COLORS = ['#3B4EFF', '#0496FF', '#FF9F1C', '#FF2E7E', '#8B5CF6', '#00A896'];

export default function RSVPBar({ rsvps, currentUserId, onSetStatus }) {
  let going = rsvps.filter((r) => r.status === 'going');
  let maybeCount = rsvps.filter((r) => r.status === 'maybe').length;
  let mine = rsvps.find((r) => r.userId._id === currentUserId);

  return (
    <div className="rsvp">
      <div className="rsvp-top">
        <div className="faces">
          {going.slice(0, 4).map((r, i) => (
            <div key={r._id} className="face" style={{ background: FACE_COLORS[i % FACE_COLORS.length] }}>
              {r.userId.name[0]}
            </div>
          ))}
        </div>
        <div className="going">{going.length} going · {maybeCount} maybe</div>
      </div>
      <div className="rsvp-actions">
        {[['going', "I'm in"], ['maybe', 'Maybe'], ['no', "Can't make it"]].map(([status, label]) => (
          <button
            key={status}
            type="button"
            className={'rsvp-pill' + (mine?.status === status ? ' active' : '')}
            onClick={() => onSetStatus(status)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
