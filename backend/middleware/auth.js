const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('[Auth Middleware] Failed to initialize Supabase client:', err.message);
  }
}


function auth(required = true) {
  return async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) {
      if (required) return res.status(401).json({ error: 'Authentication required' });
      return next();
    }

    const token = header.split(' ')[1];
    try {
      // Try to verify local JWT first
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'local-jwt-secret-key-123');
        if (decoded && decoded.id) {
          const store = require('../data/store');
          const profile = await store.find('users', decoded.id);
          if (profile) {
            req.user = profile;
            return next();
          }
        }
      } catch (jwtErr) {
        // If local JWT check fails, fallback to Supabase authentication below
      }

      if (!supabase) {
        console.error('ERROR: Supabase client is not initialized in backend environment!');
        return res.status(401).json({ error: 'Auth service unreachable (Supabase offline)' });
      }

      let user = null;
      let error = null;
      try {
        const response = await supabase.auth.getUser(token);
        user = response.data?.user;
        error = response.error;
      } catch (err) {
        console.error('Supabase auth.getUser network failed:', err.message);
        return res.status(401).json({ error: 'Auth service connection error: ' + err.message });
      }

      if (error || !user) {
        console.error('Supabase auth.getUser failed:', error ? error.message : 'No user found for token');
        return res.status(401).json({ error: error ? error.message : 'Invalid or expired token' });
      }


      // Fetch user profile fields (role, phone, etc.) from the public users table using resilient store
      const store = require('../data/store');
      let profile = null;
      try {
        profile = await store.find('users', user.id);
      } catch (storeErr) {
        console.warn('[Auth Middleware] Resilient user find failed, using token metadata:', storeErr.message);
      }

      if (!profile) {
        req.user = {
          id: user.id,
          email: user.email ? user.email.trim().toLowerCase() : '',
          name: user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          role: user.user_metadata?.role || 'citizen'
        };
      } else {
        req.user = profile;
      }
      next();
    } catch (err) {
      console.error('Auth middleware exception:', err.message);
      return res.status(401).json({ error: err.message || 'Invalid or expired token' });
    }
  };
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { auth, requireRole };
