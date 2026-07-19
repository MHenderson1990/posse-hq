import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { useTheme } from '../context/ThemeContext';
import { listCategories } from '../api/categories';
import { listEvents } from '../api/events';
import { listRsvps, setMyRsvp } from '../api/rsvps';
import { listComments } from '../api/comments';
import { getMonthWeeks, monthLabel, isoDateToday, formatLongDate, eventsForDay } from '../utils/calendar';
import CalendarGrid from '../components/CalendarGrid';
import EventCard from '../components/EventCard';
import EventForm from '../components/EventForm';

export default function Calendar() {
  let { user } = useAuth();
  let { group } = useGroup();
  let { effective, setPreference } = useTheme();

  let today = isoDateToday();
  let [cursor, setCursor] = useState(() => {
    let [y, m] = today.split('-').map(Number);
    return { year: y, month: m - 1 };
  });
  let [selectedIso, setSelectedIso] = useState(today);
  let [categories, setCategories] = useState([]);
  let [events, setEvents] = useState([]);
  let [rsvpsByEvent, setRsvpsByEvent] = useState({});
  let [commentCounts, setCommentCounts] = useState({});
  let [formState, setFormState] = useState(null); // null | 'new' | eventObject

  useEffect(() => {
    listCategories(group._id).then((data) => setCategories(data.categories));
  }, [group._id]);

  useEffect(() => {
    listEvents(group._id).then((data) => setEvents(data.events));
  }, [group._id]);

  let categoriesById = useMemo(() => {
    let map = {};
    categories.forEach((c) => { map[c._id] = c; });
    return map;
  }, [categories]);

  let weeks = useMemo(() => getMonthWeeks(cursor.year, cursor.month), [cursor]);
  let { name: monthName, year } = monthLabel(cursor.year, cursor.month);
  let dayEvents = useMemo(() => eventsForDay(selectedIso, events), [selectedIso, events]);

  useEffect(() => {
    let ids = dayEvents.map((e) => e._id);
    if (!ids.length) return;
    Promise.all(ids.map((id) => listRsvps(group._id, id).then((data) => [id, data.rsvps])))
      .then((pairs) => setRsvpsByEvent((prev) => ({ ...prev, ...Object.fromEntries(pairs) })));
    Promise.all(ids.map((id) => listComments(group._id, id).then((data) => [id, data.comments.length])))
      .then((pairs) => setCommentCounts((prev) => ({ ...prev, ...Object.fromEntries(pairs) })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIso, events, group._id]);

  function goToMonth(delta) {
    setCursor((c) => {
      let month = c.month + delta;
      let year = c.year;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      return { year, month };
    });
  }

  function goToToday() {
    let [y, m] = today.split('-').map(Number);
    setCursor({ year: y, month: m - 1 });
    setSelectedIso(today);
  }

  function handleSaved(data) {
    if (data.occurrences) {
      setEvents((prev) => [...prev, ...data.occurrences]);
    } else {
      let event = data.event;
      setEvents((prev) => {
        let exists = prev.some((e) => e._id === event._id);
        return exists ? prev.map((e) => (e._id === event._id ? event : e)) : [...prev, event];
      });
    }
    setFormState(null);
  }

  function handleDeleted(eventId) {
    setEvents((prev) => prev.filter((e) => e._id !== eventId));
    setFormState(null);
  }

  async function handleSetRsvp(eventId, status) {
    let data = await setMyRsvp(group._id, eventId, status);
    setRsvpsByEvent((prev) => {
      let existing = prev[eventId] || [];
      let others = existing.filter((r) => r.userId._id !== user.id);
      return { ...prev, [eventId]: [...others, data.rsvp] };
    });
  }

  function handleCommentCountChange(eventId, count) {
    setCommentCounts((prev) => ({ ...prev, [eventId]: count }));
  }

  return (
    <div className="calendar-page">
      <div className="calendar-card">
        <div className="app-header">
          <div className="row">
            <div className="month-name">{monthName} <span>{year}</span></div>
            <div className="controls">
              <button onClick={() => goToMonth(-1)}>‹</button>
              <button onClick={goToToday}>Today</button>
              <button onClick={() => goToMonth(1)}>›</button>
              <button onClick={() => setPreference(effective === 'dark' ? 'light' : 'dark')} title="Toggle theme">
                {effective === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
          <div className="legend">
            {categories.map((c) => (
              <div className="chip" key={c._id}>
                <span className="dot" style={{ background: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>

        <CalendarGrid
          weeks={weeks}
          events={events}
          categoriesById={categoriesById}
          todayIso={today}
          selectedIso={selectedIso}
          onSelectDay={setSelectedIso}
        />

        <div className="detail">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>{formatLongDate(selectedIso)}</h3>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setFormState('new')}>
              + New event
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, padding: '6px 0 2px' }}>
              Nothing planned — someone should fix that. ✌️
            </div>
          ) : (
            dayEvents.map((e) => (
              <EventCard
                key={e._id}
                event={e}
                category={categoriesById[e.categoryId]}
                rsvps={rsvpsByEvent[e._id] || []}
                currentUserId={user.id}
                onSetStatus={(status) => handleSetRsvp(e._id, status)}
                onEdit={() => setFormState(events.find((full) => full._id === e._id))}
                commentCount={commentCounts[e._id]}
              />
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <Link className="btn-secondary" to="/group">Group</Link>
          <Link className="btn-secondary" to="/polls">Polls</Link>
          <Link className="btn-secondary" to="/settings">Settings</Link>
        </div>
      </div>

      {formState && (
        <EventForm
          groupId={group._id}
          categories={categories}
          initialEvent={formState === 'new' ? null : formState}
          defaultDate={selectedIso}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
          onCancel={() => setFormState(null)}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
}
