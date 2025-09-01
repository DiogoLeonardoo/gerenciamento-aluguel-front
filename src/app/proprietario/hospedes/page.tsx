'use client';

import { useState, useEffect } from 'react';
import { hospedesService, authService } from '@/lib/api';
import { Hospede, NovoHospede } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Search, 
  Plus,
  Edit,
  Trash2
} from "lucide-react";
import { buscarEndereco } from '@/lib/cep-busca';
import { maskCPF, maskCEP, maskPhone, validateCPF, validateCEP, validatePhone, removeMask } from '@/lib/validation';
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
      // Get current user to extract proprietarioId
      const currentUser = authService.getUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('Usuário não identificado. Faça login novamente.');
      }

      const data = await hospedesService.listarHospedes(currentUser.id);
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
      // Remove masks from CPF and phone before sending to API
      const cleanData = {
        ...data,
        cpf: data.cpf ? removeMask(data.cpf) : data.cpf,
        telefone: data.telefone ? removeMask(data.telefone) : data.telefone,
      };

      await hospedesService.atualizarHospede(hospedeEditando.id, cleanData);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header Moderno */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Gerenciamento de Hóspedes
              </h1>
              <p className="text-emerald-600 mt-2">Gerencie todos os seus hóspedes em um só lugar</p>
            </div>
            <Button
              onClick={() => router.push('/proprietario/hospedes/adicionar')}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />
              Novo Hóspede
            </Button>
          </div>

          {/* Barra de Busca */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                  onKeyDown={(e) => e.key === 'Enter' && buscarHospedes()}
                />
              </div>
              <Button
                onClick={buscarHospedes}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </Button>
            </div>
          </Card>
        </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent"></div>
            <span className="text-emerald-700 font-medium">Carregando hóspedes...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospedes.length > 0 ? (
            hospedes.map((hospede, index) => (
              <Card 
                key={hospede.id} 
                className="group relative overflow-hidden bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              >
                {/* Gradiente de fundo sutil */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative p-6">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-200">
                          {hospede.nome}
                        </h3>
                        <p className="text-sm text-gray-500">ID: #{hospede.id}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Hóspede */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm">{hospede.email}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-600">
                      <User className="h-4 w-4 text-emerald-500" />
                      <span className="text-sm font-mono">{hospede.cpf}</span>
                    </div>

                    {hospede.telefone && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">{hospede.telefone}</span>
                      </div>
                    )}

                    {hospede.dataNascimento && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm">
                          {new Date(hospede.dataNascimento).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    )}

                    {(hospede.endereco || hospede.cidade) && (
                      <div className="flex items-start space-x-2 text-gray-600">
                        <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">
                          {[hospede.endereco, hospede.cidade, hospede.estado].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex space-x-2 pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => abrirEdicao(hospede)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200 transform hover:scale-105"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      onClick={() => confirmarExclusao(hospede.id!)}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 transform hover:scale-105"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="p-12 text-center bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum hóspede encontrado</h3>
                <p className="text-gray-600 mb-6">Comece cadastrando seu primeiro hóspede no sistema.</p>
                <Button
                  onClick={() => router.push('/proprietario/hospedes/adicionar')}
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Adicionar Primeiro Hóspede
                </Button>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Dialog de Exclusão */}
      <Dialog open={dialogExclusaoOpen} onOpenChange={setDialogExclusaoOpen}>
        <DialogContent className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <Trash2 className="h-6 w-6 mr-3" />
              Confirmar Exclusão
            </DialogTitle>
          </DialogHeader>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">
              Tem certeza que deseja excluir este hóspede? Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDialogExclusaoOpen(false)}
              className="border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              onClick={excluirHospede}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Edição */}
      <Dialog open={dialogEditOpen} onOpenChange={setDialogEditOpen}>
        <DialogContent className="max-w-4xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-emerald-600">
              <Edit className="h-6 w-6 mr-3" />
              Editar Hóspede
            </DialogTitle>
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
                      maxLength={15} // Ajustado para 11 dígitos + máscara
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
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 px-4"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
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

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogEditOpen(false)}
                disabled={isSubmitting}
                className="border-gray-300 hover:bg-gray-50 transition-all duration-200 px-6 py-2"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 px-6 py-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
