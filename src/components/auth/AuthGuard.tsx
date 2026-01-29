/**
 * Auth Guard Component
 * Protects routes that require authentication
 * Redirects to login if not authenticated
 * Redirects to onboarding if onboarding not completed
 */

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: ReactNode;
  requireOnboarding?: boolean;
  requireAdmin?: boolean;
  requireADWMember?: boolean;
}

export function AuthGuard({ 
  children, 
  requireOnboarding = true,
  requireAdmin = false,
  requireADWMember = false 
}: AuthGuardProps) {
  const { user, profile, loading, isAdmin, isADWMember } = useAuth();
  const location = useLocation();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-indigo-600 rounded-xl">
              <ShieldCheck size={32} className="text-white" />
            </div>
          </div>
          <Loader2 size={32} className="animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin access
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Check ADW member access
  if (requireADWMember && !isADWMember) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if not completed (unless we're already on onboarding)
  if (requireOnboarding && profile && !profile.onboarding_completed) {
    if (!location.pathname.startsWith('/onboarding')) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  return <>{children}</>;
}

/**
 * Admin Guard - Only allows admin users
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAdmin={true} requireOnboarding={false}>
      {children}
    </AuthGuard>
  );
}

/**
 * ADW Member Guard - Only allows ADW team members
 */
export function ADWMemberGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireADWMember={true}>
      {children}
    </AuthGuard>
  );
}

/**
 * Onboarding Guard - For onboarding flow (doesn't require completed onboarding)
 */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireOnboarding={false}>
      {children}
    </AuthGuard>
  );
}

export default AuthGuard;
