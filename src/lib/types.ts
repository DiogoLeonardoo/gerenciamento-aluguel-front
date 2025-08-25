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

export type FotoCasa = {
  id: number;
  nomeArquivo: string;
  descricao: string | null;
  principal: boolean;
  dataUrl: string;
  contentType: string;
  tamanho: number;
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
  fotos?: FotoCasa[];
  fotoPrincipalData?: string;
  fotoPrincipalId?: number;
  totalFotos?: number;
  casaId?: number;
  proprietarioId?: number;
  ativa: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CondicaoItem = 'NOVA' | 'USADA' | 'DESGASTADA';

export type InventarioItem = {
  id?: number;
  item: string;
  descricao?: string;
  quantidade: number;
  condicao: CondicaoItem;
  valorEstimado: number;
  observacoes?: string;
  casaId?: number;
};

export type CasaFormData = Omit<Casa, 'id' | 'fotos' | 'proprietarioId' | 'createdAt' | 'updatedAt'> & {
  fotos?: File[];
  inventario?: InventarioItem[];
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

export type StatusReserva = 'PENDENTE' | 'CONFIRMADA' | 'CANCELADA' | 'CONCLUIDA' | 'CHECKIN' | 'CHECKOUT';

export type Hospede = {
  id?: number;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  dataNascimento?: string;
};

export type NovoHospede = Omit<Hospede, 'id'>;

export type Reserva = {
  id?: number;
  casaId: number;
  casa?: Casa;
  hospedePrincipalId: number;
  hospedePrincipal?: Hospede;
  hospedeIds?: number[];
  hospedes?: Hospede[];
  dataCheckin: string;
  dataCheckout: string;
  numPessoas: number;
  valorTotal?: number;
  valorPago: number;
  status?: StatusReserva;
  observacoes?: string;
  dataCheckoutValid?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type NovaReserva = Omit<Reserva, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'casa' | 'hospedePrincipal' | 'hospedes'>;

export type DisponibilidadeParams = {
  casaId?: number;
  dataInicio: string;
  dataFim: string;
};

export type DisponibilidadeResponse = {
  disponivel: boolean;
  motivo?: string;
  reservasConflitantes?: Reserva[];
};

export type FaturamentoResponse = {
  totalFaturado: number;
  mediaOcupacao: number;
  quantidadeReservas: number;
  detalhes: {
    [mes: string]: {
      faturamento: number;
      reservas: number;
      ocupacao: number;
    };
  };
};
