import { useState, useEffect } from 'react';
import { listComments, createComment, deleteComment } from '../api/comments';

export default function CommentThread({ groupId, eventId, currentUserId, onCountChange }) {
  let [comments, setComments] = useState([]);
  let [text, setText] = useState('');
  let [error, setError] = useState('');

  useEffect(() => {
    listComments(groupId, eventId).then((data) => {
      setComments(data.comments);
      onCountChange?.(data.comments.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, eventId]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      let data = await createComment(groupId, eventId, text);
      let next = [...comments, data.comment];
      setComments(next);
      onCountChange?.(next.length);
      setText('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(commentId) {
    await deleteComment(groupId, eventId, commentId);
    let next = comments.filter((c) => c._id !== commentId);
    setComments(next);
    onCountChange?.(next.length);
  }

  return (
    <div className="thread">
      <label className="thread-label">Comments</label>
      <div className="thread-list">
        {comments.length === 0 && <div className="thread-empty">No comments yet.</div>}
        {comments.map((c) => (
          <div className="thread-item" key={c._id}>
            <div className="thread-item-head">
              <span className="thread-author">{c.userId.name}</span>
              {c.userId._id === currentUserId && (
                <button type="button" className="thread-delete" onClick={() => handleDelete(c._id)}>
                  Delete
                </button>
              )}
            </div>
            <div className="thread-text">{c.text}</div>
          </div>
        ))}
      </div>
      <form className="thread-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button className="btn-secondary" type="submit" style={{ padding: '8px 14px' }}>
          Post
        </button>
      </form>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
}
