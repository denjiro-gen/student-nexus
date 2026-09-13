import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';


const SUPABASE_URL = 'https://xyclopokakqynnjxemrh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Y2xvcG9rYWtxeW5uanhlbXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NzczNDMsImV4cCI6MjA5NzQ1MzM0M30.xTh50F64-1Broftt77hmuB9_eafIL36q0LochocbPJA';


export const isSupabaseConfigured = () => {
  return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
         SUPABASE_ANON_KEY !== 'your-anon-key-here' &&
         SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
         SUPABASE_URL.startsWith('https://') &&
         SUPABASE_URL.includes('supabase.co');
};


let supabase;
try {
  if (isSupabaseConfigured()) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  } else {
    
    supabase = {
      auth: {
        signInWithPassword: async () => ({ data: null, error: { message: 'Please configure Supabase' } }),
        signUp: async () => ({ data: null, error: { message: 'Please configure Supabase' } }),
        signOut: async () => ({ error: { message: 'Please configure Supabase' } }),
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: null, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      from: () => ({
        select: () => ({ data: [], error: null }),
        insert: () => ({ data: null, error: null }),
        update: () => ({ data: null, error: null }),
        delete: () => ({ error: null }),
      }),
    };
  }
} catch (error) {
  console.warn('Supabase initialization error:', error.message);
  
  supabase = {
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: { message: 'Supabase not configured' } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: null, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ error: null }),
    }),
  };
}

export { supabase };
