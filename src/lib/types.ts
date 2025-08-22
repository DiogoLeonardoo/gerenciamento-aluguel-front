export type Usuario = {
  id: number;
  nome: string;
  email: string;
  telefone?: string;
  role: 'ADMIN' | 'PROPRIETARIO' | 'USER';
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
  role?: 'ADMIN' | 'PROPRIETARIO' | 'USER';
};

export type Casa = {
  id?: number;
  nome: string;
  descricao: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  quartos: number;
  banheiros: number;
  maxPessoas: number;
  valorDiaria: number;
  fotos?: string[];
  proprietarioId?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CasaFormData = Omit<Casa, 'id' | 'fotos' | 'proprietarioId' | 'createdAt' | 'updatedAt'> & {
  fotos?: File[];
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
  role: 'ADMIN' | 'PROPRIETARIO' | 'USER';
  cpf?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
};
