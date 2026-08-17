/**
 * Multi-Service API Service
 */

const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('dialog_admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error on ${endpoint}:`, error);
    return {
      success: false,
      message: 'සේවාදායකය සමඟ සම්බන්ධ විය නොහැක (Network error. Could not connect to backend)'
    };
  }
}

export const api = {
  calculate: (amount, serviceType = 'DIALOG') => request('/calculate', {
    method: 'POST',
    body: JSON.stringify({ amount, serviceType })
  }),

  validateNumber: (phoneNumber, serviceType = 'DIALOG', connectionType = 'MOBILE') => request('/validate-number', {
    method: 'POST',
    body: JSON.stringify({ phoneNumber, serviceType, connectionType })
  }),

  getPackages: (service = 'ALL') => request(`/packages?service=${encodeURIComponent(service)}`),

  getPublicSettings: () => request('/settings/public'),

  createOrder: (orderData) => request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),

  trackOrder: (reference) => request(`/orders/track/${encodeURIComponent(reference)}`),

  uploadPaymentSlip: (reference, slipData) => request(`/orders/track/${encodeURIComponent(reference)}/upload-slip`, {
    method: 'POST',
    body: JSON.stringify(slipData)
  }),

  // Admin Endpoints
  adminLogin: (username, password) => request('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),

  getAdminMe: () => request('/admin/me'),

  getAdminStats: () => request('/admin/stats'),

  getAdminOrders: (status = '', search = '', service = '') => {
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    if (service && service !== 'ALL') params.append('service', service);
    if (search) params.append('search', search);
    return request(`/admin/orders?${params.toString()}`);
  },

  updateOrderStatus: (id, status, adminNotes = '', proofImageBase64 = null, estimatedTime = null) => request(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, adminNotes, proofImageBase64, estimatedTime })
  }),

  requestOrderPayment: (id, estimatedTime = '', adminNotes = '') => request(`/admin/orders/${id}/request-payment`, {
    method: 'POST',
    body: JSON.stringify({ estimatedTime, adminNotes })
  }),

  getAdminPackages: () => request('/admin/packages'),

  addPackage: (pkg) => request('/admin/packages', {
    method: 'POST',
    body: JSON.stringify(pkg)
  }),

  updatePackage: (id, updates) => request(`/admin/packages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates)
  }),

  deletePackage: (id) => request(`/admin/packages/${id}`, {
    method: 'DELETE'
  }),

  getAdminSettings: () => request('/admin/settings'),

  updateAdminSettings: (settings) => request('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(settings)
  }),

  testWhatsAppGroupAlert: () => request('/admin/whatsapp/test-group-alert', {
    method: 'POST'
  }),

  getWhatsAppSessionStatus: () => request('/admin/whatsapp/session-status'),

  generateWhatsAppQR: (phone = '') => request('/admin/whatsapp/generate-qr', {
    method: 'POST',
    body: JSON.stringify({ phone })
  }),

  confirmWhatsAppPairing: (phone = '') => request('/admin/whatsapp/confirm-pairing', {
    method: 'POST',
    body: JSON.stringify({ phone })
  }),

  disconnectWhatsAppSession: () => request('/admin/whatsapp/disconnect', {
    method: 'POST'
  }),

  getWhatsAppDispatchLog: () => request('/admin/whatsapp/dispatch-log')
};
