'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'referee' | 'user';

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, role?: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Read persisted session or default to null (logged out)
    const saved = localStorage.getItem('stake_auth_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
        return;
      } catch (e) {}
    }
    // Default: not logged in until user signs in or picks a demo profile
    setUser(null);
  }, []);

  const login = (email: string, role?: UserRole) => {
    let determinedRole: UserRole = role || 'user';
    let name = email.split('@')[0];

    if (email.toLowerCase() === 'hasfirasya02@gmail.com') {
      determinedRole = 'admin';
      name = 'Hasfi (Admin)';
    } else if (email.toLowerCase().includes('referee') || role === 'referee') {
      determinedRole = 'referee';
      name = 'Referee Account';
    }

    const newUser: AuthUser = {
      email,
      name,
      role: determinedRole,
    };
    setUser(newUser);
    localStorage.setItem('stake_auth_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stake_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

