/**
 * useAuth Hook
 * Convenience re-export of the auth hook from AuthContext
 */

import { useContext } from 'react';
import AuthContext, { UserProfile } from '../contexts/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Safe version that returns null if not in AuthProvider
 * Use this in components that may render outside auth context
 */
export function useAuthSafe() {
  const context = useContext(AuthContext);
  return context; // Returns null if not in provider
}

export type { UserProfile };
