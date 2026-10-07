const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    res.json(await store.get('workers'));
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(), requireRole('admin'), async (req, res, next) => {
  const { name, department, status = 'available', currentTask = null } = req.body;
  if (!name || !department) {
    return res.status(400).json({ error: 'Name and department are required' });
  }
  const worker = {
    id: uuidv4(),
    name,
    department,
    status,
    currentTask
  };
  try {
    const created = await store.add('workers', worker);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const updated = await store.update('workers', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Worker not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const deleted = await store.remove('workers', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Worker not found' });
    res.json({ success: true, message: 'Worker deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
