import { Navigate } from 'react-router-dom';
import { useGroup } from '../context/GroupContext';

export default function RequireGroup({ children }) {
  let { group, loading } = useGroup();
  if (loading) return <div className="page-loading">Loading…</div>;
  if (!group) return <Navigate to="/group" replace />;
  return children;
}
