const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    res.json(await store.get('announcements'));
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(), requireRole('admin'), async (req, res, next) => {
  const { title, content, category } = req.body;
  if (!title || !content || !category) {
    return res.status(400).json({ error: 'Title, content, and category are required' });
  }
  const announcement = {
    id: uuidv4(),
    title,
    content,
    category,
    createdAt: new Date().toISOString()
  };
  try {
    const created = await store.add('announcements', announcement);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const deleted = await store.remove('announcements', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Announcement not found' });
    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
