import { Capacitor } from '@capacitor/core';

// On native (Android/iOS), we use the production Vercel hosted API.
// Note: Ensure Vercel "Deployment Protection" is disabled in Vercel settings so the APK can connect.
const API_BASE = Capacitor.isNativePlatform()
  ? 'https://smartcity-sand.vercel.app/api'
  : '/api';


async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export const api = {
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request('/auth/me'),
    updateProfile: (data) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
    changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
    getUsers: () => request('/auth/users'),
    updateUser: (id, data) => request(`/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' })
  },
  complaints: {
    list: () => request('/complaints'),
    get: (id) => request(`/complaints/${id}`),
    create: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/complaints/${id}`, { method: 'DELETE' })
  },
  announcements: {
    list: () => request('/announcements'),
    create: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/announcements/${id}`, { method: 'DELETE' })
  },
  workers: {
    list: () => request('/workers'),
    create: (data) => request('/workers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/workers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/workers/${id}`, { method: 'DELETE' })
  },
  egov: {
    requests: () => request('/egov'),
    createRequest: (data) => request('/egov', { method: 'POST', body: JSON.stringify(data) }),
    updateRequestStatus: (id, status) => request(`/egov/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    sendEmail: (id, data) => request(`/egov/${id}/send-email`, { method: 'POST', body: JSON.stringify(data) })
  },

  utilities: {
    bills: () => request('/utilities/bills'),
    usage: () => request('/utilities/usage'),
    payBill: (id) => request(`/utilities/bills/${id}/pay`, { method: 'POST' }),
    adminListBills: () => request('/utilities/admin/bills'),
    adminPayBill: (id) => request(`/utilities/admin/bills/${id}/pay`, { method: 'POST' }),
    adminCreateBill: (data) => request('/utilities/admin/bills', { method: 'POST', body: JSON.stringify(data) }),
    adminUpdateBill: (id, data) => request(`/utilities/admin/bills/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },
  transport: {
    buses: () => request('/transport/buses'),
    createBus: (data) => request('/transport/buses', { method: 'POST', body: JSON.stringify(data) }),
    updateBus: (id, data) => request(`/transport/buses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteBus: (id) => request(`/transport/buses/${id}`, { method: 'DELETE' }),
    routes: () => request('/transport/routes'),
    createRoute: (data) => request('/transport/routes', { method: 'POST', body: JSON.stringify(data) }),
    updateRoutePrice: (id, price, from, to) => request(`/transport/routes/${id}`, { method: 'PATCH', body: JSON.stringify({ price, from, to }) }),
    updateRoute: (id, data) => request(`/transport/routes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteRoute: (id) => request(`/transport/routes/${id}`, { method: 'DELETE' }),
    tickets: () => request('/transport/tickets'),
    buyTicket: (data) => request('/transport/tickets', { method: 'POST', body: JSON.stringify(data) }),
    updateTicket: (id, data) => request(`/transport/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteTicket: (id) => request(`/transport/tickets/${id}`, { method: 'DELETE' })
  },
  emergency: {
    contacts: () => request('/emergency/contacts'),
    requests: () => request('/emergency/requests'),
    create: (data) => request('/emergency/requests', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id, status) => request(`/emergency/requests/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id) => request(`/emergency/requests/${id}`, { method: 'DELETE' })
  },
  analytics: {
    get: () => request('/analytics')
  }
};
