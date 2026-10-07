const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { createClient } = require('@supabase/supabase-js');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('[Auth Route] Failed to initialize Supabase client:', err.message);
  }
}


async function getOrMergeUserProfile(newId, email, fallbackMetadata = {}) {
  if (!email) {
    throw new Error('Email is required to get or merge user profile');
  }
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Try to find by new ID
  let user = await store.find('users', newId);
  if (user) {
    if (user.email.trim().toLowerCase() === normalizedEmail) {
      return user;
    }
    // Handle temp email from a partially completed merge
    if (user.email.startsWith('temp-')) {
      const updated = await store.update('users', newId, { email: normalizedEmail });
      return updated;
    }
    return user;
  }

  // 2. Check by email (case-insensitively)
  const existingUsers = await store.findBy('users', 'email', normalizedEmail);
  let existingUser = existingUsers.length > 0 ? existingUsers[0] : null;

  // Fallback to case-insensitive match by searching all users if eq search failed
  if (!existingUser) {
    const allUsers = await store.get('users');
    existingUser = allUsers.find(u => u.email.trim().toLowerCase() === normalizedEmail) || null;
  }

  if (existingUser) {
    // If the ID matches, return it
    if (existingUser.id === newId) {
      return existingUser;
    }

    console.log(`Merging user account for ${normalizedEmail} from old ID ${existingUser.id} to new ID ${newId}`);
    
    // Create new profile object with a temporary unique email to satisfy unique constraint during insert
    const tempEmail = `temp-${newId}-${Date.now()}@smartcity.gov`;
    const newProfile = {
      id: newId,
      name: existingUser.name || fallbackMetadata.name || 'Smart Citizen',
      email: tempEmail,
      password: existingUser.password || '',
      phone: existingUser.phone || fallbackMetadata.phone || '',
      role: existingUser.role || fallbackMetadata.role || 'citizen',
      googleId: fallbackMetadata.googleId || existingUser.googleId || null,
      picture: fallbackMetadata.picture || existingUser.picture || null
    };

    // A. Insert the new user with new ID and temp email
    try {
      user = await store.add('users', newProfile);
    } catch (err) {
      // If insertion fails (e.g. key already exists from concurrent request), fetch it
      user = await store.find('users', newId);
      if (!user) throw err;
    }

    // B. Point referencing rows directly to the new user ID
    const tables = ['complaints', 'utilityBills', 'tickets', 'emergencies'];
    for (const table of tables) {
      try {
        const rows = await store.findBy(table, 'userId', existingUser.id);
        for (const row of rows) {
          await store.update(table, row.id, { userId: newId });
        }
      } catch (err) {
        console.warn(`Failed to update ${table} referencing ${existingUser.id} to ${newId}:`, err.message);
      }
    }

    // C. Safely delete the old user (references have been moved)
    try {
      await store.remove('users', existingUser.id);
    } catch (err) {
      console.warn(`Failed to remove old user profile ${existingUser.id}:`, err.message);
    }

    // D. Update the new user's email to the correct normalized email
    try {
      user = await store.update('users', newId, { email: normalizedEmail });
    } catch (err) {
      console.error(`Failed to restore correct email ${normalizedEmail} for ${newId}:`, err.message);
      throw err;
    }

    return user;
  }

  // 3. If email doesn't exist either, create a fresh profile
  const freshProfile = {
    id: newId,
    name: fallbackMetadata.name || 'Smart Citizen',
    email: normalizedEmail,
    password: '',
    phone: fallbackMetadata.phone || '',
    role: fallbackMetadata.role || 'citizen'
  };
  
  try {
    return await store.add('users', freshProfile);
  } catch (err) {
    const checkUser = await store.find('users', newId);
    if (checkUser) return checkUser;
    throw err;
  }
}

// Register a new citizen
router.post('/register', async (req, res, next) => {
  const { name, email, password, phone, role = 'citizen' } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Sign up the user in Supabase Auth
    let authData = null;
    let authError = null;

    if (supabase) {
      try {
        const response = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              name,
              phone: phone || '',
              role: role === 'admin' ? 'admin' : 'citizen'
            }
          }
        });
        authData = response.data;
        authError = response.error;
      } catch (err) {
        console.warn('[Register] Supabase signUp failed with network exception, falling back locally:', err.message);
        authError = { message: err.message || 'Supabase connection failed' };
      }
    } else {
      authError = { message: 'Supabase service is offline' };
    }


    if (authError) {
      // Fallback: local signup in db if Supabase rate limits or fails
      const existing = await store.findBy('users', 'email', normalizedEmail);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync(password, 10);
      const newId = uuidv4();

      const freshProfile = {
        id: newId,
        name,
        email: normalizedEmail,
        password: hashedPassword,
        phone: phone || '',
        role: role === 'admin' ? 'admin' : 'citizen'
      };

      const created = await store.add('users', freshProfile);
      const jwt = require('jsonwebtoken');
      const localToken = jwt.sign(
        { id: created.id, email: created.email },
        process.env.JWT_SECRET || 'local-jwt-secret-key-123',
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        token: localToken,
        user: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          phone: created.phone
        }
      });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user account' });
    }

    // 2. Add or merge profile in the public users table
    let created;
    try {
      created = await getOrMergeUserProfile(authData.user.id, normalizedEmail, {
        name,
        phone: phone || '',
        role: role === 'admin' ? 'admin' : 'citizen'
      });
    } catch (dbErr) {
      console.error('Database getOrMergeUserProfile failed in /register:', dbErr.message);
      return res.status(500).json({ error: 'Failed to create database profile: ' + dbErr.message });
    }

    res.status(201).json({
      token: authData.session?.access_token || '',
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
        phone: created.phone
      }
    });
  } catch (err) {
    next(err);
  }
});

