import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroup } from '../context/GroupContext';
import { listCategories, createCategory, deleteCategory } from '../api/categories';
import CategoryBadge from '../components/CategoryBadge';

export default function Group() {
  let { group, createGroup, joinGroup } = useGroup();
  let navigate = useNavigate();
  let [mode, setMode] = useState('create');
  let [name, setName] = useState('');
  let [inviteCode, setInviteCode] = useState('');
  let [error, setError] = useState('');
  let [submitting, setSubmitting] = useState(false);
  let [copied, setCopied] = useState(false);

  let [categories, setCategories] = useState([]);
  let [newCatName, setNewCatName] = useState('');
  let [newCatColor, setNewCatColor] = useState('#3B4EFF');
  let [catError, setCatError] = useState('');

  useEffect(() => {
    if (!group) return;
    listCategories(group._id).then((data) => setCategories(data.categories));
  }, [group?._id]);

  async function handleAddCategory(e) {
    e.preventDefault();
    setCatError('');
    try {
      let data = await createCategory(group._id, { name: newCatName, color: newCatColor });
      setCategories([...categories, data.category]);
      setNewCatName('');
    } catch (err) {
      setCatError(err.message);
    }
  }

  async function handleDeleteCategory(categoryId) {
    await deleteCategory(group._id, categoryId);
    setCategories(categories.filter((c) => c._id !== categoryId));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await createGroup(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await joinGroup(inviteCode);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (group) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="header">
            <div className="brand heading">{group.name}</div>
            <div className="tag">Share this code so others can join the Posse</div>
          </div>
          <div style={{ padding: '22px 24px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: 4, color: 'var(--ink)' }}>
                {group.inviteCode}
              </div>
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={copyInviteCode}>
                {copied ? 'Copied!' : 'Copy invite code'}
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Members
              </label>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.members.map((m) => (
                  <li key={m._id} style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{m.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Categories
              </label>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {categories.map((c) => (
                  <li key={c._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CategoryBadge category={c} />
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c._id)}
                      style={{ border: 'none', background: 'none', color: 'var(--ink-soft)', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="New category"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={{ flex: 1, border: '1px solid var(--line)', borderRadius: 12, padding: '8px 10px', fontSize: 13, color: 'var(--ink)', background: 'var(--surface)' }}
                  required
                />
                <input
                  type="color"
                  value={newCatColor}
                  onChange={(e) => setNewCatColor(e.target.value)}
                  style={{ width: 36, height: 36, border: 'none', borderRadius: 8, padding: 0, background: 'none' }}
                />
                <button className="btn-primary" type="submit" style={{ padding: '8px 14px' }}>Add</button>
              </form>
              {catError && <div className="error-text" style={{ marginTop: 6 }}>{catError}</div>}
            </div>
            <button className="btn-primary" onClick={() => navigate('/')}>Go to calendar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="header">
          <div className="brand heading">Posse HQ</div>
          <div className="tag">{mode === 'create' ? 'Start a new group' : 'Join with an invite code'}</div>
        </div>
        {mode === 'create' ? (
          <form onSubmit={handleCreate}>
            <div className="field">
              <label htmlFor="group-name">Group name</label>
              <input id="group-name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating…' : 'Create group'}
            </button>
            <div className="switch-link">
              Have an invite code?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('join'); setError(''); }}>Join a group</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoin}>
            <div className="field">
              <label htmlFor="invite-code">Invite code</label>
              <input
                id="invite-code"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            {error && <div className="error-text">{error}</div>}
            <button className="btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Joining…' : 'Join group'}
            </button>
            <div className="switch-link">
              Starting fresh?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('create'); setError(''); }}>Create a group</a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
