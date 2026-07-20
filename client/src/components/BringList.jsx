import { useState, useEffect } from 'react';
import { listBringItems, addBringItem, claimBringItem, unclaimBringItem, deleteBringItem } from '../api/bringItems';

export default function BringList({ groupId, eventId, currentUserId }) {
  let [items, setItems] = useState([]);
  let [label, setLabel] = useState('');
  let [error, setError] = useState('');

  useEffect(() => {
    listBringItems(groupId, eventId).then((data) => setItems(data.items));
  }, [groupId, eventId]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      let data = await addBringItem(groupId, eventId, label);
      setItems([...items, data.item]);
      setLabel('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleClaim(item) {
    let data = item.claimedBy
      ? await unclaimBringItem(groupId, eventId, item._id)
      : await claimBringItem(groupId, eventId, item._id);
    setItems(items.map((i) => (i._id === item._id ? data.item : i)));
  }

  async function handleDelete(itemId) {
    await deleteBringItem(groupId, eventId, itemId);
    setItems(items.filter((i) => i._id !== itemId));
  }

  return (
    <div className="thread">
      <label className="thread-label">Bring list</label>
      <div className="thread-list">
        {items.length === 0 && <div className="thread-empty">Nothing on the list yet.</div>}
        {items.map((item) => {
          let mine = item.claimedBy?._id === currentUserId;
          return (
            <div className="bring-item" key={item._id}>
              <button
                type="button"
                className={'bring-check' + (item.claimedBy ? ' checked' : '')}
                onClick={() => handleToggleClaim(item)}
                title={item.claimedBy ? `Claimed by ${item.claimedBy.name}` : 'Claim this item'}
              >
                {item.claimedBy ? '✓' : ''}
              </button>
              <div style={{ flex: 1 }}>
                <div className={'bring-label' + (item.claimedBy ? ' claimed' : '')}>{item.label}</div>
                {item.claimedBy && <div className="bring-by">{mine ? 'You' : item.claimedBy.name}</div>}
              </div>
              <button type="button" className="thread-delete" onClick={() => handleDelete(item._id)}>
                Remove
              </button>
            </div>
          );
        })}
      </div>
      <form className="thread-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add an item…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          required
        />
        <button className="btn-primary" type="submit" style={{ padding: '8px 14px' }}>
          Add
        </button>
      </form>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
