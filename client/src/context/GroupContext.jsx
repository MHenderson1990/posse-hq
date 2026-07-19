import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from './AuthContext';

let GroupContext = createContext(null);

export function GroupProvider({ children }) {
  let { user, loading: authLoading } = useAuth();
  let [group, setGroup] = useState(null);
  let [loading, setLoading] = useState(true);

  let refreshGroup = useCallback(async () => {
    if (!user) {
      setGroup(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let data = await apiFetch('/groups/mine');
      setGroup(data.groups[0] || null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refreshGroup();
  }, [authLoading, refreshGroup]);

  async function createGroup(name) {
    let data = await apiFetch('/groups', { method: 'POST', body: JSON.stringify({ name }) });
    setGroup(data.group);
    return data.group;
  }

  async function joinGroup(inviteCode) {
    let data = await apiFetch('/groups/join', { method: 'POST', body: JSON.stringify({ inviteCode }) });
    setGroup(data.group);
    return data.group;
  }

  let value = { group, loading, createGroup, joinGroup, refreshGroup };
  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
}

export function useGroup() {
  let ctx = useContext(GroupContext);
  if (!ctx) throw new Error('useGroup must be used within a GroupProvider');
  return ctx;
}
