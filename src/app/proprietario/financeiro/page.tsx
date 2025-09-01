"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Casa, Reserva } from "@/lib/types";
import { casasService, reservasService, authService } from "@/lib/api";
import { DollarSign, TrendingUp, Calendar, Home, BarChart3, PieChart } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Pie
} from "recharts";

export default function FinanceiroPage() {
  const [casas, setCasas] = useState<Casa[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  // Verificar autenticação
  useEffect(() => {
    const userRole = authService.getUserRole();
    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    if (userRole !== 'PROPRIETARIO') {
      router.push('/');
      return;
    }

    setAuthorized(true);
  }, [router]);

  // Carregar dados
  useEffect(() => {
    if (!authorized) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [casasData, reservasData] = await Promise.all([
          casasService.listarCasas(),
          reservasService.getReservas()
        ]);

        setCasas(casasData || []);
        setReservas(reservasData || []);
      } catch (error) {
        console.error("Erro ao carregar dados financeiros:", error);
        setCasas([]);
        setReservas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authorized]);

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // Filtrar reservas do mês atual
    const reservasMesAtual = reservas.filter(reserva => {
      const dataCheckin = new Date(reserva.dataCheckin);
      return dataCheckin.getMonth() === mesAtual && dataCheckin.getFullYear() === anoAtual;
    });

    // Calcular receita total do mês
    const receitaMes = reservasMesAtual.reduce((total, reserva) => {
      return total + (reserva.valorTotal || reserva.valorPago);
    }, 0);

    // Calcular receita total geral
    const receitaTotal = reservas.reduce((total, reserva) => {
      return total + (reserva.valorTotal || reserva.valorPago);
    }, 0);

    // Contar reservas ativas
    const reservasAtivas = reservas.filter(reserva => {
      const checkout = new Date(reserva.dataCheckout);
      return checkout >= hoje;
    }).length;

    return {
      receitaMes,
      receitaTotal,
      reservasAtivas,
      totalReservas: reservas.length
    };
  };

  // Preparar dados para gráfico de ganhos por mês
  const prepararDadosMensais = () => {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const dadosMensais = meses.map((mes, index) => {
      const reservasMes = reservas.filter(reserva => {
        const dataCheckin = new Date(reserva.dataCheckin);
        return dataCheckin.getMonth() === index;
      });

      const receita = reservasMes.reduce((total, reserva) => {
        return total + (reserva.valorTotal || reserva.valorPago);
      }, 0);

      return {
        mes,
        receita: Math.round(receita),
        reservas: reservasMes.length
      };
    });

    return dadosMensais;
  };

  // Preparar dados para gráfico de ganhos por casa
  const prepararDadosPorCasa = () => {
    return casas.map(casa => {
      const reservasCasa = reservas.filter(reserva => reserva.casaId === casa.id);
      const receita = reservasCasa.reduce((total, reserva) => {
        return total + (reserva.valorTotal || reserva.valorPago);
      }, 0);

      return {
        nome: casa.nome,
        receita: Math.round(receita),
        reservas: reservasCasa.length
      };
    }).filter(item => item.receita > 0);
  };

  // Cores para os gráficos
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
      </div>
    );
  }

  const stats = calcularEstatisticas();
  const dadosMensais = prepararDadosMensais();
  const dadosPorCasa = prepararDadosPorCasa();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 border-2 border-green-600 rounded-lg shadow-sm">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Financeiro
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Acompanhe seus ganhos e estatísticas financeiras
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita do Mês</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.receitaMes.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {stats.receitaTotal.toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Reservas Ativas</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.reservasAtivas}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Reservas</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.totalReservas}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Home className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Ganhos por Mês */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Ganhos por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Bar dataKey="receita" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Distribuição por Casa */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Receita por Propriedade
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
              </div>
            ) : dadosPorCasa.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={dadosPorCasa}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="receita"
                  >
                    {dadosPorCasa.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Tendência */}
        <Card className="shadow-lg lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência de Ganhos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dadosMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Receita']}
                  />
                  <Area
                    type="monotone"
                    dataKey="receita"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Detalhes por Casa */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Detalhes por Propriedade</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Propriedade</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Reservas</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Receita Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Média por Reserva</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPorCasa.map((casa, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{casa.nome}</td>
                      <td className="py-3 px-4 text-right">{casa.reservas}</td>
                      <td className="py-3 px-4 text-right text-green-600 font-medium">
                        R$ {casa.receita.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        R$ {casa.reservas > 0 ? (casa.receita / casa.reservas).toLocaleString('pt-BR') : '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
