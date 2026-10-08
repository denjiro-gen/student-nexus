import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { authAPI, userAPI } from '../services/api';
import Constants from 'expo-constants';


const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Safety net: if onAuthStateChange never fires (e.g. network issue), stop loading after 6s
    const timeout = setTimeout(() => setLoading(false), 6000);

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        // Skip silent background events — they don't require a UI reload
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          // Just silently update the session object without re-rendering the whole app
          setSession(sess);
          clearTimeout(timeout);
          return;
        }

        console.log('Auth state changed:', event);
        clearTimeout(timeout);
        setSession(sess);
        setUser(sess?.user ?? null);

        if (event === 'SIGNED_OUT') {
          setUserProfile(null);
          setLoading(false);
          return;
        }

        if (sess?.user) {
          await loadUserProfile(sess.user.id);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );
    return () => {
      clearTimeout(timeout);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId) => {
    try {

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Profile query warning:', error.message);
      }

      if (!data) {
        const { data: authUser } = await authAPI.getCurrentUser();
        const meta = authUser?.user?.user_metadata || {};
        const newProfile = {
          id: userId,
          email: authUser?.user?.email || '',
          full_name: meta.full_name || authUser?.user?.email?.split('@')[0] || 'Student',
          role: meta.role || 'student',
          password_hash: 'SUPABASE_AUTH_MANAGED',
        };


        const { error: insertErr } = await supabase
          .from('users')
          .upsert(newProfile, { onConflict: 'id', ignoreDuplicates: true });
        if (insertErr) console.warn('Auto-upsert warning:', insertErr.message);

        setUserProfile({ ...newProfile, user_id: userId, created_at: authUser?.user?.created_at || null });
      } else {
        setUserProfile({ ...data, user_id: data.id });
      }

      // Register for Push Notifications
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          supabase.from('users').update({ expo_push_token: token }).eq('id', userId).then();
        }
      });

    } catch (err) {
      console.error('Profile load error:', err);
      setUserProfile({ id: userId, username: 'Student', role: 'student', email: '' });
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await authAPI.signIn(email, password);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Push token registration is handled via EAS production builds only.
  // In Expo Go, expo-notifications is not supported. In-app notifications
  // are delivered through the Supabase 'notifications' table instead.
  const registerForPushNotificationsAsync = async () => null;

  const signUp = async (email, password, userData) => {
    try {
      // Map role to only accepted safe values before sending to auth
      const VALID_ROLES = ['osas_admin', 'student_leader', 'student', 'advisor'];
      const rawRole = userData.role || 'student_leader';
      const safeRole = VALID_ROLES.includes(rawRole) ? rawRole : 'student_leader';

      // Step 1: Create the Supabase auth user with minimal metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: 'https://websites-khaki-rho.vercel.app/',
          data: {
            full_name: userData.full_name || email.split('@')[0],
            role: safeRole,
          },
        },
      });
      if (error) throw error;

      // Step 2: Insert the public profile row (non-blocking — won't fail the signup)
      if (data?.user) {
        const profilePayload = {
          id: data.user.id,
          email: email,
          full_name: userData.full_name || email.split('@')[0],
          role: safeRole,
          student_id: userData.student_id || null,
          password_hash: 'SUPABASE_AUTH_MANAGED',
        };

        const { error: profileError } = await supabase
          .from('users')
          .upsert(profilePayload, { onConflict: 'id' });

        if (profileError) {
          console.warn('Profile insert warning (non-fatal):', profileError.message);
        }

        // Step 3: Link org membership for student leaders
        if (userData.organization_id) {
          const { error: orgErr } = await supabase
            .from('organization_members')
            .insert({
              user_id: data.user.id,
              organization_id: userData.organization_id,
              position: userData.position || 'Member',
              is_active: true,
            });
          if (orgErr) console.warn('Org assign warning (non-fatal):', orgErr.message);
        }
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await authAPI.signOut();
      if (error) throw error;
      setUser(null);
      setUserProfile(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://cdm-osas.vercel.app/success',
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    userProfile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshProfile: () => user && loadUserProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
