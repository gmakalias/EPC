// frontend/src/lib/api.ts
import axios from 'axios';

/**
 * Create Axios instance with Vite environment variables
 * VITE_API_URL is pulled from your docker-compose environment settings
 */
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and debugging
api.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log(`[API] Response from ${response.config.url}:`, response.data);
    }
    return response;
  },
  (error) => {
    if (import.meta.env.DEV) {
      console.error('[API] Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// =============================================
// API SERVICES
// =============================================

export const productOfferingService = {
  getAll: (params?: any) => api.get('/productOffering', { params }),
  getById: (id: string) => api.get(`/productOffering/${id}`),
  create: (data: any) => api.post('/productOffering', data),
  update: (id: string, data: any) => api.patch(`/productOffering/${id}`, data),
  delete: (id: string) => api.delete(`/productOffering/${id}`),
  getPricing: (id: string) => api.get(`/productOffering/${id}/pricing`),
  getChannels: (id: string) => api.get(`/productOffering/${id}/channels`),
  addChannel: (id: string, channelId: string) => 
    api.post(`/productOffering/${id}/channels`, { channelId }),
};

export const productSpecService = {
  getAll: (params?: any) => api.get('/productSpecification', { params }),
  getById: (id: string) => api.get(`/productSpecification/${id}`),
  create: (data: any) => api.post('/productSpecification', data),
  update: (id: string, data: any) => api.patch(`/productSpecification/${id}`, data),
  delete: (id: string) => api.delete(`/productSpecification/${id}`),
};

export const subscriptionService = {
  getAll: (params?: any) => api.get('/subscriptions', { params }),
  getById: (id: string) => api.get(`/subscriptions/${id}`),
  create: (data: any) => api.post('/subscriptions', data),
  update: (id: string, data: any) => api.patch(`/subscriptions/${id}`, data),
  getServices: (id: string) => api.get(`/subscriptions/${id}/services`),
};

export const pricingService = {
  getPlans: (offeringId?: string) => 
    api.get('/pricing/plans', { params: { offeringId } }),
  createPlan: (data: any) => api.post('/pricing/plans', data),
  updatePlan: (id: string, data: any) => api.patch(`/pricing/plans/${id}`, data),
  calculate: (data: any) => api.post('/pricing/calculate', data),
};

export const categoryService = {
  getAll: () => api.get('/category'),
  getById: (id: string) => api.get(`/category/${id}`),
  create: (data: any) => api.post('/category', data),
  update: (id: string, data: any) => api.patch(`/category/${id}`, data),
  delete: (id: string) => api.delete(`/category/${id}`),
};

export const rulesService = {
  getAll: (params?: any) => api.get('/rules', { params }),
  create: (data: any) => api.post('/rules', data),
  update: (id: string, data: any) => api.patch(`/rules/${id}`, data),
  delete: (id: string) => api.delete(`/rules/${id}`),
  evaluate: (data: any) => api.post('/rules/evaluate', data),
};

export const lifecycleService = {
  getTransitions: (params?: any) => api.get('/lifecycle/transitions', { params }),
  createTransition: (data: any) => api.post('/lifecycle/transitions', data),
  approve: (id: string) => api.post(`/lifecycle/transitions/${id}/approve`),
  reject: (id: string, reason: string) => 
    api.post(`/lifecycle/transitions/${id}/reject`, { reason }),
};

export const auditService = {
  getLogs: (params?: any) => api.get('/audit/logs', { params }),
};

export const cfsService = {
  getAll: () => api.get('/service/cfs'),
  create: (data: any) => api.post('/service/cfs', data),
  update: (id: string, data: any) => api.patch(`/service/cfs/${id}`, data),
};

export const rfsService = {
  getAll: () => api.get('/service/rfs'),
  create: (data: any) => api.post('/service/rfs', data),
  update: (id: string, data: any) => api.patch(`/service/rfs/${id}`, data),
};

export const resourceService = {
  getAll: () => api.get('/resource'),
  create: (data: any) => api.post('/resource', data),
  update: (id: string, data: any) => api.patch(`/resource/${id}`, data),
};

export const channelService = {
  getAll: () => api.get('/channel'),
  create: (data: any) => api.post('/channel', data),
  update: (id: string, data: any) => api.patch(`/channel/${id}`, data),
};

export const importExportService = {
  exportProducts: (format: string) => 
    api.get('/export/products', { params: { format }, responseType: 'blob' }),
  importProducts: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    // Don't set Content-Type header manually; Axios does it better with FormData
    return api.post('/import/products', formData);
  },
  getExportStatus: (jobId: string) => api.get(`/export/status/${jobId}`),
};

export const reportsService = {
  getCatalogSummary: () => api.get('/reports/catalog-summary'),
  getSubscriptionAnalytics: (params?: any) => 
    api.get('/reports/subscription-analytics', { params }),
};