const express = require('express');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    const [complaints, workers, emergencies, buses, wasteVehicles] = await Promise.all([
      store.get('complaints'),
      store.get('workers'),
      store.get('emergencies'),
      store.get('buses'),
      store.get('wasteVehicles')
    ]);

    const total = complaints.length;
    const resolved = complaints.filter((c) => c.status === 'resolved').length;
    const pending = complaints.filter((c) => c.status === 'pending').length;
    const inProgress = complaints.filter((c) => c.status === 'in_progress').length;

    const byType = complaints.reduce((acc, c) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});

    const activeWorkers = workers.filter((w) => w.status === 'active').length;

    res.json({
      overview: {
        totalComplaints: total,
        resolvedComplaints: resolved,
        pendingComplaints: pending,
        inProgressComplaints: inProgress,
        resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
        activeWorkers,
        totalWorkers: workers.length,
        activeEmergencies: emergencies.filter((e) => e.status !== 'resolved').length,
        activeBuses: buses.filter((b) => b.status === 'active').length,
        wasteVehiclesOnRoute: wasteVehicles.filter((v) => v.status === 'on_route').length
      },
      complaintsByType: byType,
      complaintsByStatus: { pending, in_progress: inProgress, resolved },
      monthlyTrend: [
        { month: 'Jan', complaints: 45, resolved: 40 },
        { month: 'Feb', complaints: 52, resolved: 48 },
        { month: 'Mar', complaints: 38, resolved: 35 },
        { month: 'Apr', complaints: 61, resolved: 55 },
        { month: 'May', complaints: 55, resolved: 50 },
        { month: 'Jun', complaints: total, resolved }
      ],
      servicePerformance: [
        { service: 'Roads', score: 87, target: 90 },
        { service: 'Waste', score: 92, target: 85 },
        { service: 'Water', score: 78, target: 85 },
        { service: 'Electricity', score: 85, target: 88 },
        { service: 'Transport', score: 81, target: 80 }
      ]
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
