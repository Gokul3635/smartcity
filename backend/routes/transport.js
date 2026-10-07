const express = require('express');
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/buses', async (req, res, next) => {
  try {
    res.json(await store.get('buses'));
  } catch (err) {
    next(err);
  }
});

router.post('/buses', auth(), requireRole('admin'), async (req, res, next) => {
  const { number, route, status, location, nextStop, eta } = req.body;
  if (!number || !route || !status) {
    return res.status(400).json({ error: 'Number, route, and status are required' });
  }
  const bus = {
    id: uuidv4(),
    number,
    route,
    status,
    location: location || null,
    nextStop: nextStop || null,
    eta: eta || null
  };
  try {
    const created = await store.add('buses', bus);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/buses/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { number, route, status, location, nextStop, eta } = req.body;
  const updates = {};
  if (number !== undefined) updates.number = number;
  if (route !== undefined) updates.route = route;
  if (status !== undefined) updates.status = status;
  if (location !== undefined) updates.location = location;
  if (nextStop !== undefined) updates.nextStop = nextStop;
  if (eta !== undefined) updates.eta = eta;

  try {
    const updated = await store.update('buses', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/buses/:id', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    await store.remove('buses', req.params.id);
    res.json({ message: 'Bus deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.get('/routes', async (req, res, next) => {
  try {
    res.json(await store.get('busRoutes'));
  } catch (err) {
    next(err);
  }
});

router.get('/tickets', auth(), async (req, res, next) => {
  try {
    if (req.user.role === 'admin') {
      res.json(await store.get('tickets'));
    } else {
      const tickets = await store.findBy('tickets', 'userId', req.user.id);
      res.json(tickets);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/tickets', auth(), async (req, res, next) => {
  const { route, from, to, price, userEmail } = req.body;
  
  let targetUserId = req.user.id;
  
  if (req.user.role === 'admin' && userEmail) {
    try {
      const normalizedEmail = userEmail.trim().toLowerCase();
      const users = await store.findBy('users', 'email', normalizedEmail);
      const user = users.find(u => u.email.trim().toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(404).json({ error: 'User with this email not found' });
      }
      targetUserId = user.id;
    } catch (err) {
      return res.status(500).json({ error: 'Failed to find user by email: ' + err.message });
    }
  }

  let ticketPrice = price;
  if (ticketPrice === undefined || ticketPrice === null) {
    try {
      const routes = await store.findBy('busRoutes', 'number', route);
      const matchedRoute = routes.find(r => r.number === route && r.price !== null && r.price !== undefined) || routes.find(r => r.number === route);
      if (matchedRoute) {
        let stopsData = matchedRoute.stops;
        let segmentPrice = null;
        if (stopsData && !Array.isArray(stopsData) && stopsData.prices && from && to) {
          const key = [from.trim(), to.trim()].sort().join(' - ');
          if (stopsData.prices[key] !== undefined && stopsData.prices[key] !== null) {
            segmentPrice = stopsData.prices[key];
          }
        }
        ticketPrice = segmentPrice !== null ? segmentPrice : (matchedRoute.price !== undefined && matchedRoute.price !== null ? matchedRoute.price : 25);
      } else {
        ticketPrice = 25;
      }
    } catch (err) {
      ticketPrice = 25;
    }
  }

  const ticket = {
    id: uuidv4(),
    userId: targetUserId,
    route,
    from,
    to,
    price: Number(ticketPrice),
    status: 'active',
    purchasedAt: new Date().toISOString()
  };
  try {
    const created = await store.add('tickets', ticket);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.post('/routes', auth(), requireRole('admin'), async (req, res, next) => {
  const { number, name, stops, frequency, price } = req.body;
  if (!number || !name || !stops || !frequency) {
    return res.status(400).json({ error: 'Number, name, stops, and frequency are required' });
  }

  let routeStops;
  try {
    routeStops = Array.isArray(stops) ? stops : JSON.parse(stops);
  } catch (e) {
    // Fallback if stops is passed as a comma-separated string
    routeStops = typeof stops === 'string' ? stops.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  if (!Array.isArray(routeStops) || routeStops.length === 0) {
    return res.status(400).json({ error: 'Stops must be a valid array or comma-separated list of strings' });
  }

  const route = {
    id: uuidv4(),
    number,
    name,
    stops: routeStops,
    frequency,
    price: price ? Number(price) : 25
  };

  try {
    const created = await store.add('busRoutes', route);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.patch('/routes/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { price, from, to, number, name, stops, frequency } = req.body;
  try {
    const route = await store.find('busRoutes', req.params.id);
    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const updates = {};

    if (number !== undefined) updates.number = number;
    if (name !== undefined) updates.name = name;
    if (frequency !== undefined) updates.frequency = frequency;

    if (stops !== undefined) {
      let routeStops;
      try {
        routeStops = Array.isArray(stops) ? stops : JSON.parse(stops);
      } catch (e) {
        routeStops = typeof stops === 'string' ? stops.split(',').map(s => s.trim()).filter(Boolean) : [];
      }
      if (!Array.isArray(routeStops) || routeStops.length === 0) {
        return res.status(400).json({ error: 'Stops must be a valid list' });
      }
      
      let stopsData = route.stops;
      if (Array.isArray(stopsData)) {
        stopsData = { stops: routeStops, prices: {} };
      } else {
        const updatedPrices = {};
        if (stopsData && stopsData.prices) {
          for (const [segment, segPrice] of Object.entries(stopsData.prices)) {
            const [stopA, stopB] = segment.split(' - ');
            if (routeStops.includes(stopA) && routeStops.includes(stopB)) {
              updatedPrices[segment] = segPrice;
            }
          }
        }
        stopsData = { stops: routeStops, prices: updatedPrices };
      }
      updates.stops = stopsData;
    }

    if (price !== undefined && price !== null && !isNaN(Number(price))) {
      if (from && to) {
        // Update segment price in stops JSONB
        let stopsData = updates.stops || route.stops;
        if (Array.isArray(stopsData)) {
          stopsData = {
            stops: stopsData,
            prices: {}
          };
        } else if (!stopsData || !stopsData.stops) {
          stopsData = {
            stops: [],
            prices: {}
          };
        }

        const key = [from.trim(), to.trim()].sort().join(' - ');
        stopsData.prices[key] = Number(price);
        updates.stops = stopsData;
      } else {
        // Update base price
        updates.price = Number(price);
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid update parameters provided' });
    }

    const updated = await store.update('busRoutes', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/routes/:id', auth(), requireRole('admin'), async (req, res, next) => {
  try {
    await store.remove('busRoutes', req.params.id);
    res.json({ message: 'Bus route deleted successfully' });
  } catch (err) {
    next(err);
  }
});

router.patch('/tickets/:id', auth(), requireRole('admin'), async (req, res, next) => {
  const { route, from, to, price, status } = req.body;
  try {
    const ticket = await store.find('tickets', req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const updates = {};
    if (route !== undefined) updates.route = route;
    if (from !== undefined) updates.from = from;
    if (to !== undefined) updates.to = to;
    if (price !== undefined && price !== null && !isNaN(Number(price))) updates.price = Number(price);
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No update parameters provided' });
    }

    const updated = await store.update('tickets', req.params.id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/tickets/:id', auth(), async (req, res, next) => {
  try {
    const ticket = await store.find('tickets', req.params.id);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    // Admin can delete any ticket. Citizen can only delete their own ticket.
    if (req.user.role !== 'admin' && ticket.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: You can only delete your own tickets' });
    }

    await store.remove('tickets', req.params.id);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
