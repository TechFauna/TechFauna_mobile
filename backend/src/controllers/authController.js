import supabase from '../services/supabaseClient.js';

export default class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) return res.status(401).json({ error: error.message || 'Auth failed' });

      return res.json({ user: data.user, session: data.session });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }

  async register(req, res) {
    try {
      const { email, password, user_metadata } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: user_metadata || {} },
      });

      if (error) return res.status(400).json({ error: error.message || 'Registration failed' });

      return res.status(201).json({ user: data.user });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
}