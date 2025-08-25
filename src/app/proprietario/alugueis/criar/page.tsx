"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reservasService, casasService, hospedesService } from "@/lib/api";
import { Casa, NovaReserva, Hospede } from "@/lib/types";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";

export default function CriarReserva() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [hospedes, setHospedes] = useState<Hospede[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [disponibilidade, setDisponibilidade] = useState<{ disponivel: boolean, motivo?: string } | null>(null);
  
  const [formData, setFormData] = useState<NovaReserva>({
    casaId: 0,
    hospedePrincipalId: 0,
    hospedeIds: [],
    dataCheckin: new Date().toISOString().split('T')[0],
    dataCheckout: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    numPessoas: 1,
    valorPago: 0,
    observacoes: "",
    dataCheckoutValid: true
  });

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
        const hospedesData = await hospedesService.listarHospedes();
        setHospedes(hospedesData);
        if (hospedesData.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            hospedePrincipalId: hospedesData[0].id || 0 
          }));
        } else {
          // If no guests found, show message
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'numPessoas' || name === 'valorPago') {
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

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Nova Reserva</h1>
        <Link href="/proprietario/alugueis">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Informações da Reserva
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Casa</label>
                <select
                  name="casaId"
                  value={formData.casaId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Selecione uma casa</option>
                  {casas.map(casa => (
                    <option key={casa.id} value={casa.id}>
                      {casa.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Hóspede Principal</label>
                <div className="flex gap-2">
                  <select
                    name="hospedePrincipalId"
                    value={formData.hospedePrincipalId}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
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
                    <Button type="button" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-gray-500">
                  Selecione o hóspede responsável pela reserva ou adicione um novo.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Data de Check-in</label>
                <Input
                  type="date"
                  name="dataCheckin"
                  value={formData.dataCheckin}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Data de Check-out</label>
                <Input
                  type="date"
                  name="dataCheckout"
                  value={formData.dataCheckout}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Número de Pessoas</label>
                <Input
                  type="number"
                  name="numPessoas"
                  value={formData.numPessoas}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Valor Pago (R$)</label>
                <Input
                  type="number"
                  name="valorPago"
                  value={formData.valorPago}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Hóspedes Adicionais</label>
              <select
                multiple
                className="w-full p-2 border rounded-md"
                onChange={(e) => {
                  const selectedOptions = Array.from(e.target.selectedOptions).map(option => Number(option.value));
                  setFormData(prev => ({ ...prev, hospedeIds: selectedOptions }));
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
              <p className="text-xs text-gray-500">
                Segure Ctrl (ou Cmd no Mac) para selecionar múltiplos hóspedes.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Observações</label>
              <textarea
                name="observacoes"
                value={formData.observacoes}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                rows={3}
              ></textarea>
            </div>

            {disponibilidade !== null && (
              <div className={`p-4 rounded-md ${disponibilidade.disponivel ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {disponibilidade.disponivel ? (
                  <p className="text-green-700 flex items-center">
                    <span className="mr-2">✓</span> Casa disponível para o período selecionado!
                  </p>
                ) : (
                  <p className="text-red-700">
                    Casa não disponível: {disponibilidade.motivo || "Já existe uma reserva para este período."}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={verificarDisponibilidade}
                disabled={loading || !formData.casaId}
              >
                Verificar Disponibilidade
              </Button>
              
              <Button
                type="submit"
                disabled={loading || (disponibilidade !== null && !disponibilidade.disponivel)}
              >
                {loading ? "Salvando..." : "Criar Reserva"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
