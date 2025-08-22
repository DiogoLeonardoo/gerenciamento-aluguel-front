import axios from "axios";
import { Casa } from "./types";

// API URL as a variable that can be changed later
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
// Use a proxy for API requests to avoid CORS issues
const USE_PROXY = true;

const api = axios.create({
  // If using proxy, baseURL is our own domain, otherwise it's the API URL
  baseURL: USE_PROXY ? '' : API_URL,
  withCredentials: true, // This allows cookies to be sent cross-domain if needed
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure headers are present
    config.headers = config.headers || {};
    // Set CORS related headers
    config.headers['Access-Control-Allow-Origin'] = '*';
    return config;
  },
  (error) => Promise.reject(error)
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = USE_PROXY
      ? await api.post("/api/proxy?path=auth/login", { email, password })
      : await api.post("/auth/login", { email, password });
      
    if (response.data && response.data.token) {
      localStorage.setItem("token", response.data.token);
      
      // Create user object from response data
      const user = {
        email: response.data.email || email,
        role: response.data.role || 'USUER'
      };
      
      localStorage.setItem("user", JSON.stringify(user));
    }
    return response.data;
  },
  register: async (userData: any) => {
    const response = USE_PROXY
      ? await api.post("/api/proxy?path=auth/register", userData)
      : await api.post("/auth/register", userData);
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

export const casasService = {
  // Get all properties for a proprietário
  listarCasas: async () => {
    const response = USE_PROXY 
      ? await api.get("/api/proxy?path=api/casas")
      : await api.get("/api/casas");
    return response.data;
  },
  
  // Get a single property by ID
  getCasaById: async (id: number) => {
    const response = USE_PROXY 
      ? await api.get(`/api/proxy?path=api/casas/${id}`)
      : await api.get(`/api/casas/${id}`);
    return response.data;
  },
  
  // Upload multiple photos for a house
  uploadFotosCasa: async (casaId: number, fotos: File[]) => {
    const formData = new FormData();
    fotos.forEach((foto, index) => {
      formData.append("fotos", foto);
    });
    
    const response = USE_PROXY
      ? await api.post(`/api/proxy/multipart?path=api/fotos/upload/multiplas/casa/${casaId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      : await api.post(`/api/fotos/upload/multiplas/casa/${casaId}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
    return response.data;
  },
  
  // Get photos for a house
  getPhotosByCasaId: async (casaId: number) => {
    const response = USE_PROXY
      ? await api.get(`/api/proxy?path=api/fotos/casa/${casaId}`)
      : await api.get(`/api/fotos/casa/${casaId}`);
    return response.data;
  },
  
  // Get photo list for a house
  getPhotoListByCasaId: async (casaId: number) => {
    const response = USE_PROXY
      ? await api.get(`/api/proxy?path=api/fotos/lista/casa/${casaId}`)
      : await api.get(`/api/fotos/lista/casa/${casaId}`);
    return response.data;
  },
  
  // Create a new property with optional images
  // This endpoint requires PROPRIETARIO role authorization
  criarCasa: async (casaData: FormData) => {
    // Check if user is authenticated and has the proprietário role
    const userRole = authService.getUserRole();
    if (!authService.isAuthenticated() || userRole !== 'PROPRIETARIO') {
      throw new Error('Você não tem permissão para realizar esta ação. Somente proprietários podem cadastrar imóveis.');
    }
    
    let response;
    if (USE_PROXY) {
      // Use the multipart proxy endpoint
      response = await api.post("/api/proxy/multipart?path=api/casas", casaData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } else {
      // Direct API call
      response = await api.post("/api/casas", casaData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return response.data;
  },
  
  // Create a new property using JSON (no file uploads)
  // This endpoint requires PROPRIETARIO role authorization
  criarCasaJson: async (casaData: Omit<Casa, 'id' | 'fotos' | 'proprietarioId' | 'createdAt' | 'updatedAt'>) => {
    // Check if user is authenticated and has the proprietário role
    const userRole = authService.getUserRole();
    if (!authService.isAuthenticated() || userRole !== 'PROPRIETARIO') {
      throw new Error('Você não tem permissão para realizar esta ação. Somente proprietários podem cadastrar imóveis.');
    }
    
    // Validate required fields as per backend requirements
    if (!casaData.banheiros) {
      throw new Error('Número de banheiros é obrigatório');
    }
    if (!casaData.quartos) {
      throw new Error('Número de quartos é obrigatório');
    }
    if (!casaData.maxPessoas) {
      throw new Error('Capacidade máxima é obrigatória');
    }
    if (!casaData.valorDiaria) {
      throw new Error('Valor da diária é obrigatório');
    }
    if (casaData.estado && casaData.estado.length > 2) {
      throw new Error('Estado deve ter no máximo 2 caracteres (sigla do estado)');
    }
    
    const response = USE_PROXY
      ? await api.post("/api/proxy?path=api/casas", casaData, {
          headers: {
            'Content-Type': 'application/json'
          }
        })
      : await api.post("/api/casas", casaData, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
    return response.data;
  },
  
  // Update a property
  atualizarCasa: async (id: number, casaData: FormData) => {
    const response = USE_PROXY
      ? await api.put(`/api/proxy/multipart?path=api/casas/${id}`, casaData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      : await api.put(`/api/casas/${id}`, casaData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
    return response.data;
  },
  
  // Delete a property
  excluirCasa: async (id: number) => {
    const response = USE_PROXY
      ? await api.delete(`/api/proxy?path=api/casas/${id}`)
      : await api.delete(`/api/casas/${id}`);
    return response.data;
  },
};

export default api;
