export const validateCPF = (cpf: string): boolean => {
  if (!cpf) return false;

  const cleanCPF = cpf.replace(/[^\d]/g, '');

  if (cleanCPF.length !== 11) return false;

  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;

  return true;
};

export const validateCEP = (cep: string): boolean => {
  if (!cep) return false;

  const cleanCEP = cep.replace(/[^\d]/g, '');
  return cleanCEP.length === 8 && /^\d{8}$/.test(cleanCEP);
};

export const validatePhone = (phone: string): boolean => {
  if (!phone) return false;

  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length === 10 || cleanPhone.length === 11;
};

export const maskCPF = (value: string): string => {
  if (!value) return '';

  const cleanValue = value.replace(/[^\d]/g, '');
  if (cleanValue.length <= 3) return cleanValue;
  if (cleanValue.length <= 6) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3)}`;
  if (cleanValue.length <= 9) return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6)}`;
  return `${cleanValue.slice(0, 3)}.${cleanValue.slice(3, 6)}.${cleanValue.slice(6, 9)}-${cleanValue.slice(9, 11)}`;
};

export const maskCEP = (value: string): string => {
  if (!value) return '';

  const cleanValue = value.replace(/[^\d]/g, '');
  if (cleanValue.length <= 5) return cleanValue;
  return `${cleanValue.slice(0, 5)}-${cleanValue.slice(5, 8)}`;
};

export const maskPhone = (value: string): string => {
  if (!value) return '';

  const cleanValue = value.replace(/[^\d]/g, '');
  if (cleanValue.length <= 2) return cleanValue;
  if (cleanValue.length <= 6) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2)}`;
  if (cleanValue.length <= 10) return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 6)}-${cleanValue.slice(6)}`;
  return `(${cleanValue.slice(0, 2)}) ${cleanValue.slice(2, 7)}-${cleanValue.slice(7, 11)}`;
};

// Remove mask functions
export const removeMask = (value: string): string => {
  if (!value) return '';
  return value.replace(/[^\d]/g, '');
};

// Validation messages
export const validationMessages = {
  cpf: {
    required: 'CPF é obrigatório',
    invalid: 'CPF inválido',
  },
  cep: {
    required: 'CEP é obrigatório',
    invalid: 'CEP deve conter 8 dígitos',
  },
  phone: {
    required: 'Telefone é obrigatório',
    invalid: 'Telefone deve conter 10 ou 11 dígitos',
  },
  nome: {
    required: 'Nome é obrigatório',
    minLength: 'Nome deve ter pelo menos 2 caracteres',
  },
  dataNascimento: {
    required: 'Data de nascimento é obrigatória',
    age: 'Doadora deve ser maior de 18 anos',
  },
  estado: {
    required: 'Estado é obrigatório',
    minLength: 'Estado deve ter pelo menos 2 caracteres',
  },
  cidade: {
    required: 'Cidade é obrigatória',
    minLength: 'Cidade deve ter pelo menos 2 caracteres',
  },
  endereco: {
    required: 'Endereço é obrigatório',
    minLength: 'Endereço deve ter pelo menos 5 caracteres',
  },
};
