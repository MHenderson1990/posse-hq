import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { listCategories } from '../api/categories';
import { listPolls, createPoll, voteOnPoll, lockPoll, cancelPoll } from '../api/polls';

export default function Polls() {
  let { user } = useAuth();
  let { group } = useGroup();
  let [categories, setCategories] = useState([]);
  let [polls, setPolls] = useState([]);
  let [showForm, setShowForm] = useState(false);

  useEffect(() => {
    listCategories(group._id).then((data) => setCategories(data.categories));
    listPolls(group._id).then((data) => setPolls(data.polls));
  }, [group._id]);

  async function handleVote(eventId, optionId) {
    let data = await voteOnPoll(group._id, eventId, optionId);
    setPolls((prev) => prev.map((p) => (p.event._id === eventId ? { ...p, options: data.options } : p)));
  }

  async function handleLock(eventId, optionId) {
    await lockPoll(group._id, eventId, optionId);
    setPolls((prev) => prev.filter((p) => p.event._id !== eventId));
  }

  async function handleCancel(eventId) {
    await cancelPoll(group._id, eventId);
    setPolls((prev) => prev.filter((p) => p.event._id !== eventId));
  }

  function handleCreated(data) {
    setPolls((prev) => [{ event: data.event, options: data.options }, ...prev]);
    setShowForm(false);
  }

  let categoriesById = {};
  categories.forEach((c) => { categoriesById[c._id] = c; });

  return (
    <div className="calendar-page">
      <div className="calendar-card">
        <div className="app-header">
          <div className="row">
            <div className="month-name" style={{ fontSize: 22 }}>Polls</div>
            <div className="controls">
              <button onClick={() => setShowForm((s) => !s)}>{showForm ? 'Cancel' : '+ New poll'}</button>
            </div>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {showForm && (
            <PollForm
              groupId={group._id}
              categories={categories}
              onCreated={handleCreated}
              onCancel={() => setShowForm(false)}
            />
          )}

          {polls.length === 0 && !showForm && (
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, padding: '10px 0' }}>
              No open polls. Propose a few dates for something and the group can vote.
            </div>
          )}

          {polls.map(({ event, options }) => (
            <div className="card" key={event._id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div className="stripe" style={{ background: categoriesById[event.categoryId]?.color || 'var(--dim)' }} />
                <div style={{ flex: 1 }}>
                  <div className="t">{event.title}</div>
                  {event.location && <div className="m">{event.location}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {options.map((opt) => {
                  let myVote = opt.votes.some((v) => v._id === user.id);
                  return (
                    <div key={opt._id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        className={'rsvp-pill' + (myVote ? ' active' : '')}
                        style={{ flex: 1, textAlign: 'left', padding: '8px 12px' }}
                        onClick={() => handleVote(event._id, opt._id)}
                      >
                        {opt.candidateDate}
                      </button>
                      <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', minWidth: 60 }}>
                        {opt.votes.length} vote{opt.votes.length === 1 ? '' : 's'}
                      </span>
                      {event.createdBy === user.id && (
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: 11 }}
                          onClick={() => handleLock(event._id, opt._id)}
                        >
                          Lock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {event.createdBy === user.id && (
                <button
                  type="button"
                  onClick={() => handleCancel(event._id)}
                  style={{ border: 'none', background: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 800, cursor: 'pointer', alignSelf: 'flex-start' }}
                >
                  Cancel poll
                </button>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <Link className="btn-secondary" to="/">Calendar</Link>
          <Link className="btn-secondary" to="/group">Group</Link>
        </div>
      </div>
    </div>
  );
}

function PollForm({ groupId, categories, onCreated, onCancel }) {
  let [title, setTitle] = useState('');
  let [categoryId, setCategoryId] = useState(categories[0]?._id || '');
  let [location, setLocation] = useState('');
  let [description, setDescription] = useState('');
  let [dates, setDates] = useState(['', '']);
  let [error, setError] = useState('');
  let [submitting, setSubmitting] = useState(false);

  function updateDate(i, value) {
    setDates(dates.map((d, idx) => (idx === i ? value : d)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    let candidateDates = dates.filter(Boolean);
    if (candidateDates.length < 2) {
      setError('Add at least 2 candidate dates');
      return;
    }
    setSubmitting(true);
    try {
      let data = await createPoll(groupId, { title, categoryId, location, description, candidateDates });
      onCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18, paddingBottom: 18, borderBottom: '1px solid var(--line)' }}
    >
      <div className="field">
        <label htmlFor="poll-title">Title</label>
        <input id="poll-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="poll-category">Category</label>
        <select id="poll-category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="poll-location">Location</label>
        <input id="poll-location" type="text" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>
      <div className="field">
        <label>Candidate dates</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {dates.map((d, i) => (
            <input key={i} type="date" value={d} onChange={(e) => updateDate(i, e.target.value)} />
          ))}
        </div>
        {dates.length < 3 && (
          <button
            type="button"
            className="btn-secondary"
            style={{ marginTop: 8, padding: '6px 12px', fontSize: 12 }}
            onClick={() => setDates([...dates, ''])}
          >
            + Add another date
          </button>
        )}
      </div>
      <div className="field">
        <label htmlFor="poll-description">Description</label>
        <textarea id="poll-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      {error && <div className="error-text">{error}</div>}
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-primary" type="submit" disabled={submitting} style={{ flex: 1 }}>
          {submitting ? 'Creating…' : 'Create poll'}
        </button>
        <button className="btn-secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
