import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Send cookies with requests
});

// Create doctor axios instance with separate auth storage
const doctorHttp = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

doctorHttp.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("doctor_access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestUrl = originalRequest?.url || "";
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    // If 401 and we haven't retried yet, try to refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) {
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("access_token", accessToken);

        // Retry the original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

doctorHttp.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const requestUrl = originalRequest?.url || "";
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/refresh") ||
      requestUrl.includes("/auth/logout");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("doctor_refresh_token");
        if (!refreshToken) {
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem("doctor_access_token", accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return doctorHttp(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("doctor_access_token");
        localStorage.removeItem("doctor_refresh_token");
        localStorage.removeItem("doctor_user");
        window.location.href = "/doctor-auth";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// API Methods
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    fullName?: string;
    role?: string;
    specialty?: string;
    licenseNumber?: string;
  }) => api.post("/auth/register", data),

  login: (data: { email: string; password: string; role?: string }) =>
    api.post("/auth/login", data),

  logout: () => api.post("/auth/logout"),

  getCurrentUser: () => api.get("/auth/me"),

  googleAuth: () => {
    window.location.href = `${API_URL}/auth/google`;
  },
};

export const doctorAuthApi = {
  register: (data: {
    email: string;
    password: string;
    fullName?: string;
    role?: string;
    specialty?: string;
    licenseNumber?: string;
  }) => doctorHttp.post("/auth/register", data),

  login: (data: { email: string; password: string; role?: string }) =>
    doctorHttp.post("/auth/login", data),

  logout: () => doctorHttp.post("/auth/logout"),

  getCurrentUser: () => doctorHttp.get("/auth/me"),
};

export const profileApi = {
  get: () => api.get("/profile"),

  update: (
    data: Partial<{
      full_name?: string;
      phone?: string;
      date_of_birth?: string;
      gender?: string;
      avatar_url?: string;
    }>,
  ) => api.put("/profile", data),
};

export const medicineApi = {
  getAll: () => api.get("/medicines"),

  getById: (id: string) => api.get(`/medicines/${id}`),
};

export const cartApi = {
  get: () => api.get("/cart"),

  add: (data: { medicineId: string; quantity: number }) =>
    api.post("/cart", {
      medicine_id: data.medicineId,
      quantity: data.quantity,
    }),

  update: (medicineId: string, quantity: number) =>
    api.put(`/cart/${medicineId}`, { quantity }),

  remove: (medicineId: string) => api.delete(`/cart/${medicineId}`),

  clear: () => api.delete("/cart"),
};

export const orderApi = {
  getAll: () => api.get("/orders"),

  getById: (id: string) => api.get(`/orders/${id}`),

  create: (data: { shippingAddress: string; paymentMethod: string }) =>
    api.post("/orders", {
      shipping_address: data.shippingAddress,
      payment_method: data.paymentMethod,
    }),
};

export const doctorApi = {
  getAll: () => api.get("/doctors"),

  getById: (id: string) => api.get(`/doctors/${id}`),
};

export const appointmentApi = {
  getAll: () => api.get("/appointments"),

  getById: (id: string) => api.get(`/appointments/${id}`),

  create: (data: {
    doctorId: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
  }) =>
    api.post("/appointments", {
      doctor_id: data.doctorId,
      appointment_date: data.appointmentDate,
      appointment_time: data.appointmentTime,
      notes: data.reason,
    }),

  update: (id: string, data: { status?: string; notes?: string }) =>
    api.put(`/appointments/${id}`, data),

  cancel: (id: string) => api.delete(`/appointments/${id}`),
};

export const healthRecordApi = {
  getAll: () => api.get("/health-records"),

  getById: (id: string) => api.get(`/health-records/${id}`),

  create: (data: {
    recordType: string;
    title: string;
    description?: string;
    recordDate: string;
    attachmentUrl?: string;
  }) =>
    api.post("/health-records", {
      record_type: data.recordType,
      title: data.title,
      description: data.description,
      data: { record_date: data.recordDate },
      file_url: data.attachmentUrl,
    }),

  delete: (id: string) => api.delete(`/health-records/${id}`),
};

export const symptomCheckApi = {
  getAll: () => api.get("/symptom-checks"),

  getById: (id: string) => api.get(`/symptom-checks/${id}`),

  create: (data: {
    symptoms: string[];
    severity: string;
    duration: string;
    additionalInfo?: string;
  }) =>
    api.post("/symptom-checks", {
      symptoms: data.symptoms,
      severity_level: data.severity,
      recommendations: data.additionalInfo,
      ai_diagnosis: data.duration,
    }),
};

export const notificationApi = {
  getAll: () => api.get("/notifications"),

  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),

  markAllAsRead: () => api.put("/notifications/read-all"),
};

export const doctorPortalApi = {
  getStats: () => doctorHttp.get("/doctor-portal/stats"),

  getTodayAppointments: () =>
    doctorHttp.get("/doctor-portal/appointments/today"),

  getUpcomingAppointments: () =>
    doctorHttp.get("/doctor-portal/appointments/upcoming"),

  updateAppointmentStatus: (id: string, status: string) =>
    doctorHttp.patch(`/doctor-portal/appointments/${id}/status`, { status }),

  getPatientDetails: (patientId: string) =>
    doctorHttp.get(`/doctor-portal/patients/${patientId}`),
};

export default api;
