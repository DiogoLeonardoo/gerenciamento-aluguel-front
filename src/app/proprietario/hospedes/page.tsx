'use client';

import { useState, useEffect } from 'react';
import { hospedesService } from '@/lib/api';
import { Hospede, NovoHospede } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { buscarEndereco } from '@/lib/cep-busca';
import { maskCPF, maskCEP, maskPhone, validateCPF, validateCEP, validatePhone } from '@/lib/validation';

// Schema de validação para o formulário
const hospedeSchema = z.object({
  id: z.number().optional(),
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

export default function HospedesPage() {
  const router = useRouter();
  const [hospedes, setHospedes] = useState<Hospede[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hospedeParaExcluir, setHospedeParaExcluir] = useState<number | null>(null);
  const [dialogExclusaoOpen, setDialogExclusaoOpen] = useState(false);
  const [dialogEditOpen, setDialogEditOpen] = useState(false);
  const [hospedeEditando, setHospedeEditando] = useState<Hospede | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Configuração do formulário com react-hook-form
  const { control, handleSubmit, setValue, reset, formState: { errors }, watch } = useForm<HospedeFormValues>({
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
    }
  });
  
  const cep = watch('cep');

  useEffect(() => {
    carregarHospedes();
  }, []);

  const carregarHospedes = async () => {
    setIsLoading(true);
    try {
      const data = await hospedesService.listarHospedes();
      setHospedes(data);
    } catch (error) {
      console.error('Erro ao carregar hóspedes:', error);
      toast.error('Erro', 'Não foi possível carregar a lista de hóspedes.');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarExclusao = (id: number) => {
    setHospedeParaExcluir(id);
    setDialogExclusaoOpen(true);
  };

  const abrirEdicao = (hospede: Hospede) => {
    setHospedeEditando(hospede);
    reset(hospede); // Preenche o formulário com os dados do hóspede
    setDialogEditOpen(true);
  };

  const excluirHospede = async () => {
    if (!hospedeParaExcluir) return;
    
    try {
      await hospedesService.excluirHospede(hospedeParaExcluir);
      toast.success('Sucesso', 'Hóspede excluído com sucesso.');
      carregarHospedes();
    } catch (error) {
      console.error('Erro ao excluir hóspede:', error);
      toast.error('Erro', 'Não foi possível excluir o hóspede.');
    } finally {
      setDialogExclusaoOpen(false);
      setHospedeParaExcluir(null);
    }
  };

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

  // Função para salvar edições de hóspede
  const salvarEdicao = async (data: HospedeFormValues) => {
    if (!hospedeEditando || !hospedeEditando.id) return;
    
    setIsSubmitting(true);
    try {
      await hospedesService.atualizarHospede(hospedeEditando.id, data);
      toast.success('Sucesso', 'Hóspede atualizado com sucesso!');
      setDialogEditOpen(false);
      carregarHospedes();
    } catch (error) {
      console.error('Erro ao atualizar hóspede:', error);
      toast.error('Erro', 'Não foi possível atualizar o hóspede.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buscarHospedes = async () => {
    if (!searchTerm.trim()) {
      carregarHospedes();
      return;
    }

    setIsLoading(true);
    try {
      const data = await hospedesService.buscarHospedes(searchTerm);
      setHospedes(data);
    } catch (error) {
      console.error('Erro ao buscar hóspedes:', error);
      toast.error('Erro', 'Erro na busca de hóspedes.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-emerald-700">Gerenciamento de Hóspedes</h1>
        <Button
          onClick={() => router.push('/proprietario/hospedes/adicionar')}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <p style={{color: 'white'}}>Adicionar Novo Hóspede</p>
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por nome, email ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-2 border rounded-md"
            onKeyDown={(e) => e.key === 'Enter' && buscarHospedes()}
          />
          <Button
            onClick={buscarHospedes}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <p style={{color:'white'}}>Buscar</p>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center">Carregando hóspedes...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {hospedes.length > 0 ? (
            hospedes.map((hospede) => (
              <Card key={hospede.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{hospede.nome}</h3>
                    <p className="text-gray-600">{hospede.email}</p>
                    <p className="text-gray-600">{hospede.cpf}</p>
                    {hospede.telefone && <p className="text-gray-600">{hospede.telefone}</p>}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Button
                      onClick={() => abrirEdicao(hospede)}
                      variant="outline"
                      className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => confirmarExclusao(hospede.id!)}
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500">
              Nenhum hóspede encontrado. Cadastre um novo hóspede!
            </div>
          )}
        </div>
      )}

      {/* Dialog de Exclusão */}
      <Dialog open={dialogExclusaoOpen} onOpenChange={setDialogExclusaoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir este hóspede? Esta ação não pode ser desfeita.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={excluirHospede}
            >
              <p style={{color: 'white'}}>Confirmar</p>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Edição */}
      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editar Hóspede</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(salvarEdicao)} className="space-y-6">
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
                    <p style={{color: 'white'}}>Buscar</p>
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
                onClick={() => setDialogEditOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                <p style={{color: 'white'}}>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</p>
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
