"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Casa, Reserva } from "@/lib/types";
import { casasService, reservasService, authService } from "@/lib/api";
import { Calendar, ChevronLeft, ChevronRight, Home, DollarSign } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function CalendarioPage() {
  const [casas, setCasas] = useState<Casa[]>([]);
  const [diasReservados, setDiasReservados] = useState<string[]>([]);
  const [casaSelecionada, setCasaSelecionada] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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

  // Carregar casas do proprietário
  useEffect(() => {
    if (!authorized) return;

    const fetchCasas = async () => {
      try {
        const data = await casasService.listarCasas();
        console.log('Casas carregadas:', data?.length || 0, 'casas');
        setCasas(data);

        // Selecionar primeira casa automaticamente se houver
        if (data.length > 0) {
          const primeiraCasaId = data[0].id!;
          console.log('Selecionando primeira casa automaticamente:', primeiraCasaId);
          setCasaSelecionada(primeiraCasaId);
        }
      } catch (error) {
        console.error("Erro ao carregar casas:", error);
      }
    };

    fetchCasas();
  }, [authorized]);

  // Carregar reservas quando casa for selecionada
  useEffect(() => {
    if (!casaSelecionada || !authorized) {
      console.log('useEffect diasReservados: casaSelecionada ou authorized falsy', { casaSelecionada, authorized });
      return;
    }

    console.log('useEffect diasReservados: Carregando dias reservados para casa:', casaSelecionada);
    console.log('useEffect diasReservados: Limpando dias reservados antigas antes de carregar novas');

    // Limpar dias reservados imediatamente quando a casa muda
    setDiasReservados([]);

    const fetchDiasReservados = async () => {
      setIsLoading(true);
      try {
        console.log('Fazendo chamada API para dias reservados da casa:', casaSelecionada);

        const data = await reservasService.getDiasReservados(casaSelecionada);

        console.log('Dados recebidos da API:', data);
        console.log('Tipo dos dados:', typeof data);
        console.log('É array?', Array.isArray(data));

        if (data && Array.isArray(data)) {
          console.log('Dias reservados válidos recebidos:', data.length);
          data.forEach((dia, index) => {
            console.log(`Dia reservado ${index + 1}:`, dia);
          });
          setDiasReservados(data);
          console.log('Estado diasReservados atualizado com:', data.length, 'dias');
        } else {
          console.log('Nenhum dia reservado encontrado ou dados inválidos');
          setDiasReservados([]);
        }
      } catch (error) {
        console.error("Erro ao carregar dias reservados:", error);
        console.log('Limpando dias reservados devido ao erro');
        setDiasReservados([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiasReservados();
  }, [casaSelecionada, authorized]);

  // Limpar dias reservados quando a casa muda (segurança adicional)
  useEffect(() => {
    console.log('Casa mudou para:', casaSelecionada, '- limpando dias reservados antigas');
    setDiasReservados([]);
  }, [casaSelecionada]);

  // Monitorar mudanças no estado dos dias reservados
  useEffect(() => {
    console.log('Estado diasReservados mudou:', diasReservados.length, 'dias no estado');
    diasReservados.forEach((dia, index) => {
      console.log(`Dia reservado ${index + 1}:`, dia);
    });
  }, [diasReservados]);

  // Verificar se um dia tem reserva
  const getReservasDoDia = (date: Date) => {
    console.log('Verificando dias reservados para data:', format(date, 'yyyy-MM-dd'));
    console.log('Total de dias reservados no estado:', diasReservados.length);

    const diaFormatado = format(date, 'yyyy-MM-dd');
    const isReservado = diasReservados.includes(diaFormatado);

    console.log('Dia está reservado?', isReservado);
    return isReservado ? [diaFormatado] : [];
  };

  // Verificar se um dia é checkin ou checkout (simplificado, já que não temos os dados completos)
  const getTipoDia = (date: Date, diasReservadosDoDia: string[]) => {
    // Como não temos informações de checkin/checkout, marcamos todos como ocupados
    return 'ocupado';
  };

  // Gerar dias do mês
  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  // Navegação do mês
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
      </div>
    );
  }

  console.log('Renderizando calendário:', {
    casaSelecionada,
    totalDiasReservados: diasReservados.length,
    isLoading,
    currentMonth: format(currentMonth, 'yyyy-MM')
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 border-2 border-green-600 rounded-lg shadow-sm">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Calendário de Reservas
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Visualize todas as reservas da sua propriedade
            </p>
          </div>
        </div>
      </div>

      {/* Seletor de Casa */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Selecionar Propriedade:</span>
            </div>
            <select
              value={casaSelecionada?.toString() || ""}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                console.log('=== CASA MUDANDO ===');
                console.log('Casa anterior:', casaSelecionada);
                console.log('Nova casa:', newValue);
                console.log('Dias reservados atuais:', diasReservados.length);

                // Forçar limpeza imediata do estado
                setDiasReservados([]);
                setCasaSelecionada(newValue);

                console.log('Estado limpo, nova casa selecionada');
              }}
              className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="" disabled>Selecione uma propriedade</option>
              {casas.map((casa) => (
                <option key={casa.id} value={casa.id!.toString()}>
                  {casa.nome}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Calendário */}
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevMonth}
                className="hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={nextMonth}
                className="hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-r-transparent"></div>
              <p className="ml-3 text-gray-600">Carregando dias reservados...</p>
            </div>
          ) : (
            <>
              {/* Dias da semana */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dia) => (
                  <div key={dia} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50 rounded-md">
                    {dia}
                  </div>
                ))}
              </div>

              {/* Dias do mês */}
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((date, index) => {
                  const diasReservadosDoDia = getReservasDoDia(date);
                  const temReserva = diasReservadosDoDia.length > 0;
                  const tipoDia = temReserva ? getTipoDia(date, diasReservadosDoDia) : null;
                  const isCurrentMonth = isSameMonth(date, currentMonth);

                  console.log(`Dia ${format(date, 'yyyy-MM-dd')}: temReserva=${temReserva}, diasReservados=${diasReservadosDoDia.length}`);

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] p-2 border rounded-lg transition-all duration-200
                        ${!isCurrentMonth
                          ? 'bg-gray-50 text-gray-400 border-gray-200'
                          : temReserva
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="text-sm font-medium mb-2">
                        {format(date, 'd')}
                      </div>

                      {temReserva && (
                        <div className="space-y-1">
                          <div className="text-xs p-1 rounded truncate bg-blue-200 text-blue-800">
                            <div className="flex items-center gap-1">
                              <span className="text-xs">Reservado</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Legenda */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Legenda:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                    <span className="text-sm text-gray-600">Reservado</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
