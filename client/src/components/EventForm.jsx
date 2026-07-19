import { useState } from 'react';
import { createEvent, updateEvent, deleteEvent } from '../api/events';
import { useAuth } from '../context/AuthContext';
import CommentThread from './CommentThread';

export default function EventForm({ groupId, categories, initialEvent, defaultDate, onSaved, onDeleted, onCancel, onCommentCountChange }) {
  let { user } = useAuth();
  let editing = Boolean(initialEvent);
  let [title, setTitle] = useState(initialEvent?.title || '');
  let [categoryId, setCategoryId] = useState(initialEvent?.categoryId || categories[0]?._id || '');
  let [startDate, setStartDate] = useState(initialEvent?.startDate || defaultDate);
  let [endDate, setEndDate] = useState(initialEvent?.endDate || defaultDate);
  let [startTime, setStartTime] = useState(initialEvent?.startTime || '');
  let [endTime, setEndTime] = useState(initialEvent?.endTime || '');
  let [location, setLocation] = useState(initialEvent?.location || '');
  let [description, setDescription] = useState(initialEvent?.description || '');
  let [error, setError] = useState('');
  let [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    let payload = { title, categoryId, startDate, endDate, startTime, endTime, location, description };
    try {
      let data = editing
        ? await updateEvent(groupId, initialEvent._id, payload)
        : await createEvent(groupId, payload);
      onSaved(data.event);
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
          <div className="brand heading">{editing ? 'Edit event' : 'New event'}</div>
        </div>
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
              <input id="ev-start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ev-end-date">End date</label>
              <input id="ev-end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
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
          {error && <div className="error-text">{error}</div>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
              {submitting ? 'Saving…' : 'Save event'}
            </button>
            <button className="btn-secondary" type="button" onClick={onCancel} disabled={submitting}>
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
        {editing && (
          <div style={{ padding: '0 24px 22px' }}>
            <CommentThread
              groupId={groupId}
              eventId={initialEvent._id}
              currentUserId={user.id}
              onCountChange={(count) => onCommentCountChange?.(initialEvent._id, count)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