// Login citizen
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1. Sign in with Supabase Auth
    let authData = null;
    let authError = null;

    if (supabase) {
      try {
        const response = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        authData = response.data;
        authError = response.error;
      } catch (err) {
        console.warn('[Login] Supabase signInWithPassword failed with network exception, falling back locally:', err.message);
        authError = { message: err.message || 'Supabase connection failed' };
      }
    } else {
      authError = { message: 'Supabase service is offline' };
    }


    if (authError) {
      // Fallback: Verify password locally if Supabase login fails (e.g. for seed users or rate limit)
      const users = await store.findBy('users', 'email', normalizedEmail);
      const user = users.find(u => u.email.trim().toLowerCase() === normalizedEmail);
      if (user && user.password) {
        const bcrypt = require('bcryptjs');
        const isMatch = bcrypt.compareSync(password, user.password);
        if (isMatch) {
          const jwt = require('jsonwebtoken');
          const localToken = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET || 'local-jwt-secret-key-123',
            { expiresIn: '24h' }
          );
          return res.json({
            token: localToken,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              phone: user.phone
            }
          });
        }
      }
      return res.status(401).json({ error: authError.message });
    }

    // 2. Fetch/create public user profile
    let profile;
    try {
      profile = await getOrMergeUserProfile(authData.user.id, authData.user.email, {
        name: authData.user.user_metadata?.name,
        phone: authData.user.user_metadata?.phone,
        role: authData.user.user_metadata?.role
      });
    } catch (dbErr) {
      console.error('Failed to get/merge user profile in /login:', dbErr.message);
      return res.status(500).json({ error: 'Database operations failed: ' + dbErr.message });
    }

    res.json({
      token: authData.session.access_token,
      user: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
        phone: profile.phone
      }
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', auth(), async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User context is missing' });
    }

    let user;
    try {
      user = await getOrMergeUserProfile(req.user.id, req.user.email, {
        name: req.user.name,
        phone: req.user.phone,
        role: req.user.role
      });
    } catch (dbErr) {
      console.error('Failed to get/merge user profile in /me:', dbErr.message);
      return res.status(500).json({ error: 'Database operations failed: ' + dbErr.message });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone });
  } catch (err) {
    console.error('Exception in /me endpoint:', err);
    next(err);
  }
});

// Update self profile
router.patch('/profile', auth(), async (req, res, next) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  try {
    const updated = await store.update('users', req.user.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json({ id: updated.id, name: updated.name, email: updated.email, role: updated.role, phone: updated.phone });
  } catch (err) {
    next(err);
  }
});

// Change user password
router.post('/change-password', auth(), async (req, res, next) => {
  const { current, newPassword } = req.body;
  if (!current || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  try {
    // 1. Authenticate changing request by initializing user-authorized client using active token
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authentication required' });
    const token = authHeader.split(' ')[1];

    // Check if token is local JWT
    const jwt = require('jsonwebtoken');
    let isLocal = false;
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'local-jwt-secret-key-123');
      isLocal = true;
    } catch (err) {}

    if (isLocal) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      await store.update('users', req.user.id, { password: hashedPassword });
      return res.json({ message: 'Password updated successfully' });
    }

    if (!supabaseUrl || !supabaseKey) {
      return res.status(400).json({ error: 'Supabase authentication service is not configured' });
    }

    try {
      const userSupabase = createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      });

      // 2. Perform the update
      const { error } = await userSupabase.auth.updateUser({ password: newPassword });
      if (error) {
        return res.status(400).json({ error: error.message });
      }
    } catch (supabaseErr) {
      console.warn('[Change Password] Supabase token auth update failed:', supabaseErr.message);
      return res.status(400).json({ error: 'Supabase auth service is unreachable: ' + supabaseErr.message });
    }


    // Also update hashed password in public users table for backup/consistency
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await store.update('users', req.user.id, { password: hashedPassword });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

// Get all users (admin only)
router.get('/users', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const users = await store.get('users');
    const usersWithoutPasswords = users.map(({ password, ...u }) => u);
    res.json(usersWithoutPasswords);
  } catch (err) {
    next(err);
  }
});

// Update user details/role (admin only)
router.patch('/users/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { role, name, phone } = req.body;
  const updates = {};
  if (role) {
    if (role !== 'admin' && role !== 'citizen') {
      return res.status(400).json({ error: 'Invalid role' });
    }
    // Prevent self-demotion from admin role
    if (req.params.id === req.user.id && role !== 'admin') {
      return res.status(400).json({ error: 'You cannot change your own admin role status' });
    }
    updates.role = role;
  }
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  try {
    const updated = await store.update('users', req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'User not found' });
    
    const { password, ...userWithoutPassword } = updated;
    res.json(userWithoutPassword);
  } catch (err) {
    next(err);
  }
});

// Delete user (admin only)
router.delete('/users/:id', auth(), requireRole('admin'), async (req, res, next) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: 'You cannot delete your own admin account' });
  }
  try {
    // 1. Delete from public users profile
    const deleted = await store.remove('users', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });

    // 2. Best-effort: Delete from Supabase Auth using admin API if service role key is configured
    try {
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const adminSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
        await adminSupabase.auth.admin.deleteUser(req.params.id);
      }
    } catch (authDelErr) {
      console.warn('Could not delete user from Supabase Auth admin dashboard:', authDelErr.message);
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
