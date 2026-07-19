import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

let THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function Settings() {
  let { user, logout } = useAuth();
  let { preference, setPreference } = useTheme();
  let navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="header">
          <div className="brand heading">Settings</div>
          <div className="tag">{user.name} · {user.email}</div>
        </div>
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--ink-soft)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Theme
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={preference === opt.value ? 'btn-primary' : 'btn-secondary'}
                  style={{ flex: 1, padding: '10px 0', fontSize: 12 }}
                  onClick={() => setPreference(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/')}>Back to calendar</button>
          <button className="btn-secondary" onClick={logout}>Log out</button>
        </div>
      </div>
    </div>
  );
}
