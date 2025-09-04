import axios from "axios";
import {
  Casa,
  InventarioItem,
  NovaReserva,
  DisponibilidadeParams,
  DisponibilidadeResponse,
  FaturamentoResponse,
  Hospede,
  NovoHospede
} from "./types";
import { id } from "date-fns/locale";
import { toast } from "sonner";

// Função para exibir mensagens de erro em modais
// Esta função será exportada para ser usada pelos componentes React
export const handleApiError = (error: any, defaultMessage = "Ocorreu um erro"): string => {
  let errorMessage = defaultMessage;

  if (error.response && error.response.data) {
    // Se a API retornou uma mensagem de erro estruturada
    if (error.response.data.message) {
      errorMessage = error.response.data.message;
    } else if (typeof error.response.data === 'string') {
      errorMessage = error.response.data;
    }
  } else if (error.message) {
    // Se é um erro JavaScript padrão
    errorMessage = error.message;
  }

  return errorMessage;
};

// API URL as a variable that can be changed later
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://inhouse-back-production.up.railway.app";
// Use a proxy for API requests to avoid CORS issues
const USE_PROXY = false;

const api = axios.create({
  // If using proxy, baseURL is our own domain, otherwise it's the API URL
  baseURL: USE_PROXY ? '' : API_URL,
  withCredentials: true, // This allows cookies to be sent cross-domain if needed
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  timeout: 30000 // 30 seconds timeout
});

