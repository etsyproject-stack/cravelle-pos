import client from './client';

export const authApi = {
  login: (credentials) => client.post('/login', credentials),
  logout: () => client.post('/logout'),
  me: () => client.get('/me'),
};

export const dashboardApi = {
  stats: () => client.get('/dashboard/stats'),
};

export const categoryApi = {
  list: (params) => client.get('/categories', { params }),
  create: (data) => client.post('/categories', data),
  update: (id, data) => client.put(`/categories/${id}`, data),
  remove: (id) => client.delete(`/categories/${id}`),
};

export const productApi = {
  list: (params) => client.get('/products', { params }),
  get: (id) => client.get(`/products/${id}`),
  create: (data) => client.post('/products', data),
  update: (id, data) => client.put(`/products/${id}`, data),
  remove: (id) => client.delete(`/products/${id}`),
  adjustStock: (id, data) => client.post(`/products/${id}/stock`, data),
};

export const addonApi = {
  list: () => client.get('/addons'),
  create: (data) => client.post('/addons', data),
  update: (id, data) => client.put(`/addons/${id}`, data),
  remove: (id) => client.delete(`/addons/${id}`),
};

export const orderApi = {
  list: (params) => client.get('/orders', { params }),
  get: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  updateStatus: (id, status) => client.patch(`/orders/${id}/status`, { status }),
  addPayment: (id, data) => client.post(`/orders/${id}/payments`, data),
  kot: (id) => client.get(`/orders/${id}/kot`),
};

export const holdOrderApi = {
  list: () => client.get('/hold-orders'),
  create: (data) => client.post('/hold-orders', data),
  remove: (id) => client.delete(`/hold-orders/${id}`),
};

export const kitchenApi = {
  orders: () => client.get('/kitchen/orders'),
  advance: (id) => client.patch(`/kitchen/orders/${id}/advance`),
};

export const customerApi = {
  list: (params) => client.get('/customers', { params }),
  create: (data) => client.post('/customers', data),
  update: (id, data) => client.put(`/customers/${id}`, data),
  remove: (id) => client.delete(`/customers/${id}`),
  loyalty: (id) => client.get(`/customers/${id}/loyalty`),
};

export const staffApi = {
  list: () => client.get('/users'),
  create: (data) => client.post('/users', data),
  update: (id, data) => client.put(`/users/${id}`, data),
  remove: (id) => client.delete(`/users/${id}`),
};

export const reportApi = {
  daily: (params) => client.get('/reports/daily', { params }),
  monthly: (params) => client.get('/reports/monthly', { params }),
  products: (params) => client.get('/reports/products', { params }),
  profit: (params) => client.get('/reports/profit', { params }),
};

export const expenseApi = {
  list: (params) => client.get('/expenses', { params }),
  create: (data) => client.post('/expenses', data),
  update: (id, data) => client.put(`/expenses/${id}`, data),
  remove: (id) => client.delete(`/expenses/${id}`),
};

export const couponApi = {
  list: () => client.get('/coupons'),
  create: (data) => client.post('/coupons', data),
  update: (id, data) => client.put(`/coupons/${id}`, data),
  remove: (id) => client.delete(`/coupons/${id}`),
  validate: (code, subtotal) => client.post('/coupons/validate', { code, subtotal }),
};

export const settingsApi = {
  get: () => client.get('/settings'),
  update: (data) => client.put('/settings', data),
};
