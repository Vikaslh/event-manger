import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Use Expo public env var so it’s available at runtime
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach Authorization header from SecureStore
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Auto-logout on 401 (optional): clear token and reload app state
apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    if (error?.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
export const authAPI = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    return res.data as { access_token: string; token_type: string };
  },
  register: async (data: { email: string; password: string; full_name: string; role?: string; college_id?: number }) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
  me: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },
};

export const eventAPI = {
  list: async () => {
    const res = await apiClient.get('/events');
    return res.data as any[];
  },
  get: async (eventId: number) => {
    const res = await apiClient.get(`/events/${eventId}`);
    return res.data;
  },
};

export const registrationAPI = {
  create: async (eventId: number) => {
    const res = await apiClient.post('/registrations', { event_id: eventId });
    return res.data;
  },
  mine: async () => {
    const res = await apiClient.get('/registrations/my');
    return res.data as any[];
  },
};

export const attendanceAPI = {
  markStudent: async (eventId: number) => {
    const res = await apiClient.post(`/attendance/qr/student?event_id=${eventId}`);
    return res.data as any;
  },
  myAttendance: async () => {
    const res = await apiClient.get('/attendance/my');
    return res.data as any[];
  },
  create: async (registrationId: number, eventId: number) => {
    const res = await apiClient.post('/attendance', {
      registration_id: registrationId,
      event_id: eventId,
    });
    return res.data as any;
  },
};

// Feedback API
export const feedbackAPI = {
  create: async (
    registrationId: number,
    eventId: number,
    rating: number,
    comment?: string
  ) => {
    const res = await apiClient.post('/feedback', {
      registration_id: registrationId,
      event_id: eventId,
      rating,
      comment,
    });
    return res.data as any;
  },
  mine: async () => {
    const res = await apiClient.get('/feedback/my');
    return res.data as any[];
  },
};
