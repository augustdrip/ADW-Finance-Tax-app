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

  // Initialize auth state
  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then(setProfile);
      }
      
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        setError(null);
        
        if (session?.user) {
          let userProfile = await fetchProfile(session.user.id);
          
          // Create profile if it doesn't exist (new user)
          if (!userProfile && event === 'SIGNED_IN') {
            userProfile = await createProfile(session.user);
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

  // Sign in with Google
  const signInWithGoogle = async () => {
    if (!supabase) {
      setError({ message: 'Supabase not configured', status: 500 } as AuthError);
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/onboarding`
      }
    });
    
    if (error) {
      setError(error);
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
    
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setLoading(false);
    
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

  // Computed properties
  const isAdmin = profile?.role === 'admin';
  const isADWMember = profile?.role === 'adw_member' || profile?.role === 'admin';

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
