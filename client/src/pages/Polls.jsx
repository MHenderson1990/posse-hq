import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGroup } from '../context/GroupContext';
import { listCategories } from '../api/categories';
import { listPolls, createPoll, voteOnPoll, lockPoll, cancelPoll } from '../api/polls';
import { listChoicePolls, createChoicePoll, voteOnChoicePoll, lockChoicePoll, deleteChoicePoll } from '../api/choicePolls';

export default function Polls() {
  let { user } = useAuth();
  let { group } = useGroup();
  let [categories, setCategories] = useState([]);
  let [datePolls, setDatePolls] = useState([]);
  let [choicePolls, setChoicePolls] = useState([]);
  let [view, setView] = useState('closed'); // closed | chooser | date | choice

  useEffect(() => {
    listCategories(group._id).then((data) => setCategories(data.categories));
    listPolls(group._id).then((data) => setDatePolls(data.polls));
    listChoicePolls(group._id).then((data) => setChoicePolls(data.polls));
  }, [group._id]);

  async function handleVote(eventId, optionId) {
    let data = await voteOnPoll(group._id, eventId, optionId);
    setDatePolls((prev) => prev.map((p) => (p.event._id === eventId ? { ...p, options: data.options } : p)));
  }

  async function handleLock(eventId, optionId) {
    await lockPoll(group._id, eventId, optionId);
    setDatePolls((prev) => prev.filter((p) => p.event._id !== eventId));
  }

  async function handleCancel(eventId) {
    await cancelPoll(group._id, eventId);
    setDatePolls((prev) => prev.filter((p) => p.event._id !== eventId));
  }

  function handleDateCreated(data) {
    setDatePolls((prev) => [{ event: data.event, options: data.options }, ...prev]);
    setView('closed');
  }

  async function handleChoiceVote(pollId, optionId) {
    let data = await voteOnChoicePoll(group._id, pollId, optionId);
    setChoicePolls((prev) => prev.map((p) => (p._id === pollId ? data.poll : p)));
  }

  async function handleChoiceLock(pollId, optionId) {
    let data = await lockChoicePoll(group._id, pollId, optionId);
    setChoicePolls((prev) => prev.map((p) => (p._id === pollId ? data.poll : p)));
  }

  async function handleChoiceDelete(pollId) {
    await deleteChoicePoll(group._id, pollId);
    setChoicePolls((prev) => prev.filter((p) => p._id !== pollId));
  }

  function handleChoiceCreated(data) {
    setChoicePolls((prev) => [data.poll, ...prev]);
    setView('closed');
  }

  let categoriesById = {};
  categories.forEach((c) => { categoriesById[c._id] = c; });

  let nothingToShow = datePolls.length === 0 && choicePolls.length === 0 && view === 'closed';

  return (
    <div className="calendar-page">
      <div className="calendar-card">
        <div className="app-header">
          <div className="row">
            <div className="month-name" style={{ fontSize: 22 }}>Polls</div>
            <div className="controls">
              <button onClick={() => setView(view === 'closed' ? 'chooser' : 'closed')}>
                {view === 'closed' ? '+ New poll' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {view === 'chooser' && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setView('date')}>📅 Date poll</button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={() => setView('choice')}>📋 Choice poll</button>
            </div>
          )}

          {view === 'date' && (
            <PollForm
              groupId={group._id}
              categories={categories}
              onCreated={handleDateCreated}
              onCancel={() => setView('closed')}
            />
          )}

          {view === 'choice' && (
            <ChoicePollForm
              groupId={group._id}
              onCreated={handleChoiceCreated}
              onCancel={() => setView('closed')}
            />
          )}

          {nothingToShow && (
            <div style={{ color: 'var(--ink-soft)', fontSize: 13, padding: '10px 0' }}>
              No open polls. Propose a few dates, or ask the group to pick between a few options.
            </div>
          )}

          {datePolls.map(({ event, options }) => (
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
                          className="btn-primary"
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

          {choicePolls.map((poll) => {
            let winningOption = poll.options.find((o) => o._id === poll.winningOptionId);
            return (
              <div className="card" key={poll._id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div className="t">{poll.question}</div>

                {poll.status === 'closed' ? (
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                    🏆 {winningOption?.label}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {poll.options.map((opt) => {
                      let myVote = opt.votes.some((v) => v._id === user.id);
                      return (
                        <div key={opt._id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            type="button"
                            className={'rsvp-pill' + (myVote ? ' active' : '')}
                            style={{ flex: 1, textAlign: 'left', padding: '8px 12px' }}
                            onClick={() => handleChoiceVote(poll._id, opt._id)}
                          >
                            {opt.label}
                          </button>
                          <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', minWidth: 60 }}>
                            {opt.votes.length} vote{opt.votes.length === 1 ? '' : 's'}
                          </span>
                          {poll.createdBy === user.id && (
                            <button
                              className="btn-primary"
                              style={{ padding: '6px 10px', fontSize: 11 }}
                              onClick={() => handleChoiceLock(poll._id, opt._id)}
                            >
                              Lock
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {poll.createdBy === user.id && poll.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handleChoiceDelete(poll._id)}
                    style={{ border: 'none', background: 'none', color: 'var(--error)', fontSize: 12, fontWeight: 800, cursor: 'pointer', alignSelf: 'flex-start' }}
                  >
                    Cancel poll
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: '0 18px 18px' }}>
          <Link className="btn-primary" to="/">Calendar</Link>
          <Link className="btn-primary" to="/group">Group</Link>
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
            className="btn-primary"
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

function ChoicePollForm({ groupId, onCreated, onCancel }) {
  let [question, setQuestion] = useState('');
  let [options, setOptions] = useState(['', '']);
  let [error, setError] = useState('');
  let [submitting, setSubmitting] = useState(false);

  function updateOption(i, value) {
    setOptions(options.map((o, idx) => (idx === i ? value : o)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    let labels = options.map((o) => o.trim()).filter(Boolean);
    if (labels.length < 2) {
      setError('Add at least 2 options');
      return;
    }
    setSubmitting(true);
    try {
      let data = await createChoicePoll(groupId, { question, options: labels });
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
        <label htmlFor="choice-question">Question</label>
        <input
          id="choice-question"
          type="text"
          placeholder="Where should we eat Friday?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Options</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {options.map((o, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Option ${i + 1}`}
              value={o}
              onChange={(e) => updateOption(i, e.target.value)}
            />
          ))}
        </div>
        {options.length < 6 && (
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 8, padding: '6px 12px', fontSize: 12 }}
            onClick={() => setOptions([...options, ''])}
          >
            + Add another option
          </button>
        )}
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
