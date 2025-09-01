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
  const [reservas, setReservas] = useState<Reserva[]>([]);
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
      console.log('useEffect reservas: casaSelecionada ou authorized falsy', { casaSelecionada, authorized });
      return;
    }

    console.log('useEffect reservas: Carregando reservas para casa:', casaSelecionada);
    console.log('useEffect reservas: Limpando reservas antigas antes de carregar novas');

    // Limpar reservas imediatamente quando a casa muda
    setReservas([]);

    const fetchReservas = async () => {
      setIsLoading(true);
      try {
        console.log('Fazendo chamada API para reservas da casa:', casaSelecionada);
        console.log('Parâmetros sendo enviados:', { casaId: casaSelecionada });

        const data = await reservasService.getReservas({
          casaId: casaSelecionada
        });

        console.log('Dados recebidos da API:', data);
        console.log('Tipo dos dados:', typeof data);
        console.log('É array?', Array.isArray(data));

        if (data && Array.isArray(data)) {
          console.log('Reservas válidas recebidas:', data.length);
          data.forEach((reserva, index) => {
            console.log(`Reserva ${index + 1}:`, {
              id: reserva.id,
              casaId: reserva.casaId,
              dataCheckin: reserva.dataCheckin,
              dataCheckout: reserva.dataCheckout
            });
          });
          setReservas(data);
          console.log('Estado reservas atualizado com:', data.length, 'reservas');
        } else {
          console.log('Nenhuma reserva encontrada ou dados inválidos');
          setReservas([]);
        }
      } catch (error) {
        console.error("Erro ao carregar reservas:", error);
        console.log('Limpando reservas devido ao erro');
        setReservas([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservas();
  }, [casaSelecionada, authorized]);

  // Limpar reservas quando a casa muda (segurança adicional)
  useEffect(() => {
    console.log('Casa mudou para:', casaSelecionada, '- limpando reservas antigas');
    setReservas([]);
  }, [casaSelecionada]);

  // Monitorar mudanças no estado das reservas
  useEffect(() => {
    console.log('Estado reservas mudou:', reservas.length, 'reservas no estado');
    reservas.forEach((reserva, index) => {
      console.log(`Estado reserva ${index + 1}:`, {
        id: reserva.id,
        casaId: reserva.casaId,
        dataCheckin: reserva.dataCheckin,
        dataCheckout: reserva.dataCheckout
      });
    });
  }, [reservas]);

  // Verificar se um dia tem reserva
  const getReservasDoDia = (date: Date) => {
    console.log('Verificando reservas para data:', format(date, 'yyyy-MM-dd'));
    console.log('Total de reservas no estado:', reservas.length);

    const reservasDoDia = reservas.filter(reserva => {
      console.log('Verificando reserva:', reserva.id, 'casaId:', reserva.casaId, 'casaSelecionada:', casaSelecionada);

      // Verificar se a reserva pertence à casa selecionada
      if (reserva.casaId !== casaSelecionada) {
        console.log('Reserva', reserva.id, 'não pertence à casa selecionada, pulando...');
        return false;
      }

      const checkin = parseISO(reserva.dataCheckin);
      const checkout = parseISO(reserva.dataCheckout);

      console.log('Reserva', reserva.id, '- Checkin:', format(checkin, 'yyyy-MM-dd'), 'Checkout:', format(checkout, 'yyyy-MM-dd'));

      // Verificar se a data está dentro do período da reserva (inclusive)
      const isInRange = date >= checkin && date <= checkout;

      if (isInRange) {
        console.log('✅ Reserva encontrada para data:', format(date, 'yyyy-MM-dd'), 'reserva:', reserva.id);
      }

      return isInRange;
    });

    console.log('Reservas encontradas para', format(date, 'yyyy-MM-dd'), ':', reservasDoDia.length);
    return reservasDoDia;
  };

  // Verificar se um dia é checkin ou checkout
  const getTipoDia = (date: Date, reservasDoDia: Reserva[]) => {
    for (const reserva of reservasDoDia) {
      const checkin = parseISO(reserva.dataCheckin);
      const checkout = parseISO(reserva.dataCheckout);

      if (isSameDay(date, checkin)) return 'checkin';
      if (isSameDay(date, checkout)) return 'checkout';
    }
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
    totalReservas: reservas.length,
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
                console.log('Reservas atuais:', reservas.length);

                // Forçar limpeza imediata do estado
                setReservas([]);
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
              <p className="ml-3 text-gray-600">Carregando reservas...</p>
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
                  const reservasDoDia = getReservasDoDia(date);
                  const temReserva = reservasDoDia.length > 0;
                  const tipoDia = temReserva ? getTipoDia(date, reservasDoDia) : null;
                  const isCurrentMonth = isSameMonth(date, currentMonth);

                  console.log(`Dia ${format(date, 'yyyy-MM-dd')}: temReserva=${temReserva}, reservas=${reservasDoDia.length}`);

                  return (
                    <div
                      key={index}
                      className={`
                        min-h-[100px] p-2 border rounded-lg transition-all duration-200
                        ${!isCurrentMonth
                          ? 'bg-gray-50 text-gray-400 border-gray-200'
                          : temReserva
                            ? tipoDia === 'checkin'
                              ? 'bg-green-100 border-green-300 text-green-800'
                              : tipoDia === 'checkout'
                                ? 'bg-red-100 border-red-300 text-red-800'
                                : 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="text-sm font-medium mb-2">
                        {format(date, 'd')}
                      </div>

                      {temReserva && (
                        <div className="space-y-1">
                          {reservasDoDia.slice(0, 2).map((reserva, idx) => (
                            <div
                              key={reserva.id}
                              className={`
                                text-xs p-1 rounded truncate
                                ${tipoDia === 'checkin'
                                  ? 'bg-green-200 text-green-800'
                                  : tipoDia === 'checkout'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-blue-200 text-blue-800'
                                }
                              `}
                              title={`R$ ${reserva.valorTotal?.toFixed(2) || reserva.valorPago.toFixed(2)}`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="text-xs">Reservado</span>
                              </div>
                            </div>
                          ))}
                          {reservasDoDia.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{reservasDoDia.length - 2} mais
                            </div>
                          )}
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
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-sm text-gray-600">Check-in</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border border-blue-300 rounded"></div>
                    <span className="text-sm text-gray-600">Ocupado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                    <span className="text-sm text-gray-600">Check-out</span>
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
