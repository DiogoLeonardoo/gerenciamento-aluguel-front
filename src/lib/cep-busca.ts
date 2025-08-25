import axios from 'axios';

export interface EnderecoApi {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  complemento: string;
}

const removeMask = (cep: string): string => cep.replace(/\D/g, '');

export const buscarEndereco = async (cep: string): Promise<EnderecoApi | null> => {
  const cepNumerico = removeMask(cep);

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cepNumerico}/json/`);

    return {
      cep: cepNumerico,
      logradouro: response.data.logradouro || '',
      bairro: response.data.bairro || '',
      localidade: response.data.localidade || '',
      uf: response.data.uf,
      complemento: response.data.complemento || '',
    };
  } catch (error) {
    return null;
  }
};
