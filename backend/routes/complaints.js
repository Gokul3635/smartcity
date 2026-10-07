const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(false), async (req, res, next) => {
  try {
    let complaints = await store.get('complaints');
    if (req.user?.role === 'citizen') {
      complaints = complaints.filter((c) => c.userId === req.user.id);
    }
    res.json(complaints);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', auth(false), async (req, res, next) => {
  try {
    const complaint = await store.find('complaints', req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    if (req.user?.role === 'citizen' && complaint.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(complaint);
  } catch (err) {
    next(err);
  }
});

router.post('/', auth(), async (req, res, next) => {
  const { type, title, description, location } = req.body;
  if (!type || !title || !description || !location) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const complaint = {
    id: uuidv4(),
    userId: req.user.id,
    type,
    title,
    description,
    location,
    status: 'pending',
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const created = await store.add('complaints', complaint);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { status, assignedTo } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (assignedTo !== undefined) updates.assignedTo = assignedTo;

  try {
    const updated = await store.update('complaints', req.params.id, updates);
    if (!updated) return res.status(404).json({ error: 'Complaint not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete a complaint
router.delete('/:id', auth(), async (req, res, next) => {
  try {
    const complaint = await store.find('complaints', req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    // Citizens can only delete their own complaints; admins can delete any.
    if (req.user.role !== 'admin' && complaint.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await store.remove('complaints', req.params.id);
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
