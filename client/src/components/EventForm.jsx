import { useState } from 'react';
import { createEvent, updateEvent, deleteEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';
import CommentThread from './CommentThread';
import BringList from './BringList';

function formatDateShort(iso) {
  let [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function EventForm({ groupId, categories, initialEvent, defaultDate, onSaved, onDeleted, onCancel, onCommentCountChange }) {
  let { user } = useAuth();
  let editing = Boolean(initialEvent);
  let [mode, setMode] = useState(editing ? 'view' : 'edit');
  let [title, setTitle] = useState(initialEvent?.title || '');
  let [categoryId, setCategoryId] = useState(initialEvent?.categoryId || categories[0]?._id || '');
  let [startDate, setStartDate] = useState(initialEvent?.startDate || defaultDate);
  let [endDate, setEndDate] = useState(initialEvent?.endDate || defaultDate);
  let [startTime, setStartTime] = useState(initialEvent?.startTime || '');
  let [endTime, setEndTime] = useState(initialEvent?.endTime || '');
  let [location, setLocation] = useState(initialEvent?.location || '');
  let [description, setDescription] = useState(initialEvent?.description || '');
  let [repeat, setRepeat] = useState('none');
  let [error, setError] = useState('');
  let [submitting, setSubmitting] = useState(false);

  let category = categories.find((c) => c._id === categoryId);

  function handleRepeatChange(value) {
    setRepeat(value);
    if (value !== 'none') setEndDate(startDate);
  }

  function handleStartDateChange(value) {
    setStartDate(value);
    if (repeat !== 'none') setEndDate(value);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    let payload = { title, categoryId, startDate, endDate, startTime, endTime, location, description };
    if (!editing && repeat !== 'none') payload.recurrenceRule = { freq: repeat };
    try {
      let data = editing
        ? await updateEvent(groupId, initialEvent._id, payload)
        : await createEvent(groupId, payload);
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setSubmitting(true);
    try {
      await deleteEvent(groupId, initialEvent._id);
      onDeleted(initialEvent._id);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="header">
          <div className="brand heading">
            {mode === 'view' ? initialEvent.title : editing ? 'Edit event' : 'New event'}
          </div>
        </div>

        {mode === 'view' ? (
          <div style={{ padding: '20px 24px 6px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: category?.color || 'var(--dim)' }} />
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)' }}>{category?.name}</span>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                {startDate === endDate ? formatDateShort(startDate) : `${formatDateShort(startDate)} – ${formatDateShort(endDate)}`}
                {startTime && ` · ${startTime}`}
                {endTime && `–${endTime}`}
              </div>
              {location && <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>{location}</div>}
            </div>
            {description && <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>{description}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setMode('edit')}>Edit</button>
              <button className="btn-secondary" onClick={onCancel}>Close</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="ev-title">Title</label>
              <input id="ev-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="ev-category">Category</label>
              <select id="ev-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="ev-start-date">Start date</label>
                <input id="ev-start-date" type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} required />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="ev-end-date">End date</label>
                <input
                  id="ev-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={repeat !== 'none'}
                  required
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="ev-start-time">Start time</label>
                <input id="ev-start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label htmlFor="ev-end-time">End time</label>
                <input id="ev-end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="ev-location">Location</label>
              <input id="ev-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="ev-description">Description</label>
              <textarea id="ev-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            {!editing && (
              <div className="field">
                <label htmlFor="ev-repeat">Repeat</label>
                <select id="ev-repeat" value={repeat} onChange={(e) => handleRepeatChange(e.target.value)}>
                  <option value="none">Doesn't repeat</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every other week</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            {error && <div className="error-text">{error}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
                {submitting ? 'Saving…' : 'Save event'}
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => (editing ? setMode('view') : onCancel())}
                disabled={submitting}
              >
                Cancel
              </button>
            </div>
            {editing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                style={{ border: 'none', background: 'none', color: 'var(--error)', fontSize: 13, fontWeight: 800, cursor: 'pointer', padding: '4px 0' }}
              >
                Delete event
              </button>
            )}
          </form>
        )}

        {editing && (
          <div style={{ padding: '0 24px 22px', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <CommentThread
              groupId={groupId}
              eventId={initialEvent._id}
              currentUserId={user.id}
              onCountChange={(count) => onCommentCountChange?.(initialEvent._id, count)}
            />
            <BringList groupId={groupId} eventId={initialEvent._id} currentUserId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
