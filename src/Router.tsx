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

// Auth callback handler for OAuth redirects
function AuthCallback() {
  const [status, setStatus] = React.useState('Processing login...');
  const [redirect, setRedirect] = React.useState<string | null>(null);
  
  // ADW team emails
  const ADW_EMAILS = [
    'ali@agencydevworks.ai',
    'mario@agencydevworks.ai',
    'sajjad@agencydevworks.ai',
    'mustafa@agencydevworks.ai',
    'hassanain@agencydevworks.ai',
    'diego@agencydevworks.ai',
  ];
  
  const isADWMember = (email: string | undefined) => {
    if (!email) return false;
    const lowerEmail = email.toLowerCase();
    return ADW_EMAILS.includes(lowerEmail) || lowerEmail.endsWith('@agencydevworks.ai');
  };
  
  React.useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    
    const handleCallback = async () => {
      if (!mounted) return;
      
      console.log('[AuthCallback] Processing... (attempt', retryCount + 1, ')');
      console.log('[AuthCallback] Hash:', window.location.hash);
      
      try {
        // Check for error in hash params first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (errorParam) {
          console.error('[AuthCallback] OAuth error:', errorParam, errorDescription);
          setStatus(`Login failed: ${errorDescription || errorParam}`);
          setTimeout(() => setRedirect('/login'), 2000);
          return;
        }
        
        // Import supabase
        const { getSupabaseClient } = await import('../services/supabaseService');
        const supabase = getSupabaseClient();
        
        if (!supabase) {
          console.error('[AuthCallback] Supabase not available');
          setStatus('Configuration error');
          setTimeout(() => setRedirect('/login'), 2000);
          return;
        }
        
        setStatus('Verifying session...');
        
        // Check if there are tokens in the URL that need processing
        const hasTokens = hashParams.has('access_token');
        console.log('[AuthCallback] Has tokens:', hasTokens);
        
        if (hasTokens) {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          
          if (accessToken) {
            console.log('[AuthCallback] Setting session from URL tokens...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            });
            
            if (error) {
              console.error('[AuthCallback] Session error:', error);
              setStatus('Authentication failed');
              setTimeout(() => setRedirect('/login'), 2000);
              return;
            }
            
            if (data.session?.user) {
              const email = data.session.user.email;
              console.log('[AuthCallback] Logged in as:', email);
              
              // Clear hash from URL
              window.history.replaceState({}, '', window.location.pathname);
              
              // Wait a moment to ensure session is persisted
              await new Promise(r => setTimeout(r, 500));
              
              if (isADWMember(email)) {
                setStatus('Welcome! Loading dashboard...');
                setRedirect('/');
              } else {
                // Check onboarding status
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('onboarding_completed')
                  .eq('id', data.session.user.id)
                  .single();
                
                if (profile?.onboarding_completed) {
                  setStatus('Welcome back!');
                  setRedirect('/');
                } else {
                  setStatus('Let\'s get you set up...');
                  setRedirect('/onboarding');
                }
              }
              return;
            }
          }
        }
        
        // No tokens - check existing session
        console.log('[AuthCallback] No tokens, checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('[AuthCallback] Found session:', session.user.email);
          
          if (isADWMember(session.user.email)) {
            setRedirect('/');
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('onboarding_completed')
              .eq('id', session.user.id)
              .single();
            
            setRedirect(profile?.onboarding_completed ? '/' : '/onboarding');
          }
          return;
        }
        
        // No session
        console.log('[AuthCallback] No session found');
        setStatus('Session not found');
        setTimeout(() => setRedirect('/login'), 1500);
        
      } catch (err: any) {
        // Ignore abort errors (React strict mode) - retry up to 3 times
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          retryCount++;
          if (retryCount < 3 && mounted) {
            console.log('[AuthCallback] Aborted, retry', retryCount);
            setTimeout(handleCallback, 500);
            return;
          }
        }
        console.error('[AuthCallback] Error:', err);
        setStatus('Error occurred');
        setTimeout(() => { if (mounted) setRedirect('/login'); }, 2000);
      }
    };
    
    // Delay start slightly to handle React strict mode
    const timer = setTimeout(handleCallback, 200);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);
  
  // Use Navigate for redirect (keeps React Router context)
  if (redirect) {
    return <Navigate to={redirect} replace />;
  }
  
  return (
    <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-slate-400">{status}</p>
      </div>
    </div>
  );
}

export function AppRouter({ MainApp }: AppRouterProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Auth callback for OAuth redirects */}
          <Route path="/auth/callback" element={<AuthCallback />} />
          
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
