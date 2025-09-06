import axios from 'axios';

// API base URL
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    college_id?: number;
  }) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data;
  },
};

// College API
export const collegeAPI = {
  getColleges: async () => {
    const response = await apiClient.get('/colleges');
    return response.data;
  },

  createCollege: async (collegeData: { name: string }) => {
    const response = await apiClient.post('/colleges', collegeData);
    return response.data;
  },
};

// Event API
export const eventAPI = {
  getEvents: async (skip = 0, limit = 100) => {
    const response = await apiClient.get(`/events?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  getEvent: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  createEvent: async (eventData: {
    title: string;
    description?: string;
    type: string;
    date: string;
    location?: string;
    max_attendees?: number;
    college_id: number;
  }) => {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (eventId: number, eventData: {
    title?: string;
    description?: string;
    type?: string;
    date?: string;
    location?: string;
    max_attendees?: number;
    college_id?: number;
  }) => {
    const response = await apiClient.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId: number) => {
    const response = await apiClient.delete(`/events/${eventId}`);
    return response.data;
  },
};

// Registration API
export const registrationAPI = {
  getMyRegistrations: async () => {
    const response = await apiClient.get('/registrations/my');
    return response.data;
  },

  getAllRegistrations: async () => {
    const response = await apiClient.get('/registrations/all');
    return response.data;
  },

  createRegistration: async (eventId: number) => {
    const response = await apiClient.post('/registrations', { event_id: eventId });
    return response.data;
  },
};

// Attendance API
export const attendanceAPI = {
  getMyAttendance: async () => {
    const response = await apiClient.get('/attendance/my');
    return response.data;
  },

  getAllAttendance: async () => {
    const response = await apiClient.get('/attendance/all');
    return response.data;
  },

  createAttendance: async (registrationId: number, eventId: number) => {
    const response = await apiClient.post('/attendance', {
      registration_id: registrationId,
      event_id: eventId,
    });
    return response.data;
  },

  // QR Code attendance methods
  markQRAttendance: async (eventId: number, qrData: string) => {
    const response = await apiClient.post('/attendance/qr', {
      event_id: eventId,
      qr_data: qrData,
    });
    return response.data;
  },

  markStudentQRAttendance: async (eventId: number) => {
    const response = await apiClient.post(`/attendance/qr/student?event_id=${eventId}`);
    return response.data;
  },
};

// Feedback API
export const feedbackAPI = {
  getMyFeedback: async () => {
    const response = await apiClient.get('/feedback/my');
    return response.data;
  },

  getAllFeedback: async () => {
    const response = await apiClient.get('/feedback/all');
    return response.data;
  },

  createFeedback: async (registrationId: number, eventId: number, rating: number, comment?: string) => {
    const response = await apiClient.post('/feedback', {
      registration_id: registrationId,
      event_id: eventId,
      rating,
      comment,
    });
    return response.data;
  },

  getEventFeedback: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/feedback`);
    return response.data;
  },

  getEventAverageRating: async (eventId: number) => {
    const response = await apiClient.get(`/events/${eventId}/average-rating`);
    return response.data;
  },
};

export default apiClient;