// Response interceptor to log errors
api.interceptors.response.use(
  (response) => {
    // Log successful responses
    console.log(`API Response [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`);

    // For multipart requests, log more details
    if (response.config.url?.includes('/multipart')) {
      console.log('Multipart response headers:', response.headers);
      console.log('Multipart response type:', typeof response.data);
      if (typeof response.data === 'string' && response.data.length < 1000) {
        console.log('Multipart response data:', response.data);
      } else {
        console.log('Multipart response data is large or not a string');
      }
    }

    return response;
  },
  (error) => {
    // Log errors
    if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx range
      console.error(`API Error [${error.response.status}] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`,
        error.response.data);

      // For multipart requests, log more details on error
      if (error.config.url?.includes('/multipart')) {
        console.error('Multipart error response headers:', error.response.headers);
        console.error('Multipart error response type:', typeof error.response.data);

        // Try to get the raw text if it's a SyntaxError
        if (error.message.includes('SyntaxError') && error.response.data) {
          console.error('Raw response text that caused JSON parse error:',
            JSON.stringify(error.response.data));
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`API No Response ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.request);
    } else {
      // Something happened in setting up the request
      console.error(`API Request Error ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, error.message);
    }
    return Promise.reject(error);
  }
);

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    // Ensure headers are present
    config.headers = config.headers || {};

    try {
      // No ambiente do navegador, tente obter o token do localStorage
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem("token");
        if (token) {
          // Add authorization header if not already set
          if (!config.headers.Authorization && !config.headers.authorization) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log(`Token adicionado ao cabeçalho para ${config.method?.toUpperCase()} ${config.url}: Bearer ${token.substring(0, 10)}...`);
          }
        } else {
          console.warn(`Token não encontrado no localStorage para requisição ${config.method?.toUpperCase()} ${config.url}`);
        }
      }
    } catch (err) {
      console.error("Erro ao acessar localStorage:", err);
    }

    // Set CORS related headers
    config.headers['Access-Control-Allow-Origin'] = '*';

    // Log the request details for debugging
    console.log(`Enviando requisição ${config.method?.toUpperCase()} ${config.url} com cabeçalhos:`,
      config.headers.Authorization ?
        { ...config.headers, Authorization: 'Bearer [REDACTED]' } :
        config.headers);

    return config;
  },
  (error) => {
    console.error("Erro no interceptor de requisição:", error);
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    try {
      // Login para receber token
      const loginResponse = USE_PROXY
        ? await api.post("/api/proxy?path=auth/login", { email, password })
        : await api.post("/auth/login", { email, password });

      if (loginResponse.data?.token) {
        const token = loginResponse.data.token;
        localStorage.setItem("token", token);

        // Pega dados completos do usuário
        const meResponse = USE_PROXY
          ? await api.get("/api/proxy?path=api/usuarios/me", { // <- path corrigido
            headers: { Authorization: `Bearer ${token}` },
          })
          : await api.get("/api/usuarios/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

        const user = {
          id: meResponse.data.id,
          nome: meResponse.data.nome,
          email: meResponse.data.email,
          role: meResponse.data.role,
          proprietarioId: meResponse.data.proprietarioId || null,
        };

        localStorage.setItem("user", JSON.stringify(user));
        console.log("Dados do usuário armazenados:", user);

        return { token, user };
      }

      return null;
    } catch (error) {
      console.error("Erro durante o login:", error);
      throw error;
    }
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

  isAuthenticated: () => !!localStorage.getItem("token"),

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getUserRole: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user).role : null;
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

  // Get the quantity of properties for a proprietário
  contarCasas: async () => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.get("/api/proxy?path=api/casas/quantidade")
        : await api.get("/api/casas/quantidade");

      return response.data;
    } catch (error: any) {
      console.error("Erro ao contar casas:", error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro ao contar casas");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  // Upload multiple photos for a house
  uploadFotosCasa: async (casaId: number, fotos: File[]) => {
    try {
      console.log(`Uploading ${fotos.length} photos for casa ${casaId}`);

      const formData = new FormData();
      fotos.forEach((foto, index) => {
        formData.append("files", foto); // Changed from "fotos" to "files" to match backend endpoint
        console.log(`Added file to form: ${foto.name}, size: ${foto.size} bytes`);
      });

      const url = USE_PROXY
        ? `/api/proxy/multipart?path=api/fotos/upload/multiplas/casa/${casaId}`
        : `/api/fotos/upload/multiplas/casa/${casaId}`;

      console.log(`Uploading to: ${url}`);

      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Upload successful, response:', response.status, response.statusText);
      return response.data;
    } catch (error: any) {
      console.error('Error in uploadFotosCasa:', error);

      // Log more detailed error information
      if (error.response) {
        console.error(`Response error: status=${error.response.status}, statusText=${error.response.statusText}`);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Request error (no response received):', error.request);
      } else {
        console.error('Error message:', error.message);
      }

      throw error;
    }
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

  // Set a photo as the principal one for a house
  setFotoPrincipal: async (fotoId: number) => {
    try {
      console.log(`Setting photo ${fotoId} as principal...`);
      const url = USE_PROXY
        ? `/api/proxy?path=api/fotos/${fotoId}/principal`
        : `/api/fotos/${fotoId}/principal`;

      const response = await api.put(url);
      console.log('Set principal photo response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error setting principal photo:', error.response || error);
      throw error;
    }
  },

  // Upload a single photo to a house
  uploadSingleFotoCasa: async (casaId: number, foto: File) => {
    const formData = new FormData();
    formData.append("foto", foto);

    const response = USE_PROXY
      ? await api.post(`/api/proxy/multipart?path=api/fotos/upload/casa/${casaId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      : await api.post(`/api/fotos/upload/casa/${casaId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    return response.data;
  },

  // Get a single photo by ID
  getFotoById: async (fotoId: number) => {
    const response = USE_PROXY
      ? await api.get(`/api/proxy?path=api/fotos/${fotoId}`)
      : await api.get(`/api/fotos/${fotoId}`);
    return response.data;
  },

  // Delete a photo by ID
  deleteFoto: async (fotoId: number) => {
    try {
      console.log(`Deleting photo ${fotoId}...`);
      const url = USE_PROXY
        ? `/api/proxy?path=api/fotos/${fotoId}`
        : `/api/fotos/${fotoId}`;

      const response = await api.delete(url);
      console.log('Delete photo response:', response);
      return response.data;
    } catch (error: any) {
      console.error('Error deleting photo:', error.response || error);
      throw error;
    }
  },

  // Get the principal photo of a house
  getCasaPrincipalPhoto: async (casaId: number) => {
    const response = USE_PROXY
      ? await api.get(`/api/proxy?path=api/fotos/casa/${casaId}/principal`)
      : await api.get(`/api/fotos/casa/${casaId}/principal`);
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

  // Update a property using PATCH (partial update)
  atualizarCasaPatch: async (id: number, casaData: FormData) => {
    // Check if user is authenticated and has the proprietário role
    const userRole = authService.getUserRole();
    if (!authService.isAuthenticated() || userRole !== 'PROPRIETARIO') {
      throw new Error('Você não tem permissão para realizar esta ação. Somente proprietários podem editar imóveis.');
    }

    const response = USE_PROXY
      ? await api.patch(`/api/proxy/multipart?path=api/casas/${id}`, casaData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      : await api.patch(`/api/casas/${id}`, casaData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
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

  // Inativar uma propriedade
  inativarCasa: async (id: number) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      console.log(`Tentando inativar imóvel ID ${id}`);
      const response = USE_PROXY
        ? await api.patch(`/api/proxy?path=api/casas/${id}/inativar`)
        : await api.patch(`/api/casas/${id}/inativar`);
      return response.data;
    } catch (error) {
      console.error("Erro ao inativar casa:", error);
      throw error;
    }
  },

  // Ativar uma propriedade
  ativarCasa: async (id: number) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      console.log(`Tentando ativar imóvel ID ${id}`);
      const response = USE_PROXY
        ? await api.patch(`/api/proxy?path=api/casas/${id}/ativar`)
        : await api.patch(`/api/casas/${id}/ativar`);
      return response.data;
    } catch (error) {
      console.error("Erro ao ativar casa:", error);
      throw error;
    }
  },

  // Alternar status de ativação
  alternarStatusCasa: async (id: number, ativa: boolean) => {
    if (ativa) {
      return await casasService.inativarCasa(id);
    } else {
      return await casasService.ativarCasa(id);
    }
  },

  // Adicionar fotos a uma casa existente
  adicionarFotosCasa: async (id: number, fotos: FormData) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      console.log(`Tentando adicionar fotos ao imóvel ID ${id}`);
      const response = USE_PROXY
        ? await api.post(`/api/proxy/multipart?path=api/casas/${id}/fotos`, fotos, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        : await api.post(`/api/casas/${id}/fotos`, fotos, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar fotos à casa:", error);
      throw error;
    }
  },

  getCasaById: async (id: number) => {
    const response = USE_PROXY
      ? await api.get(`/api/proxy?path=api/casas/${id}`)
      : await api.get(`/api/casas/${id}`);
    return response.data;
  },
};

export const inventarioService = {
  // Obter todos os itens do inventário de uma casa
  getInventarioCasa: async (casaId: number) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/inventario/casa/${casaId}`)
        : await api.get(`/api/inventario/casa/${casaId}`);

      console.log(`Resposta do inventário recebida com status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter inventário:", error);
      throw error;
    }
  },

  // Adicionar um item ao inventário
  adicionarItemInventario: async (casaId: number, item: Omit<InventarioItem, 'id' | 'casaId'>) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      // Get token for authorization
      const token = localStorage.getItem('token');

      const response = USE_PROXY
        ? await api.post(`/api/proxy?path=api/inventario/casa/${casaId}`, item, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        : await api.post(`/api/inventario/casa/${casaId}`, item, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar item ao inventário:", error);
      throw error;
    }
  },

  // Adicionar múltiplos itens ao inventário
  adicionarMultiplosItensInventario: async (casaId: number, itens: Omit<InventarioItem, 'id' | 'casaId'>[]) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      // Let the interceptor handle the authorization header
      const response = USE_PROXY
        ? await api.post(`/api/proxy?path=api/inventario/casa/${casaId}/multiplos`, itens)
        : await api.post(`/api/inventario/casa/${casaId}/multiplos`, itens);

      return response.data;
    } catch (error) {
      console.error("Erro ao adicionar múltiplos itens ao inventário:", error);
      throw error;
    }
  },

  // Atualizar um item do inventário
  atualizarItemInventario: async (id: number, item: Omit<InventarioItem, 'id' | 'casaId'>) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      console.log(`Atualizando item de inventário ID: ${id}`);

      // Let the interceptor handle the authorization header
      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/inventario/${id}`, item)
        : await api.put(`/api/inventario/${id}`, item);

      console.log(`Item de inventário atualizado com status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar item do inventário:", error);
      throw error;
    }
  },

  // Excluir um item do inventário
  excluirItemInventario: async (id: number) => {
    try {
      // Verificar autenticação primeiro
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      console.log(`Excluindo item de inventário ID: ${id}`);

      // Let the interceptor handle the authorization header
      const response = USE_PROXY
        ? await api.delete(`/api/proxy?path=api/inventario/${id}`)
        : await api.delete(`/api/inventario/${id}`);

      console.log(`Item de inventário excluído com status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao excluir item do inventário:", error);
      throw error;
    }
  },
};

export const reservasService = {
  // Obter todas as reservas
  getReservas: async (params?: { casaId?: number, dataInicio?: string, dataFim?: string }) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      // Use axios params object for better parameter handling
      const requestParams = params ? {
        casaId: params.casaId,
        dataInicio: params.dataInicio,
        dataFim: params.dataFim
      } : {};

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas`, { params: requestParams })
        : await api.get(`/api/reservas`, { params: requestParams });

      console.log(`Resposta de reservas recebida com status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter reservas:", error);
      throw error;
    }
  },

  // Obter uma reserva específica
  getReserva: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      console.log(`Obtendo detalhes da reserva ID: ${id}`);

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/${id}`)
        : await api.get(`/api/reservas/${id}`);

      return response.data;
    } catch (error) {
      console.error(`Erro ao obter reserva ID ${id}:`, error);
      throw error;
    }
  },

  getFaturamentoMensal: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não autenticado");
      }

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/total-mes-anterior/user/${id}`)
        : await api.get(`/api/reservas/total-mes-anterior/user/${id}`);

      return response.data;
    } catch (error: any) {
      console.error(`Erro faturamento mensal ${id}:`, error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro no faturamento mensal");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  criarReserva: async (reserva: NovaReserva) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const userRole = authService.getUserRole();
      console.log(`Tentando criar reserva para casa ID: ${reserva.casaId} com role: ${userRole}`);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };

      const response = USE_PROXY
        ? await api.post(`/api/proxy?path=api/reservas`, reserva, config)
        : await api.post(`/api/reservas`, reserva, config);

      console.log(`Reserva criada com sucesso, status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      throw error;
    }
  },

  // Confirmar uma reserva
  confirmarReserva: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/reservas/${id}/confirmar`)
        : await api.put(`/api/reservas/${id}/confirmar`);

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao confirmar reserva ID ${id}:`, error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro ao confirmar reserva");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  // Registrar check-in
  fazerCheckin: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/reservas/${id}/checkin`)
        : await api.put(`/api/reservas/${id}/checkin`);

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao fazer check-in da reserva ID ${id}:`, error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro ao fazer check-in");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  // Registrar check-out
  fazerCheckout: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/reservas/${id}/checkout`)
        : await api.put(`/api/reservas/${id}/checkout`);

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao fazer check-out da reserva ID ${id}:`, error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro ao fazer check-out");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  // Cancelar uma reserva
  cancelarReserva: async (id: number, motivo: string) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/reservas/${id}/cancelar`, { motivo })
        : await api.put(`/api/reservas/${id}/cancelar`, { motivo });

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao cancelar reserva ID ${id}:`, error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro ao cancelar reserva");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  // Finalizar uma reserva (concluir após checkout)
  finalizarReserva: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/reservas/${id}/concluir`)
        : await api.put(`/api/reservas/${id}/concluir`);

      return response.data;
    } catch (error: any) {
      console.error(`Erro ao finalizar reserva ID ${id}:`, error);

      // Extrair a mensagem de erro formatada
      const errorMessage = handleApiError(error, "Erro ao finalizar reserva");

      // Propaga o erro com a mensagem formatada para ser tratado pelo componente
      throw new Error(errorMessage);
    }
  },

  // Verificar disponibilidade
  verificarDisponibilidade: async (params: DisponibilidadeParams): Promise<DisponibilidadeResponse> => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      // Use axios params object for better parameter handling
      const requestParams = {
        casaId: params.casaId,
        dataInicio: params.dataInicio,
        dataFim: params.dataFim
      };

      console.log(`Verificando disponibilidade para casa ID: ${params.casaId}, de ${params.dataInicio} até ${params.dataFim}`);

      // Use the request config to properly set parameters
      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/disponibilidade`, { params: requestParams })
        : await api.get(`/api/reservas/disponibilidade`, { params: requestParams });

      console.log(`Resposta de disponibilidade recebida com status: ${response.status}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      throw error;
    }
  },

  // Obter dados de faturamento
  getFaturamento: async (params?: { casaId?: number, dataInicio?: string, dataFim?: string }): Promise<FaturamentoResponse> => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }

      // Use axios params object for better parameter handling
      const requestParams = params ? {
        casaId: params.casaId,
        dataInicio: params.dataInicio,
        dataFim: params.dataFim
      } : {};


      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/faturamento`, { params: requestParams })
        : await api.get(`/api/reservas/faturamento`, { params: requestParams });

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obter check-ins de hoje
  getCheckinsHoje: async () => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }


      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/checkin-hoje`)
        : await api.get(`/api/reservas/checkin-hoje`);

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obter check-outs de hoje
  getCheckoutsHoje: async () => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }


      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/checkout-hoje`)
        : await api.get(`/api/reservas/checkout-hoje`);

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Obter dias reservados para uma casa
  getDiasReservados: async (casaId: number): Promise<string[]> => {
    try {
      if (!authService.isAuthenticated()) {
        throw new Error("Usuário não está autenticado");
      }


      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/reservas/dias-reservados/${casaId}`)
        : await api.get(`/api/reservas/dias-reservados/${casaId}`);

      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// Serviço para gerenciar hóspedes
export const hospedesService = {
  // Obter todos os hóspedes (opcionalmente filtrando por proprietário)
  listarHospedes: async (proprietarioId?: number) => {
    try {
      if (!authService.isAuthenticated()) throw new Error("Usuário não está autenticado");

      const token = localStorage.getItem('token');
      if (!token) throw new Error("Token de autenticação não encontrado");

      const config = {
        headers: { 'Authorization': `Bearer ${token}` },
        params: {} as any
      };

      if (proprietarioId) config.params.proprietarioId = proprietarioId;

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/hospedes`, config)
        : await api.get(`/api/hospedes`, config);

      return response.data;
    } catch (error) {
      console.error("Erro ao obter hóspedes:", error);
      throw error;
    }
  },

  criarHospede: async (hospede: NovoHospede, proprietarioId: number) => {
  try {
    if (!authService.isAuthenticated()) throw new Error("Usuário não está autenticado");

    const token = localStorage.getItem('token');
    if (!token) throw new Error("Token de autenticação não encontrado");

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const url = USE_PROXY
      ? `/api/proxy?path=api/hospedes&proprietarioId=${proprietarioId}`
      : `/api/hospedes`;

    const response = await api.post(url, hospede, config);

    console.log(`Hóspede criado com sucesso, status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao criar hóspede:", error);
    throw error;
  }
},

  countHospede: async(id: number) => {
    try {
      if (!authService.isAuthenticated()) throw new Error("Usuário não autenticado");

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/hospedes/hospedes-count/${id}`)
        : await api.get(`/api/hospedes/hospedes-count/${id}`)

        return response.data;
    } catch (error) {
      toast.error(`Erro ao buscar contagem de hóspedes`);
      throw error;
    }
  },


  // Atualizar hóspede
  atualizarHospede: async (id: number, hospede: NovoHospede) => {
    try {
      if (!authService.isAuthenticated()) throw new Error("Usuário não está autenticado");

      const response = USE_PROXY
        ? await api.put(`/api/proxy?path=api/hospedes/${id}`, hospede)
        : await api.put(`/api/hospedes/${id}`, hospede)

      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar hóspede ID ${id}:`, error);
      throw error;
    }
  },

  // Excluir hóspede
  excluirHospede: async (id: number) => {
    try {
      if (!authService.isAuthenticated()) throw new Error("Usuário não está autenticado");

      const response = USE_PROXY
        ? await api.delete(`/api/proxy?path=api/hospedes/${id}`)
        : await api.delete(`/api/hospedes/${id}`);

      return response.data;
    } catch (error) {
      console.error(`Erro ao excluir hóspede ID ${id}:`, error);
      throw error;
    }
  },

  // Buscar hóspedes
  buscarHospedes: async (termo: string) => {
    try {
      if (!authService.isAuthenticated()) throw new Error("Usuário não está autenticado");

      const response = USE_PROXY
        ? await api.get(`/api/proxy?path=api/hospedes/busca`, { params: { termo } })
        : await api.get(`/api/hospedes/busca`, { params: { termo } });

      return response.data;
    } catch (error) {
      console.error(`Erro ao buscar hóspedes com termo ${termo}:`, error);
      throw error;
    }
  }
};


export default api;
