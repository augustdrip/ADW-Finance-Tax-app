/**
 * App Router
 * Main routing configuration for the SaaS app
 * Handles auth, onboarding, admin, and main app routes
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard, AdminGuard, OnboardingGuard } from './components/auth/AuthGuard';
import { LoginPage } from './components/auth/LoginPage';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow';
import { AdminDashboard } from './components/admin/AdminDashboard';

// Import the main app (will be wrapped)
// We'll dynamically import the main App component
interface AppRouterProps {
  MainApp: React.ComponentType;
}

export function AppRouter({ MainApp }: AppRouterProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Onboarding (requires auth, doesn't require completed onboarding) */}
          <Route 
            path="/onboarding/*" 
            element={
              <OnboardingGuard>
                <OnboardingFlow />
              </OnboardingGuard>
            } 
          />
          
          {/* Admin routes (requires admin role) */}
          <Route 
            path="/admin/*" 
            element={
              <AdminGuard>
                <AdminRoutes />
              </AdminGuard>
            } 
          />
          
          {/* Main app (requires auth and completed onboarding) */}
          <Route 
            path="/*" 
            element={
              <AuthGuard>
                <MainApp />
              </AuthGuard>
            } 
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

// Admin sub-routes
function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<AdminDashboard />} />
      <Route path="/expenses" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default AppRouter;
