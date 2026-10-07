const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || '';
// Use service role key on the backend if available to bypass RLS, otherwise fallback to public anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const dbPath = path.join(__dirname, 'db.json');
let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.warn('WARNING: SUPABASE_URL and SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY environment variables are missing! Database operations will run in local-only mode.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

let supabaseOffline = !supabase;

// Helper to read local db.json file
function readLocal() {
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify({}, null, 2), 'utf8');
      return {};
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('[Store] Failed to read local db.json:', err.message);
    return {};
  }
}

// Helper to write to local db.json file
function writeLocal(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Store] Failed to write to local db.json:', err.message);
  }
}

// Helper runner that catches Supabase connection errors and falls back to local database
async function runWithFallback(supabaseOp, localOp) {
  if (supabase && !supabaseOffline) {
    try {
      return await supabaseOp();
    } catch (err) {
      console.warn('[Store] Supabase operation failed, falling back to local database:', err.message);
      // Mark Supabase as offline if it is a network/DNS error
      if (
        err.message.includes('fetch failed') ||
        err.message.includes('ENOTFOUND') ||
        err.message.includes('fetch') ||
        err.message.includes('network') ||
        err.message.includes('connect')
      ) {
        console.warn('[Store] Supabase connection/DNS error detected. Using local database for subsequent operations.');
        supabaseOffline = true;
      }
    }
  }
  return localOp();
}

const store = {
  // Get all rows
  get: async (key) => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase
          .from(key)
          .select('*');
        if (error) throw new Error(error.message);
        return data || [];
      },
      () => {
        const db = readLocal();
        return db[key] || [];
      }
    );
  },

  // Insert a row
  add: async (key, item) => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase
          .from(key)
          .insert(item)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
      () => {
        const db = readLocal();
        if (!db[key]) db[key] = [];
        db[key].push(item);
        writeLocal(db);
        return item;
      }
    );
  },

  // Update a row
  update: async (key, id, updates) => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase
          .from(key)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw new Error(error.message);
        return data;
      },
      () => {
        const db = readLocal();
        if (!db[key]) db[key] = [];
        const index = db[key].findIndex(item => item.id === id);
        if (index !== -1) {
          db[key][index] = { ...db[key][index], ...updates };
          writeLocal(db);
          return db[key][index];
        }
        return null;
      }
    );
  },

  // Find a single row by ID
  find: async (key, id) => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase
          .from(key)
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (error) throw new Error(error.message);
        return data;
      },
      () => {
        const db = readLocal();
        const items = db[key] || [];
        return items.find(item => item.id === id) || null;
      }
    );
  },

  // Filter rows by field and value
  findBy: async (key, field, value) => {
    return runWithFallback(
      async () => {
        const { data, error } = await supabase
          .from(key)
          .select('*')
          .eq(field, value);
        if (error) throw new Error(error.message);
        return data || [];
      },
      () => {
        const db = readLocal();
        const items = db[key] || [];
        return items.filter(item => item[field] === value);
      }
    );
  },

  // Remove a row by ID
  remove: async (key, id) => {
    return runWithFallback(
      async () => {
        const { error } = await supabase
          .from(key)
          .delete()
          .eq('id', id);
        if (error) throw new Error(error.message);
        return true;
      },
      () => {
        const db = readLocal();
        if (db[key]) {
          const originalLength = db[key].length;
          db[key] = db[key].filter(item => item.id !== id);
          if (db[key].length !== originalLength) {
            writeLocal(db);
            return true;
          }
        }
        return false;
      }
    );
  }
};

module.exports = store;

