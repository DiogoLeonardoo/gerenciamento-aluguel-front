'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { hospedesService } from '@/lib/api';
import { Hospede, NovoHospede } from '@/lib/types';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { buscarEndereco } from '@/lib/cep-busca';
import { maskCPF, maskCEP, maskPhone, validateCPF, validateCEP, validatePhone } from '@/lib/validation';

// Schema de validação para o formulário
const hospedeSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string().refine((val) => validateCPF(val), { message: 'CPF inválido' }),
  email: z.string().email('Email inválido'),
  telefone: z.string().refine((val) => validatePhone(val), { message: 'Telefone inválido' }).optional(),
  endereco: z.string().min(5, 'Endereço deve ter pelo menos 5 caracteres').optional(),
  cidade: z.string().min(2, 'Cidade deve ter pelo menos 2 caracteres').optional(),
  estado: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
  cep: z.string().refine((val) => validateCEP(val), { message: 'CEP inválido' }).optional(),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (formato: YYYY-MM-DD)').optional(),
});

type HospedeFormValues = z.infer<typeof hospedeSchema>;

export default function AdicionarHospedePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, setValue, formState: { errors }, watch } = useForm<HospedeFormValues>({
    resolver: zodResolver(hospedeSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      dataNascimento: '',
    },
  });

  const cep = watch('cep');

  // Função para buscar endereço pelo CEP
  const buscarCep = async () => {
    if (!cep || cep.length !== 9) return;

    try {
      setIsLoading(true);
      const endereco = await buscarEndereco(cep);
      if (endereco) {
        setValue('endereco', endereco.logradouro);
        setValue('cidade', endereco.localidade);
        setValue('estado', endereco.uf);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro', 'Não foi possível buscar o endereço pelo CEP.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: HospedeFormValues) => {
    setIsLoading(true);

    try {
      await hospedesService.criarHospede(data);
      toast.success('Sucesso', 'Hóspede cadastrado com sucesso!');
      router.push('/proprietario/hospedes');
    } catch (error) {
      console.error('Erro ao cadastrar hóspede:', error);
      toast.error('Erro', 'Não foi possível cadastrar o hóspede.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">Adicionar Novo Hóspede</h1>
      </div>

      <Card className="p-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Nome Completo*</label>
              <Controller
                name="nome"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-2 border rounded-md ${errors.nome ? 'border-red-500' : ''}`}
                    placeholder="Nome do hóspede"
                  />
                )}
              />
              {errors.nome && <span className="text-xs text-red-500">{errors.nome.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">CPF*</label>
              <Controller
                name="cpf"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <input
                    {...field}
                    value={value ? maskCPF(value) : ''}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors.cpf ? 'border-red-500' : ''}`}
                    placeholder="123.456.789-00"
                  />
                )}
              />
              {errors.cpf && <span className="text-xs text-red-500">{errors.cpf.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Email*</label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="email@exemplo.com"
                  />
                )}
              />
              {errors.email && <span className="text-xs text-red-500">{errors.email.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Telefone</label>
              <Controller
                name="telefone"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <input
                    {...field}
                    value={value ? maskPhone(value) : ''}
                    onChange={e => onChange(e.target.value)}
                    className={`w-full p-2 border rounded-md ${errors.telefone ? 'border-red-500' : ''}`}
                    placeholder="(11) 99999-9999"
                  />
                )}
              />
              {errors.telefone && <span className="text-xs text-red-500">{errors.telefone.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">CEP</label>
              <div className="flex gap-2">
                <Controller
                  name="cep"
                  control={control}
                  render={({ field: { onChange, value, ...field } }) => (
                    <input
                      {...field}
                      value={value ? maskCEP(value) : ''}
                      onChange={e => onChange(e.target.value)}
                      className={`w-full p-2 border rounded-md ${errors.cep ? 'border-red-500' : ''}`}
                      placeholder="12345-678"
                    />
                  )}
                />
                <Button
                  type="button"
                  onClick={buscarCep}
                  disabled={isLoading || !cep || cep.length !== 9}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <p style={{color:'white'}}>Buscar</p>
                </Button>
              </div>
              {errors.cep && <span className="text-xs text-red-500">{errors.cep.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Data de Nascimento</label>
              <Controller
                name="dataNascimento"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                    className={`w-full p-2 border rounded-md ${errors.dataNascimento ? 'border-red-500' : ''}`}
                  />
                )}
              />
              {errors.dataNascimento && <span className="text-xs text-red-500">{errors.dataNascimento.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Endereço</label>
              <Controller
                name="endereco"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-2 border rounded-md ${errors.endereco ? 'border-red-500' : ''}`}
                    placeholder="Rua, número, complemento"
                  />
                )}
              />
              {errors.endereco && <span className="text-xs text-red-500">{errors.endereco.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Cidade</label>
              <Controller
                name="cidade"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-2 border rounded-md ${errors.cidade ? 'border-red-500' : ''}`}
                    placeholder="Cidade"
                  />
                )}
              />
              {errors.cidade && <span className="text-xs text-red-500">{errors.cidade.message}</span>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    className={`w-full p-2 border rounded-md ${errors.estado ? 'border-red-500' : ''}`}
                    placeholder="UF"
                    maxLength={2}
                  />
                )}
              />
              {errors.estado && <span className="text-xs text-red-500">{errors.estado.message}</span>}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              <p style={{color: 'white'}}>{isLoading ? 'Salvando...' : 'Salvar Hóspede'}</p>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
