import { useEffect, useState, useMemo } from 'react';
import { Bus, Edit2, Map, Search, Ticket, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { TransitSkeleton } from '../components/common/Skeletons';

export default function PublicTransport() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [buyForm, setBuyForm] = useState({ route: '', from: '', to: '' });
  const [routeForm, setRouteForm] = useState({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
  const [adminTicketForm, setAdminTicketForm] = useState({ route: '', from: '', to: '', price: '25' });
  const [editingRouteId, setEditingRouteId] = useState(null);
  const [busForm, setBusForm] = useState({ number: '', route: '', status: 'active', location: '', nextStop: '', eta: '' });
  const [editingBusId, setEditingBusId] = useState(null);
  const [routeSearch, setRouteSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const filteredRoutes = useMemo(() => {
    if (!routeSearch.trim()) return routes;
    const query = routeSearch.toLowerCase().trim();
    return routes.filter((r) => {
      const stopsData = r.stops;
      const stopsArray = Array.isArray(stopsData) ? stopsData : (stopsData?.stops || []);
      return (
        r.number.toLowerCase().includes(query) ||
        r.name.toLowerCase().includes(query) ||
        stopsArray.some((stop) => stop.toLowerCase().includes(query))
      );
    });
  }, [routes, routeSearch]);

  const [busSearch, setBusSearch] = useState('');

  const filteredBuses = useMemo(() => {
    if (!busSearch.trim()) return buses;
    const query = busSearch.toLowerCase().trim();
    return buses.filter((b) => {
      return (
        b.number.toLowerCase().includes(query) ||
        b.route.toLowerCase().includes(query) ||
        (b.location && b.location.toLowerCase().includes(query)) ||
        (b.nextStop && b.nextStop.toLowerCase().includes(query))
      );
    });
  }, [buses, busSearch]);

  // Find price of currently selected route
  const selectedRoutePrice = useMemo(() => {
    const selectedRoute = routes.find(r => r.id === buyForm.route);
    if (!selectedRoute) return '';
    const stopsData = selectedRoute.stops;
    if (stopsData && !Array.isArray(stopsData) && stopsData.prices && buyForm.from && buyForm.to) {
      const key = [buyForm.from, buyForm.to].sort().join(' - ');
      if (stopsData.prices[key] !== undefined && stopsData.prices[key] !== null) {
        return stopsData.prices[key];
      }
    }
    return selectedRoute.price || 25;
  }, [routes, buyForm.route, buyForm.from, buyForm.to]);

  // Set default admin buy route & default price once routes are loaded or route changes
  useEffect(() => {
    if (routes.length > 0) {
      const selectedRoute = routes.find(r => r.id === adminTicketForm.route) || routes[0];
      setAdminTicketForm(prev => ({
        ...prev,
        route: selectedRoute.id
      }));
    }
  }, [routes, adminTicketForm.route]);

  // Dynamically update adminTicketForm.price based on route and stops
  useEffect(() => {
    if (routes.length > 0) {
      const selectedRoute = routes.find(r => r.id === adminTicketForm.route) || routes[0];
      const stopsData = selectedRoute.stops;
      let segmentPrice = selectedRoute.price || 25;
      
      if (stopsData && !Array.isArray(stopsData) && stopsData.prices && adminTicketForm.from && adminTicketForm.to) {
        const key = [adminTicketForm.from, adminTicketForm.to].sort().join(' - ');
        if (stopsData.prices[key] !== undefined && stopsData.prices[key] !== null) {
          segmentPrice = stopsData.prices[key];
        }
      }
      
      setAdminTicketForm(prev => ({
        ...prev,
        price: String(segmentPrice)
      }));
    }
  }, [routes, adminTicketForm.route, adminTicketForm.from, adminTicketForm.to]);

  const adminSelectedRouteStops = useMemo(() => {
    const selectedRoute = routes.find(r => r.id === adminTicketForm.route);
    if (!selectedRoute) return [];
    const stopsData = selectedRoute.stops;
    return Array.isArray(stopsData) ? stopsData : (stopsData?.stops || []);
  }, [routes, adminTicketForm.route]);

  // Automatically update From/To stops when admin selected route changes
  useEffect(() => {
    if (adminSelectedRouteStops.length > 0) {
      setAdminTicketForm(prev => ({
        ...prev,
        from: adminSelectedRouteStops[0],
        to: adminSelectedRouteStops[1] || adminSelectedRouteStops[0]
      }));
    }
  }, [adminSelectedRouteStops]);

  useEffect(() => {
    const promises = [api.transport.buses(), api.transport.routes()];
    if (user) promises.push(api.transport.tickets().catch(() => []));
    Promise.all(promises)
      .then(([b, r, t]) => { setBuses(b); setRoutes(r); if (t) setTickets(t); })
      .finally(() => setLoading(false));
  }, [user]);

  // Set default buy route once routes are loaded
  useEffect(() => {
    if (routes.length > 0 && !buyForm.route) {
      setBuyForm(prev => ({
        ...prev,
        route: routes[0].id
      }));
    }
  }, [routes, buyForm.route]);

  const selectedRouteStops = useMemo(() => {
    const selectedRoute = routes.find(r => r.id === buyForm.route);
    if (!selectedRoute) return [];
    const stopsData = selectedRoute.stops;
    return Array.isArray(stopsData) ? stopsData : (stopsData?.stops || []);
  }, [routes, buyForm.route]);

  // Automatically update From/To stops when selectedRouteStops changes
  useEffect(() => {
    if (selectedRouteStops.length > 0) {
      setBuyForm(prev => ({
        ...prev,
        from: selectedRouteStops[0],
        to: selectedRouteStops[1] || selectedRouteStops[0]
      }));
    }
  }, [selectedRouteStops]);

  const buyTicket = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (!buyForm.from || !buyForm.to) {
      toast('Please select valid source and destination stops', 'error');
      return;
    }
    const selectedRoute = routes.find(r => r.id === buyForm.route);
    if (!selectedRoute) {
      toast('Selected route not found', 'error');
      return;
    }
    try {
      const ticket = await api.transport.buyTicket({
        route: selectedRoute.number,
        from: buyForm.from,
        to: buyForm.to,
        price: selectedRoutePrice
      });
      setTickets([ticket, ...tickets]);
      toast('Bus ticket purchased successfully');
    } catch (err) {
      toast(err.message || 'Failed to purchase ticket', 'error');
    }
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    if (!routeForm.number.trim() || !routeForm.name.trim() || !routeForm.stops.trim() || !routeForm.frequency.trim()) {
      toast('All fields are required', 'error');
      return;
    }
    const stopsArray = routeForm.stops.split(',').map(s => s.trim()).filter(Boolean);
    try {
      if (editingRouteId) {
        const updated = await api.transport.updateRoute(editingRouteId, {
          number: routeForm.number,
          name: routeForm.name,
          stops: stopsArray,
          frequency: routeForm.frequency
        });
        setRoutes(routes.map(r => r.id === updated.id ? updated : r));
        setEditingRouteId(null);
        toast('Bus route updated successfully');
      } else {
        const created = await api.transport.createRoute({
          number: routeForm.number,
          name: routeForm.name,
          stops: stopsArray,
          frequency: routeForm.frequency
        });
        setRoutes([...routes, created]);
        toast('Bus route created successfully');
      }
      setRouteForm({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
    } catch (err) {
      toast(err.message || 'Failed to save bus route', 'error');
    }
  };

  const handleAdminSetTicket = async (e) => {
    e.preventDefault();
    if (!adminTicketForm.price) {
      toast('Please enter a ticket price', 'error');
      return;
    }
    const selectedRoute = routes.find(r => r.id === adminTicketForm.route);
    if (!selectedRoute) {
      toast('Selected route not found', 'error');
      return;
    }
    try {
      const updatedRoute = await api.transport.updateRoutePrice(
        selectedRoute.id,
        Number(adminTicketForm.price),
        adminTicketForm.from,
        adminTicketForm.to
      );
      setRoutes(routes.map(r => r.id === updatedRoute.id ? updatedRoute : r));
      toast('Bus ticket price updated successfully');
    } catch (err) {
      toast(err.message || 'Failed to update ticket price', 'error');
    }
  };

  const handleDeleteRoute = async (id) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    try {
      await api.transport.deleteRoute(id);
      setRoutes(routes.filter(r => r.id !== id));
      if (editingRouteId === id) {
        setEditingRouteId(null);
        setRouteForm({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
      }
      toast('Bus route deleted successfully');
    } catch (err) {
      toast(err.message || 'Failed to delete route', 'error');
    }
  };

  const handleStartEditRoute = (r) => {
    setEditingRouteId(r.id);
    const stopsData = r.stops;
    const stopsArray = Array.isArray(stopsData) ? stopsData : (stopsData?.stops || []);
    setRouteForm({
      number: r.number,
      name: r.name,
      stops: stopsArray.join(', '),
      frequency: r.frequency
    });
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    if (!busForm.number.trim() || !busForm.route.trim() || !busForm.status) {
      toast('Bus Number, Route, and Status are required', 'error');
      return;
    }
    try {
      if (editingBusId) {
        const updated = await api.transport.updateBus(editingBusId, busForm);
        setBuses(buses.map(b => b.id === updated.id ? updated : b));
        setEditingBusId(null);
        toast('Bus updated successfully');
      } else {
        const created = await api.transport.createBus(busForm);
        setBuses([...buses, created]);
        toast('Bus added successfully');
      }
      setBusForm({ number: '', route: '', status: 'active', location: '', nextStop: '', eta: '' });
    } catch (err) {
      toast(err.message || 'Failed to save bus details', 'error');
    }
  };

  const handleStartEditBus = (b) => {
    setEditingBusId(b.id);
    setBusForm({
      number: b.number,
      route: b.route,
      status: b.status,
      location: b.location || '',
      nextStop: b.nextStop || '',
      eta: b.eta || ''
    });
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleDeleteBus = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    try {
      await api.transport.deleteBus(id);
      setBuses(buses.filter(b => b.id !== id));
      if (editingBusId === id) {
        setEditingBusId(null);
        setBusForm({ number: '', route: '', status: 'active', location: '', nextStop: '', eta: '' });
      }
      toast('Bus deleted successfully');
    } catch (err) {
      toast(err.message || 'Failed to delete bus', 'error');
    }
  };

  const [editingTicketId, setEditingTicketId] = useState(null);
  const [editTicketForm, setEditTicketForm] = useState({ route: '', from: '', to: '', price: '', status: 'active' });

  const handleUpdateTicket = async (id) => {
    try {
      const updated = await api.transport.updateTicket(id, {
        route: editTicketForm.route,
        from: editTicketForm.from,
        to: editTicketForm.to,
        price: Number(editTicketForm.price),
        status: editTicketForm.status
      });
      setTickets(tickets.map(t => t.id === id ? updated : t));
      setEditingTicketId(null);
      toast('Ticket updated successfully');
    } catch (err) {
      toast(err.message || 'Failed to update ticket', 'error');
    }
  };

  const handleDeleteTicket = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      await api.transport.deleteTicket(id);
      setTickets(tickets.filter(t => t.id !== id));
      if (editingTicketId === id) setEditingTicketId(null);
      toast('Ticket deleted successfully');
    } catch (err) {
      toast(err.message || 'Failed to delete ticket', 'error');
    }
  };

  if (loading) return <TransitSkeleton />;

  const activeBuses = buses.filter((b) => b.status === 'active').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Public Transport</h1>
        <p className="page-subtitle">Bus tracking, route information, and ticket management</p>
      </div>

      <div className={`grid ${!isAdmin ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'} gap-3 md:gap-4 mb-8`}>
        <StatCard title="Active Buses" value={activeBuses} icon={Bus} color="purple" />
        <StatCard title="Routes" value={routes.length} icon={Map} color="primary" />
        {!isAdmin && <StatCard title="My Tickets" value={tickets.length} icon={Ticket} color="green" />}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Live Bus Tracking</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input py-1.5 pl-8 pr-3 text-xs w-full sm:w-60"
                placeholder="Search bus number, route, or location..."
                value={busSearch}
                onChange={(e) => setBusSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredBuses.map((b) => (
              <div key={b.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-slate-900">{b.number}</p>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditBus(b)}
                            className="p-1 text-slate-400 hover:text-primary-600 rounded transition-colors"
                            title="Edit Bus"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBus(b.id)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Delete Bus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{b.route}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                {b.status === 'active' && (
                  <>
                    <p className="text-sm text-slate-600">Location: {b.location || 'Not updated'}</p>
                    <p className="text-sm text-primary-600">Next stop: {b.nextStop || 'N/A'} (ETA: {b.eta || 'N/A'})</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-semibold text-slate-900">Route Information</h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                className="input py-1.5 pl-8 pr-3 text-xs w-full sm:w-60"
                placeholder="Search route, name, or stop..."
                value={routeSearch}
                onChange={(e) => setRouteSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredRoutes.map((r) => (
              <div key={r.id} className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900">Route {r.number}: {r.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{r.frequency}</span>
                      {r.price !== undefined && r.price !== null && (
                        <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">₹{r.price}</span>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartEditRoute(r)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-md transition-colors"
                        title="Edit Route"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(r.id)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                        title="Delete Route"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(r.stops) ? r.stops : (r.stops?.stops || [])).map((stop, i) => (
                    <span key={stop} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {i > 0 && '→ '}{stop}
                    </span>
                  ))}
                </div>
                {r.stops && !Array.isArray(r.stops) && r.stops.prices && Object.keys(r.stops.prices).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Segment Prices (Bidirectional):</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(r.stops.prices).map(([segment, price]) => {
                        const bidirectionalSegment = segment.replace(' - ', ' ↔ ');
                        return (
                          <span key={segment} className="text-[11px] bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                            {bidirectionalSegment}: ₹{price}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {user && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            {isAdmin && (
              <>
                <div className="card">
                  <div className="p-5 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Map className="w-5 h-5 text-primary-600" />
                      {editingRouteId ? 'Edit Bus Route (Admin Only)' : 'Create Bus Route (Admin Only)'}
                    </h2>
                  </div>
                  <form onSubmit={handleCreateRoute} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Route Number</label>
                        <input
                          className="input"
                          placeholder="e.g. 402"
                          value={routeForm.number}
                          onChange={(e) => setRouteForm({ ...routeForm, number: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Frequency</label>
                        <input
                          className="input"
                          placeholder="e.g. Every 15 min"
                          value={routeForm.frequency}
                          onChange={(e) => setRouteForm({ ...routeForm, frequency: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1">
                      <div>
                        <label className="label">Route Name</label>
                        <input
                          className="input"
                          placeholder="e.g. Central Station - Airport Express"
                          value={routeForm.name}
                          onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label">Stops (Comma separated)</label>
                      <input
                        className="input"
                        placeholder="e.g. Stop A, Stop B, Stop C"
                        value={routeForm.stops}
                        onChange={(e) => setRouteForm({ ...routeForm, stops: e.target.value })}
                        required
                      />
                    </div>
                    <div className="flex gap-3">
                      <button type="submit" className="btn-primary flex-1">
                        {editingRouteId ? 'Update Route' : 'Create Route'}
                      </button>
                      {editingRouteId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRouteId(null);
                            setRouteForm({ number: '', name: '', stops: '', frequency: 'Every 15 min' });
                          }}
                          className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="card">
                  <div className="p-5 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary-600" />
                      Set Ticket (Admin)
                    </h2>
                  </div>
                  <form onSubmit={handleAdminSetTicket} className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">Route</label>
                        <select
                          className="input"
                          value={adminTicketForm.route}
                          onChange={(e) => setAdminTicketForm({ ...adminTicketForm, route: e.target.value })}
                        >
                          {routes.map((r) => (
                            <option key={r.id} value={r.id}>Route {r.number} - {r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">Ticket Price (₹)</label>
                        <input
                          type="number"
                          className="input"
                          placeholder="e.g. 25"
                          value={adminTicketForm.price}
                          onChange={(e) => setAdminTicketForm({ ...adminTicketForm, price: e.target.value })}
                          required
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label">From</label>
                        <select
                          className="input"
                          value={adminTicketForm.from}
                          onChange={(e) => setAdminTicketForm({ ...adminTicketForm, from: e.target.value })}
                          required
                        >
                          {adminSelectedRouteStops.length === 0 ? (
                            <option value="">No stops available</option>
                          ) : (
                            adminSelectedRouteStops.map((stop) => (
                              <option key={stop} value={stop}>{stop}</option>
                            ))
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="label">To</label>
                        <select
                          className="input"
                          value={adminTicketForm.to}
                          onChange={(e) => setAdminTicketForm({ ...adminTicketForm, to: e.target.value })}
                          required
                        >
                          {adminSelectedRouteStops.length === 0 ? (
                            <option value="">No stops available</option>
                          ) : (
                            adminSelectedRouteStops.map((stop) => (
                              <option key={stop} value={stop}>{stop}</option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary w-full">Set Ticket (₹{adminTicketForm.price || '0'})</button>
                  </form>
                </div>
              </>
            )}

            {!isAdmin && (
              <div className="card">
                <div className="p-5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Buy Ticket</h2>
                </div>
                <form onSubmit={buyTicket} className="p-5 space-y-4">
                  <div>
                    <label className="label">Route</label>
                    <select
                      className="input"
                      value={buyForm.route}
                      onChange={(e) => setBuyForm({ ...buyForm, route: e.target.value })}
                    >
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>Route {r.number} - {r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">From</label>
                      <select
                        className="input"
                        value={buyForm.from}
                        onChange={(e) => setBuyForm({ ...buyForm, from: e.target.value })}
                        required
                      >
                        {selectedRouteStops.length === 0 ? (
                          <option value="">No stops available</option>
                        ) : (
                          selectedRouteStops.map((stop) => (
                            <option key={stop} value={stop}>{stop}</option>
                          ))
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="label">To</label>
                      <select
                        className="input"
                        value={buyForm.to}
                        onChange={(e) => setBuyForm({ ...buyForm, to: e.target.value })}
                        required
                      >
                        {selectedRouteStops.length === 0 ? (
                          <option value="">No stops available</option>
                        ) : (
                          selectedRouteStops.map((stop) => (
                            <option key={stop} value={stop}>{stop}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="btn-primary">Purchase Ticket (₹{selectedRoutePrice})</button>
                </form>
              </div>
            )}
          </div>
          
          {isAdmin && (
            <div className="space-y-6">
              <div className="card">
                <div className="p-5 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Bus className="w-5 h-5 text-primary-600" />
                    {editingBusId ? 'Edit Bus (Admin Only)' : 'Add Bus (Admin Only)'}
                  </h2>
                </div>
                <form onSubmit={handleSaveBus} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Bus Number</label>
                      <input
                        className="input"
                        placeholder="e.g. SC-104"
                        value={busForm.number}
                        onChange={(e) => setBusForm({ ...busForm, number: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Status</label>
                      <select
                        className="input"
                        value={busForm.status}
                        onChange={(e) => setBusForm({ ...busForm, status: e.target.value })}
                        required
                      >
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Route</label>
                      <select
                        className="input"
                        value={busForm.route}
                        onChange={(e) => setBusForm({ ...busForm, route: e.target.value })}
                        required
                      >
                        <option value="">Select Route</option>
                        {routes.map((r) => (
                          <option key={r.id} value={`Route ${r.number}`}>Route {r.number} - {r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Current Location</label>
                      <input
                        className="input"
                        placeholder="e.g. Saveetha"
                        value={busForm.location}
                        onChange={(e) => setBusForm({ ...busForm, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Next Stop</label>
                      <input
                        className="input"
                        placeholder="e.g. Thandalam"
                        value={busForm.nextStop}
                        onChange={(e) => setBusForm({ ...busForm, nextStop: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">ETA</label>
                      <input
                        className="input"
                        placeholder="e.g. 5 min"
                        value={busForm.eta}
                        onChange={(e) => setBusForm({ ...busForm, eta: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn-primary flex-1">
                      {editingBusId ? 'Update Bus' : 'Add Bus'}
                    </button>
                    {editingBusId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBusId(null);
                          setBusForm({ number: '', route: '', status: 'active', location: '', nextStop: '', eta: '' });
                        }}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="card">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">{isAdmin ? 'Issued Tickets' : 'My Tickets'}</h2>
              <span className="text-xs text-slate-500 font-medium">{tickets.length} total</span>
            </div>
            {tickets.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">No tickets recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((t) => {
                  const isEditing = editingTicketId === t.id;
                  return (
                    <div key={t.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isEditing ? 'bg-blue-50/40' : ''}`}>
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="space-y-2 max-w-sm">
                            <div className="flex gap-2">
                              <input
                                className="input !py-1 !px-2 text-xs flex-1"
                                value={editTicketForm.route}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, route: e.target.value })}
                                placeholder="Route"
                              />
                              <input
                                type="number"
                                className="input !py-1 !px-2 text-xs w-20"
                                value={editTicketForm.price}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, price: e.target.value })}
                                placeholder="Price"
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                className="input !py-1 !px-2 text-xs flex-1"
                                value={editTicketForm.from}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, from: e.target.value })}
                                placeholder="From"
                              />
                              <input
                                className="input !py-1 !px-2 text-xs flex-1"
                                value={editTicketForm.to}
                                onChange={(e) => setEditTicketForm({ ...editTicketForm, to: e.target.value })}
                                placeholder="To"
                              />
                            </div>
                            <select
                              className="input !py-1 !px-2 text-xs"
                              value={editTicketForm.status}
                              onChange={(e) => setEditTicketForm({ ...editTicketForm, status: e.target.value })}
                            >
                              <option value="active">Active</option>
                              <option value="used">Used</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium break-words">Route {t.route}</p>
                            <p className="text-sm text-slate-500 break-words">{t.from} → {t.to}</p>
                            <p className="text-xs text-slate-400">{t.purchasedAt ? new Date(t.purchasedAt).toLocaleString() : 'N/A'}</p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
                        {!isEditing && (
                          <div className="text-right">
                            <p className="font-bold">₹{t.price}</p>
                            <StatusBadge status={t.status} />
                          </div>
                        )}
                        {isEditing ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateTicket(t.id)}
                              className="btn-primary !py-1 !px-3 text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingTicketId(null)}
                              className="btn-secondary !py-1 !px-3 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingTicketId(t.id);
                                  setEditTicketForm({
                                    route: t.route,
                                    from: t.from,
                                    to: t.to,
                                    price: t.price,
                                    status: t.status || 'active'
                                  });
                                }}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-md transition-colors"
                                title="Edit Ticket"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTicket(t.id)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-colors"
                              title="Delete Ticket"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
