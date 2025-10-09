import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const getSupabaseConfig = () => {
  const extra =
    Constants?.expoConfig?.extra ||
    Constants?.manifest?.extra ||
    {};

  const url =
    extra?.supabaseUrl ||
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const anonKey =
    extra?.supabaseAnonKey ||
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      'Supabase credentials not found. Configure supabaseUrl and supabaseAnonKey in expo extra or EXPO_PUBLIC env vars.'
    );
  }

  return { url, anonKey };
};

const { url, anonKey } = getSupabaseConfig();

const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;

