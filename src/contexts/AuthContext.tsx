/**
 * Authentication Context
 * Provides auth state and methods throughout the app
 * Uses Supabase Auth for Google, Email, and Phone authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '../../services/supabaseService';

// User profile from our profiles table
export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  role: 'user' | 'admin' | 'adw_member';
  onboarding_completed: boolean;
  plaid_access_token: string | null;
  created_at: string;
  updated_at: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, token: string) => Promise<void>;
  devLogin: () => void;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  isAdmin: boolean;
  isADWMember: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Auth Provider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  const supabase = getSupabaseClient();

  // Fetch user profile from profiles table
  const fetchProfile = async (userId: string) => {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('[Auth] Error fetching profile:', error);
        return null;
      }
      
      return data as UserProfile | null;
    } catch (e) {
      console.error('[Auth] Profile fetch failed:', e);
      return null;
    }
  };

  // Create profile for new user
  const createProfile = async (user: User) => {
    if (!supabase) return null;
    
    try {
      const newProfile: Partial<UserProfile> = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || null,
        company_name: null,
        role: 'user',
        onboarding_completed: false,
        plaid_access_token: null
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();
      
      if (error) {
        console.error('[Auth] Error creating profile:', error);
        return null;
      }
      
      return data as UserProfile;
    } catch (e) {
      console.error('[Auth] Profile creation failed:', e);
      return null;
    }
  };

  // Dev mode login - bypasses real auth for development
  const devLogin = () => {
    const mockUser = {
      id: 'dev-user-123',
      email: 'dev@localhost',
      user_metadata: { full_name: 'Dev User' }
    } as User;
    
    const mockProfile: UserProfile = {
      id: 'dev-user-123',
      email: 'dev@localhost',
      full_name: 'Dev User',
      company_name: 'Dev Company',
      role: 'admin',
      onboarding_completed: true,
      plaid_access_token: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setUser(mockUser);
    setProfile(mockProfile);
    setLoading(false);
    console.log('[Auth] Dev mode login - bypassed real authentication');
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    
    // DEV MODE: Check for dev bypass in URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const isDevBypass = urlParams.get('dev') === 'true' || localStorage.getItem('dev_mode') === 'true';
    
    if (isDevBypass && import.meta.env.DEV) {
      console.log('[Auth] Dev bypass detected - skipping Supabase auth');
      localStorage.setItem('dev_mode', 'true');
      devLogin();
      return;
    }

    if (!supabase) {
      console.warn('[Auth] Supabase not configured');
      setLoading(false);
      return;
    }

    // Get initial session
    const initAuth = async () => {
      try {
        console.log('[Auth] Checking session...');
        
        const { data: { session }, error } = await supabase!.auth.getSession();
        
        // Ignore abort errors (caused by React strict mode)
        if (error && error.message?.includes('aborted')) {
          console.log('[Auth] Request aborted (strict mode), ignoring');
          return;
        }
        
        if (!mounted) return;
        
        if (error) {
          console.warn('[Auth] Session error:', error.message);
        }
        
        console.log('[Auth] Session:', session ? session.user.email : 'none');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && mounted) {
          // Fetch profile in background
          fetchProfile(session.user.id).then(async (userProfile) => {
            if (!mounted) return;
            if (userProfile) {
              const email = session.user.email?.toLowerCase();
              const isADW = email?.endsWith('@agencydevworks.ai');
              if (isADW && !userProfile.onboarding_completed) {
                await supabase!.from('profiles').update({ 
                  onboarding_completed: true,
                  role: 'adw_member'
                }).eq('id', session.user.id);
                userProfile.onboarding_completed = true;
                userProfile.role = 'adw_member';
              }
              setProfile(userProfile);
            }
          }).catch(() => {});
        }
      } catch (err: any) {
        // Ignore abort errors
        if (err?.name === 'AbortError' || err?.message?.includes('aborted')) {
          return;
        }
        console.warn('[Auth] Init error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Small delay to let React strict mode settle
    const timer = setTimeout(initAuth, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timer);
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        
        if (session?.user) {
          let userProfile = await fetchProfile(session.user.id);
          
          // Create profile if it doesn't exist (new user)
          if (!userProfile && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
            userProfile = await createProfile(session.user);
          }
          
          // Auto-complete onboarding for ADW members
          const email = session.user.email?.toLowerCase();
          const isADW = email?.endsWith('@agencydevworks.ai');
          if (isADW && userProfile && !userProfile.onboarding_completed) {
            console.log('[Auth] ADW member signed in, auto-completing onboarding');
            await supabase!.from('profiles').update({ 
              onboarding_completed: true,
              role: 'adw_member'
            }).eq('id', session.user.id);
            userProfile.onboarding_completed = true;
            userProfile.role = 'adw_member';
          }
          
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Sign in with Google - allows any Google account
  const signInWithGoogle = async () => {
    console.log('[Auth] signInWithGoogle called');
    
    if (!supabase) {
      console.error('[Auth] Supabase not configured!');
      setError({ message: 'Supabase not configured', status: 500 } as AuthError);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const redirectUrl = `${window.location.origin}/auth/callback`;
    console.log('[Auth] Redirecting to Google OAuth with callback:', redirectUrl);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      console.log('[Auth] OAuth response:', { data, error });
      
      if (error) {
        console.error('[Auth] OAuth error:', error);
        setError(error);
        setLoading(false);
      } else if (data?.url) {
        console.log('[Auth] Redirecting to:', data.url);
        // The redirect should happen automatically, but just in case
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('[Auth] OAuth exception:', e);
      setError({ message: String(e), status: 500 } as AuthError);
      setLoading(false);
    }
  };

  // Sign in with email/password
  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      setError({ message: 'Supabase not configured', status: 500 } as AuthError);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  // Sign up with email/password
  const signUpWithEmail = async (email: string, password: string, fullName?: string) => {
    if (!supabase) {
      setError({ message: 'Supabase not configured', status: 500 } as AuthError);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${window.location.origin}/onboarding`
      }
    });
    
    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  // Sign in with phone (sends OTP)
  const signInWithPhone = async (phone: string) => {
    if (!supabase) {
      setError({ message: 'Supabase not configured', status: 500 } as AuthError);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone
    });
    
    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  // Verify OTP for phone auth
  const verifyOtp = async (phone: string, token: string) => {
    if (!supabase) {
      setError({ message: 'Supabase not configured', status: 500 } as AuthError);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms'
    });
    
    if (error) {
      setError(error);
    }
    setLoading(false);
  };

  // Sign out
  const signOut = async () => {
    if (!supabase) return;
    
    console.log('[Auth] Signing out...');
    
    // Clear user-specific localStorage data to ensure clean slate on next login
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.includes('_') && (
        key.startsWith('mercury_') || 
        key.startsWith('plaid_') || 
        key.startsWith('creditcard_') ||
        key.startsWith('agreements_') ||
        key.startsWith('invoices_') ||
        key.startsWith('assets_')
      )
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    
    console.log('[Auth] Signed out, redirecting to login...');
    
    // Force redirect to login page
    window.location.href = '/login';
  };

  // Update user profile
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) throw error;
      
      setProfile(data as UserProfile);
    } catch (e) {
      console.error('[Auth] Profile update failed:', e);
    }
  };

  // ADW team emails that have access to the shared Mercury account
  const ADW_TEAM_EMAILS = [
    'ali@agencydevworks.ai',
    'mario@agencydevworks.ai',
    'sajjad@agencydevworks.ai',
    'mustafa@agencydevworks.ai',
    'hassanain@agencydevworks.ai',
    'diego@agencydevworks.ai',
  ];
  
  // Check if user is an ADW team member by email
  const checkIsADWMember = () => {
    const email = user?.email?.toLowerCase();
    if (!email) return false;
    
    // Check explicit team list or @agencydevworks.ai domain
    return ADW_TEAM_EMAILS.includes(email) || email.endsWith('@agencydevworks.ai');
  };
  
  // Computed properties
  const isAdmin = profile?.role === 'admin';
  const isADWMember = checkIsADWMember() || profile?.role === 'adw_member' || profile?.role === 'admin';

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInWithPhone,
    verifyOtp,
    signOut,
    updateProfile,
    devLogin,
    isAdmin,
    isADWMember
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
