export type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  role: 'ADMIN' | 'PROPRIETARIO' | 'USUARIO';
  ativo: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type AuthResponse = {
  token: string;
  usuario: Usuario;
};

export type LoginFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  nome: string;
  email: string;
  telefone?: string;
  password: string;
  confirmPassword: string;
  isProprietario?: boolean;
  role?: 'ADMIN' | 'PROPRIETARIO' | 'USUARIO';
};

export type ProprietarioFormData = {
  cpf: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};

export type RegisterRequestData = {
  nome: string;
  email: string;
  password: string;
  telefone?: string;
  role: 'ADMIN' | 'PROPRIETARIO' | 'USUARIO';
  cpf?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};
