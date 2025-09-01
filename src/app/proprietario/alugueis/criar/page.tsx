"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reservasService, casasService, hospedesService, authService } from "@/lib/api";
import { Casa, NovaReserva, Hospede } from "@/lib/types";
import { Calendar, Plus, Calculator, Users, Home, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function CriarReserva() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [hospedes, setHospedes] = useState<Hospede[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validacaoError, setValidacaoError] = useState<string | null>(null);
  const [disponibilidade, setDisponibilidade] = useState<{ disponivel: boolean, motivo?: string } | null>(null);
  const [valorTotal, setValorTotal] = useState<number>(0);
  const [numNoites, setNumNoites] = useState<number>(0);
  
  const [formData, setFormData] = useState<NovaReserva>({
    casaId: 0,
    hospedePrincipalId: 0,
    hospedeIds: [],
    dataCheckin: new Date().toISOString().split('T')[0],
    dataCheckout: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    numPessoas: 1,
    valorPago: 0,
    observacoes: "",
    dataCheckoutValid: true,
    motivo: ""
  });

  // Calculate number of nights and total value
  const calcularValores = () => {
    if (!formData.dataCheckin || !formData.dataCheckout) return;

    const checkin = new Date(formData.dataCheckin);
    const checkout = new Date(formData.dataCheckout);
    const diffTime = checkout.getTime() - checkin.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      setNumNoites(diffDays);
      
      // Find selected house to get daily rate
      const casaSelecionada = casas.find(casa => casa.id === formData.casaId);
      if (casaSelecionada && casaSelecionada.valorDiaria) {
        const total = diffDays * casaSelecionada.valorDiaria;
        setValorTotal(total);
        setFormData(prev => ({ ...prev, valorPago: total }));
      }
    } else {
      setNumNoites(0);
      setValorTotal(0);
      setFormData(prev => ({ ...prev, valorPago: 0 }));
    }
  };

  // Validate guest count compatibility
  const validarHospedes = () => {
    const totalHospedesSelecionados = 1 + (formData.hospedeIds?.length || 0); // 1 principal + adicionais
    
    // Check minimum requirement
    if (formData.numPessoas < totalHospedesSelecionados) {
      setValidacaoError(`O número de pessoas (${formData.numPessoas}) deve ser pelo menos igual ao número de hóspedes selecionados (${totalHospedesSelecionados}).`);
      return false;
    }
    
    // Check maximum allowance (hospedes + 2 extras)
    if (formData.numPessoas > totalHospedesSelecionados + 2) {
      setValidacaoError(`O número de pessoas (${formData.numPessoas}) não pode ser muito maior que o número de hóspedes selecionados (${totalHospedesSelecionados}). Considere adicionar mais hóspedes ou reduzir o número de pessoas.`);
      return false;
    }
    
    // Check house capacity
    const casaSelecionada = casas.find(casa => casa.id === formData.casaId);
    if (casaSelecionada && formData.numPessoas > casaSelecionada.maxPessoas) {
      setValidacaoError(`O número de pessoas (${formData.numPessoas}) excede a capacidade máxima da propriedade (${casaSelecionada.maxPessoas} pessoas).`);
      return false;
    }
    
    setValidacaoError(null);
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch houses
        const casasData = await casasService.listarCasas();
        setCasas(casasData);
        if (casasData.length > 0) {
          setFormData(prev => ({ ...prev, casaId: casasData[0].id || 0 }));
        }
        
        // Fetch guests
        const currentUser = authService.getUser();
        if (!currentUser || !currentUser.id) {
          throw new Error('Usuário não identificado. Faça login novamente.');
        }
        const hospedesData = await hospedesService.listarHospedes(currentUser.id);
        setHospedes(hospedesData);
        if (hospedesData.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            hospedePrincipalId: hospedesData[0].id || 0 
          }));
        } else {
          setError("Nenhum hóspede cadastrado. Por favor, cadastre um hóspede primeiro.");
        }
      } catch (error: any) {
        console.error("Erro ao buscar dados:", error);
        setError("Não foi possível carregar todos os dados necessários.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Recalculate values when relevant fields change
  useEffect(() => {
    calcularValores();
  }, [formData.dataCheckin, formData.dataCheckout, formData.casaId, casas]);

  // Validate guest compatibility when relevant fields change
  useEffect(() => {
    validarHospedes();
  }, [formData.numPessoas, formData.hospedeIds, formData.hospedePrincipalId, formData.casaId, casas]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'numPessoas') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else if (name === 'casaId') {
      setFormData({ ...formData, [name]: parseInt(value, 10) || 0 });
    } else if (name === 'hospedePrincipalId') {
      setFormData({ ...formData, [name]: parseInt(value, 10) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Reset availability check when dates or house changes
    if (['dataCheckin', 'dataCheckout', 'casaId'].includes(name)) {
      setDisponibilidade(null);
    }
    
    // Clear validation error when user starts correcting
    if (['numPessoas', 'hospedePrincipalId', 'casaId'].includes(name)) {
      setValidacaoError(null);
    }
  };

  const verificarDisponibilidade = async () => {
    try {
      setLoading(true);
      const result = await reservasService.verificarDisponibilidade({
        casaId: formData.casaId,
        dataInicio: formData.dataCheckin,
        dataFim: formData.dataCheckout
      });
      setDisponibilidade(result);
      return result.disponivel;
    } catch (error: any) {
      console.error("Erro ao verificar disponibilidade:", error);
      setError("Erro ao verificar disponibilidade da casa.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate guest compatibility first
    if (!validarHospedes()) {
      return;
    }
    
    // Check if house is available first
    const disponivel = await verificarDisponibilidade();
    if (!disponivel) {
      return;
    }
    
    try {
      setLoading(true);
      await reservasService.criarReserva(formData);
      router.push("/proprietario/alugueis");
    } catch (error: any) {
      console.error("Erro ao criar reserva:", error);
      setError(error.message || "Erro ao criar reserva");
    } finally {
      setLoading(false);
    }
  };

  const casaSelecionada = casas.find(casa => casa.id === formData.casaId);

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Nova Reserva</h1>
              <p className="text-gray-600 mt-2">Configure sua reserva de forma rápida e intuitiva</p>
            </div>
            <Link href="/proprietario/alugueis">
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <XCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {validacaoError && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <XCircle className="h-5 w-5" />
            {validacaoError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primeira Linha: Propriedade e Datas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Propriedade e Período</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Propriedade */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Propriedade
                </label>
                <select
                  name="casaId"
                  value={formData.casaId}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                  required
                >
                  <option value="">Selecione uma propriedade</option>
                  {casas.map(casa => (
                    <option key={casa.id} value={casa.id}>
                      {casa.nome} - R$ {casa.valorDiaria}/noite
                    </option>
                  ))}
                </select>
              </div>

              {/* Check-in */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in
                </label>
                <Input
                  type="date"
                  name="dataCheckin"
                  value={formData.dataCheckin}
                  onChange={handleChange}
                  className="w-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                  required
                />
              </div>
            </div>

            {/* Check-out em linha separada para melhor controle */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check-out
              </label>
              <Input
                type="date"
                name="dataCheckout"
                value={formData.dataCheckout}
                onChange={handleChange}
                className="w-full md:w-1/2 focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                required
              />
            </div>
          </div>

          {/* Segunda Linha: Hóspedes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Hóspedes</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hóspede Principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hóspede Principal
                </label>
                <div className="flex gap-2">
                  <select
                    name="hospedePrincipalId"
                    value={formData.hospedePrincipalId}
                    onChange={handleChange}
                    className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                    required
                    disabled={loading || hospedes.length === 0}
                  >
                    {loading ? (
                      <option value="">Carregando hóspedes...</option>
                    ) : hospedes.length === 0 ? (
                      <option value="">Nenhum hóspede cadastrado</option>
                    ) : (
                      hospedes.map((hospede) => (
                        <option key={hospede.id} value={hospede.id}>
                          {hospede.nome} - {hospede.cpf}
                        </option>
                      ))
                    )}
                  </select>
                  <Link href="/proprietario/hospedes/adicionar">
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Hóspede responsável pela reserva
                </p>
              </div>

              {/* Número de Pessoas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Pessoas
                </label>
                <Input
                  type="number"
                  name="numPessoas"
                  value={formData.numPessoas}
                  onChange={handleChange}
                  min="1"
                  className={`w-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400 ${
                    validacaoError ? 'border-red-300 bg-red-50' : ''
                  }`}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Total de pessoas que ocuparão a propriedade
                  {casaSelecionada && (
                    <span className="text-blue-600"> (máx. {casaSelecionada.maxPessoas})</span>
                  )}
                </p>
              </div>
            </div>

            {/* Status dos Hóspedes */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Hóspedes Selecionados: {1 + (formData.hospedeIds?.length || 0)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Pessoas Informadas: {formData.numPessoas}
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                O número de pessoas deve ser compatível com os hóspedes selecionados
              </p>
            </div>

            {/* Hóspedes Adicionais */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hóspedes Adicionais (Opcional)
              </label>
              <select
                multiple
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions).map(option => Number(option.value));
                  setFormData(prev => ({ ...prev, hospedeIds: selectedOptions }));
                  setValidacaoError(null); // Clear validation error when changing guests
                }}
                disabled={loading || hospedes.length === 0}
              >
                {loading ? (
                  <option value="">Carregando hóspedes...</option>
                ) : hospedes.length === 0 ? (
                  <option value="">Nenhum hóspede cadastrado</option>
                ) : (
                  hospedes
                    .filter(hospede => hospede.id !== formData.hospedePrincipalId)
                    .map((hospede) => (
                      <option key={hospede.id} value={hospede.id}>
                        {hospede.nome} - {hospede.cpf}
                      </option>
                    ))
                )}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos hóspedes
              </p>
            </div>
          </div>

          {/* Terceira Linha: Detalhes e Resumo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhes da Reserva */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-purple-600" />
                <h2 className="text-lg font-semibold text-gray-900">Detalhes da Reserva</h2>
              </div>

              <div className="space-y-4">
                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Reserva
                  </label>
                  <Input
                    type="text"
                    name="motivo"
                    value={formData.motivo}
                    onChange={handleChange}
                    placeholder="Ex: Férias, trabalho, evento familiar..."
                    className="w-full focus:ring-1 focus:ring-gray-400 focus:border-gray-400"
                    required
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações (Opcional)
                  </label>
                  <textarea
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                    rows={3}
                    placeholder="Informações adicionais sobre a reserva..."
                  />
                </div>
              </div>
            </div>

            {/* Resumo e Valor */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calculator className="h-5 w-5 text-emerald-600" />
                <h2 className="text-lg font-semibold text-gray-900">Resumo da Reserva</h2>
              </div>

              <div className="space-y-3">
                {casaSelecionada && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Propriedade:</span>
                      <span className="font-medium text-gray-900">{casaSelecionada.nome}</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Capacidade Máx.:</span>
                      <span className="font-medium text-gray-900">{casaSelecionada.maxPessoas} pessoas</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Diária:</span>
                      <span className="font-medium text-gray-900">R$ {casaSelecionada.valorDiaria}</span>
                    </div>

                    {numNoites > 0 && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-sm text-gray-600">Noites:</span>
                          <span className="font-medium text-gray-900">{numNoites}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 text-lg font-bold text-emerald-700 bg-emerald-50 -mx-6 px-6 rounded-md">
                          <span>Valor Total:</span>
                          <span>R$ {valorTotal.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </>
                )}

                {numNoites === 0 && formData.dataCheckin && formData.dataCheckout && (
                  <div className="text-center py-6">
                    <Clock className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Selecione datas válidas para ver o cálculo
                    </p>
                  </div>
                )}

                {!casaSelecionada && (
                  <div className="text-center py-6">
                    <Home className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Selecione uma propriedade para ver os detalhes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status de Disponibilidade */}
          {disponibilidade !== null && (
            <div className={`p-4 rounded-lg border ${
              disponibilidade.disponivel 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              {disponibilidade.disponivel ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Propriedade disponível!</p>
                    <p className="text-green-700 text-sm">Você pode prosseguir com a reserva.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Propriedade não disponível</p>
                    <p className="text-red-700 text-sm">
                      {disponibilidade.motivo || "Já existe uma reserva para este período."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ações */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={verificarDisponibilidade}
                  disabled={loading || !formData.casaId}
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verificar Disponibilidade
                </Button>
              </div>

              <Button
                type="submit"
                disabled={loading || (disponibilidade !== null && !disponibilidade.disponivel) || !!validacaoError}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
              >
                <Calendar className="h-4 w-4" />
                {loading ? "Criando Reserva..." : "Criar Reserva"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
