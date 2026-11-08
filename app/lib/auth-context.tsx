'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { accountRequestHeaders } from './access';

export type UserRole = 'admin' | 'referee' | 'user';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  isRefereeAssigned?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isReady: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (email: string, name: string, password?: string) => Promise<boolean>;
  logout: () => void;
  usersList: Record<string, { name: string; role: UserRole; password?: string }>;
  assignRole: (email: string, role: UserRole) => void;
}

// Built-in credential registry for the system
const DEFAULT_ACCOUNTS: Record<string, { name: string; role: UserRole; password: string }> = {
  'hasfirasya02@gmail.com': {
    name: 'Rasya Hasfi (Admin)',
    role: 'admin',
    password: 'rasya123',
  },
  'referee@example.com': {
    name: 'Alex Referee',
    role: 'referee',
    password: 'referee123',
  },
  'user@example.com': {
    name: 'Hasfi User',
    role: 'user',
    password: 'user123',
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isReady: false,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  usersList: DEFAULT_ACCOUNTS,
  assignRole: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [usersList, setUsersList] = useState<Record<string, { name: string; role: UserRole; password?: string }>>(DEFAULT_ACCOUNTS);

  // Load registry and session from localStorage
  useEffect(() => {
    try {
      const storedUsers = localStorage.getItem('stake_registered_users');
      if (storedUsers) {
        setUsersList({ ...DEFAULT_ACCOUNTS, ...JSON.parse(storedUsers) });
      } else {
        localStorage.setItem('stake_registered_users', JSON.stringify(DEFAULT_ACCOUNTS));
      }

      const saved = localStorage.getItem('stake_auth_user');
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Auth state load error:', e);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Dynamically check if the user is currently nominated as a referee on any active pledge
  useEffect(() => {
    if (!user || user.role === 'admin' || user.role === 'referee') return;

    async function checkRefereeAssignment() {
      try {
          const res = await fetch('/api/pledges?scope=referee', {
            headers: accountRequestHeaders(user),
          });
        if (res.ok) {
          const data = await res.json();
          const pledges = data.pledges || [];
          const userEmail = user?.email?.toLowerCase();
          // Active pledge where this user is appointed as the referee
          const hasActiveRefereePledge = pledges.some(
            (p: any) =>
              p.referee_email?.toLowerCase() === userEmail &&
              ['ACTIVE', 'APPEAL_WINDOW_OPEN', 'RUBRIC_LOCKED'].includes(p.status)
          );

          if (hasActiveRefereePledge && !user.isRefereeAssigned) {
            const updated = { ...user, isRefereeAssigned: true };
            setUser(updated);
            localStorage.setItem('stake_auth_user', JSON.stringify(updated));
          } else if (!hasActiveRefereePledge && user.isRefereeAssigned) {
            const updated = { ...user, isRefereeAssigned: false };
            setUser(updated);
            localStorage.setItem('stake_auth_user', JSON.stringify(updated));
          }
        }
      } catch (e) {
        // Soft fail
      }
    }

    checkRefereeAssignment();
  }, [user?.email, user?.role]);

  const login = async (email: string, password?: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = usersList[normalizedEmail];

    if (!existing) {
      return false;
    }

    // Check password if configured
    if (existing.password && password && existing.password !== password) {
      return false;
    }

    const authUser: AuthUser = {
      email: normalizedEmail,
      name: existing.name || normalizedEmail.split('@')[0],
      role: existing.role,
    };

    setUser(authUser);
    localStorage.setItem('stake_auth_user', JSON.stringify(authUser));
    return true;
  };

  const signup = async (email: string, name: string, password?: string): Promise<boolean> => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // New users default to standard 'user' role until admin verifies/assigns them
    const newUserRecord = {
      name: name.trim() || normalizedEmail.split('@')[0],
      role: (normalizedEmail === 'hasfirasya02@gmail.com' ? 'admin' : 'user') as UserRole,
      password: password || 'password123',
    };

    const updatedRegistry = {
      ...usersList,
      [normalizedEmail]: newUserRecord,
    };

    setUsersList(updatedRegistry);
    localStorage.setItem('stake_registered_users', JSON.stringify(updatedRegistry));

    const authUser: AuthUser = {
      email: normalizedEmail,
      name: newUserRecord.name,
      role: newUserRecord.role,
    };

    setUser(authUser);
    localStorage.setItem('stake_auth_user', JSON.stringify(authUser));
    return true;
  };

  const assignRole = (targetEmail: string, newRole: UserRole) => {
    const normalized = targetEmail.trim().toLowerCase();
    if (!usersList[normalized]) return;

    const updated = {
      ...usersList,
      [normalized]: {
        ...usersList[normalized],
        role: newRole,
      },
    };

    setUsersList(updated);
    localStorage.setItem('stake_registered_users', JSON.stringify(updated));

    // If active user is the one being updated, synchronize state immediately
    if (user && user.email.toLowerCase() === normalized) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem('stake_auth_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stake_auth_user');
  };

  return (
      <AuthContext.Provider value={{ user, isReady, login, signup, logout, usersList, assignRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
