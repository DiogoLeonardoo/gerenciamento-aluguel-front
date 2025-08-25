"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { reservasService, casasService } from "@/lib/api";
import { Casa, FaturamentoResponse } from "@/lib/types";
import { DollarSign, TrendingUp, Home, Calendar, Users } from "lucide-react";
import Link from "next/link";

// Bar chart component for monthly data
const MonthlyBarChart = ({ data }: { data: { [month: string]: { faturamento: number, reservas: number, ocupacao: number } } }) => {
  // Process the data for the chart
  const months = Object.keys(data);
  const maxValue = Math.max(...Object.values(data).map(d => d.faturamento));
  
  // Format month abbreviations in Portuguese
  const formatMonth = (monthKey: string) => {
    const monthMap: { [key: string]: string } = {
      '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
      '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez'
    };
    
    const [year, month] = monthKey.split('-');
    return `${monthMap[month]}/${year.slice(2)}`;
  };

  return (
    <div className="mt-6">
      <div className="flex items-end h-60 space-x-2">
        {months.map(month => {
          const height = data[month].faturamento > 0 
            ? (data[month].faturamento / maxValue) * 100 
            : 0;
            
          return (
            <div key={month} className="flex flex-col items-center flex-1">
              <div className="w-full flex justify-center mb-1">
                <div 
                  className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-all relative group"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    R$ {data[month].faturamento.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    <br />
                    {data[month].reservas} reserva(s)
                  </div>
                </div>
              </div>
              <div className="text-xs font-medium mt-1 text-gray-600">
                {formatMonth(month)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function Faturamento() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [faturamento, setFaturamento] = useState<FaturamentoResponse | null>(null);
  const [casas, setCasas] = useState<Casa[]>([]);
  const [selectedCasa, setSelectedCasa] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState({
    inicio: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st of current year
    fim: new Date().toISOString().split('T')[0], // Today
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Get houses
        const casasData = await casasService.listarCasas();
        setCasas(casasData);
        
        // Get initial faturamento data
        const faturamentoData = await reservasService.getFaturamento({
          dataInicio: dateRange.inicio,
          dataFim: dateRange.fim
        });
        
        setFaturamento(faturamentoData);
        setError(null);
      } catch (error: any) {
        console.error("Erro ao carregar dados de faturamento:", error);
        setError(error.message || "Erro ao carregar dados de faturamento");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleCasaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedCasa(value ? parseInt(value) : undefined);
  };
  
  const fetchFilteredData = async () => {
    try {
      setLoading(true);
      
      const faturamentoData = await reservasService.getFaturamento({
        casaId: selectedCasa,
        dataInicio: dateRange.inicio,
        dataFim: dateRange.fim
      });
      
      setFaturamento(faturamentoData);
      setError(null);
    } catch (error: any) {
      console.error("Erro ao carregar dados filtrados:", error);
      setError(error.message || "Erro ao filtrar dados");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Relatório de Faturamento</h1>
        <Link href="/proprietario/alugueis">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Casa</label>
              <select
                value={selectedCasa || ""}
                onChange={handleCasaChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Todas as casas</option>
                {casas.map(casa => (
                  <option key={casa.id} value={casa.id}>
                    {casa.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Data Início</label>
              <Input
                type="date"
                name="inicio"
                value={dateRange.inicio}
                onChange={handleDateChange}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Data Fim</label>
              <Input
                type="date"
                name="fim"
                value={dateRange.fim}
                onChange={handleDateChange}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={fetchFilteredData} disabled={loading}>
              {loading ? "Carregando..." : "Aplicar Filtros"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {faturamento && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-emerald-700 flex items-center">
                <DollarSign className="mr-2 h-5 w-5" /> Faturamento Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-800">
                R$ {faturamento.totalFaturado.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-700 flex items-center">
                <Calendar className="mr-2 h-5 w-5" /> Quantidade de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-800">
                {faturamento.quantidadeReservas}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-purple-700 flex items-center">
                <Users className="mr-2 h-5 w-5" /> Média de Ocupação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">
                {faturamento.mediaOcupacao.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Chart */}
      {faturamento && Object.keys(faturamento.detalhes).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" /> Faturamento Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-60">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              </div>
            ) : (
              <MonthlyBarChart data={faturamento.detalhes} />
            )}
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {faturamento && Object.keys(faturamento.detalhes).length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Sem dados de faturamento</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há dados de faturamento disponíveis para o período selecionado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
