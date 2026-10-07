const express = require('express');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/bills', auth(), async (req, res, next) => {
  try {
    const bills = await store.findBy('utilityBills', 'userId', req.user.id);
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

router.get('/usage', auth(), (req, res) => {
  res.json({
    water: { current: '12,500 L', average: '11,200 L', trend: '+8%' },
    electricity: { current: '320 kWh', average: '285 kWh', trend: '+12%' }
  });
});

router.post('/bills/:id/pay', auth(), async (req, res, next) => {
  try {
    const bill = await store.find('utilityBills', req.params.id);
    if (!bill || bill.userId !== req.user.id) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    if (bill.status === 'paid') {
      return res.status(400).json({ error: 'Bill already paid' });
    }
    const updated = await store.update('utilityBills', req.params.id, {
      status: 'paid',
      paidAt: new Date().toISOString()
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Get all bills (admin only)
router.get('/admin/bills', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const bills = await store.get('utilityBills');
    res.json(bills);
  } catch (err) {
    next(err);
  }
});

// Mark any bill as paid (admin only)
router.post('/admin/bills/:id/pay', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const bill = await store.find('utilityBills', req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    if (bill.status === 'paid') {
      return res.status(400).json({ error: 'Bill already paid' });
    }
    const updated = await store.update('utilityBills', req.params.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Create a new utility bill (admin only)
router.post('/admin/bills', auth(), requireRole('admin'), async (req, res, next) => {
  const { userId, type, amount, dueDate, usage } = req.body;
  if (!userId || !type || !amount || !dueDate || !usage) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  const { v4: uuidv4 } = require('uuid');
  const bill = {
    id: uuidv4(),
    userId,
    type,
    amount: parseFloat(amount),
    dueDate,
    status: 'pending',
    usage,
    updatedAt: new Date().toISOString()
  };

  try {
    const created = await store.add('utilityBills', bill);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Update usage/amount on an existing bill (admin only)
router.patch('/admin/bills/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { usage, amount, dueDate } = req.body;
  const updates = { updatedAt: new Date().toISOString() };
  if (usage !== undefined) updates.usage = usage;
  if (amount !== undefined) updates.amount = parseFloat(amount);
  if (dueDate !== undefined) updates.dueDate = dueDate;

  try {
    const bill = await store.find('utilityBills', req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const updated = await store.update('utilityBills', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
