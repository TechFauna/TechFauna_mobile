import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const run = async () => {
  try {
    const email = process.env.SEED_EMAIL || 'allowed@example.com';
    const password = process.env.SEED_PASSWORD || 'StrongPassword123!';
    const user_meta = { role: 'tester' };

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: user_meta,
    });

    if (error) {
      console.error('Seed error:', error.message || error);
      process.exit(1);
    }

    console.log('Seed user created:', data.user?.id || data);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();