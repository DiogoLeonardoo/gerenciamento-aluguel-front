import axios from "axios";

// API URL as a variable that can be changed later
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      
      // Create user object from response data
      const user = {
        email: response.data.email || email,
        role: response.data.role || 'USUARIO'
      };
      
      localStorage.setItem("user", JSON.stringify(user));
    }
    return response.data;
  },
  register: async (userData: any) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
  getUserRole: () => {
    const user = localStorage.getItem("user");
    if (user) {
      return JSON.parse(user).role;
    }
    return null;
  },
  getUser: () => {
    const user = localStorage.getItem("user");
    if (user) {
      return JSON.parse(user);
    }
    return null;
  },
};

export default api;
