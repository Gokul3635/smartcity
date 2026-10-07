const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/contacts', async (req, res, next) => {
  try {
    res.json(await store.get('emergencyContacts'));
  } catch (err) {
    next(err);
  }
});

router.get('/requests', auth(), async (req, res, next) => {
  try {
    let requests = await store.get('emergencies');
    if (req.user.role === 'citizen') {
      requests = requests.filter((e) => e.userId === req.user.id);
    }
    res.json(requests);
  } catch (err) {
    next(err);
  }
});

router.post('/requests', auth(), async (req, res, next) => {
  const { type, location, description } = req.body;
  if (!type || !location) {
    return res.status(400).json({ error: 'Type and location are required' });
  }

  const request = {
    id: uuidv4(),
    userId: req.user.id,
    type,
    location,
    description: description || '',
    status: 'dispatched',
    createdAt: new Date().toISOString()
  };

  try {
    const created = await store.add('emergencies', request);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/requests/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  try {
    const updated = await store.update('emergencies', req.params.id, { status });
    if (!updated) return res.status(404).json({ error: 'Emergency request not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/requests/:id', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const deleted = await store.delete('emergencies', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Emergency request not found' });
    res.json({ message: 'Emergency request record successfully deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
