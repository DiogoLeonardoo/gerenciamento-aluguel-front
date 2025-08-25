"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reservasService } from "@/lib/api";
import { Reserva, StatusReserva } from "@/lib/types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  CheckCircle, 
  XCircle, 
  Calendar, 
  LogIn, 
  LogOut, 
  Users, 
  DollarSign,
  Info,
  Plus
} from "lucide-react";
import Link from "next/link";

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return dateString;
  }
};

// Component to display status badge
const StatusBadge = ({ status }: { status: StatusReserva }) => {
  const getStatusInfo = () => {
    switch (status) {
      case "PENDENTE":
        return { color: "bg-yellow-100 text-yellow-800", icon: <Info size={16} /> };
      case "CONFIRMADA":
        return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle size={16} /> };
      case "CANCELADA":
        return { color: "bg-red-100 text-red-800", icon: <XCircle size={16} /> };
      case "CONCLUIDA":
        return { color: "bg-green-100 text-green-800", icon: <CheckCircle size={16} /> };
      case "CHECKIN":
        return { color: "bg-purple-100 text-purple-800", icon: <LogIn size={16} /> };
      case "CHECKOUT":
        return { color: "bg-gray-100 text-gray-800", icon: <LogOut size={16} /> };
      default:
        return { color: "bg-gray-100 text-gray-600", icon: <Info size={16} /> };
    }
  };

  const { color, icon } = getStatusInfo();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      <span className="mr-1">{icon}</span>
      {status}
    </span>
  );
};

// Main component
export default function GerenciarAlugueis() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkinsHoje, setCheckinsHoje] = useState<Reserva[]>([]);
  const [checkoutsHoje, setCheckoutsHoje] = useState<Reserva[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await reservasService.getReservas();
        setReservas(data);
        
        // Fetch today's check-ins and check-outs
        const checkins = await reservasService.getCheckinsHoje();
        setCheckinsHoje(checkins);
        
        const checkouts = await reservasService.getCheckoutsHoje();
        setCheckoutsHoje(checkouts);
        
        setError(null);
      } catch (err: any) {
        console.error("Erro ao carregar reservas:", err);
        setError(err.message || "Erro ao carregar reservas");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (id: number, action: 'confirmar' | 'checkin' | 'checkout' | 'cancelar') => {
    try {
      setLoading(true);
      let updatedReserva;

      switch (action) {
        case 'confirmar':
          updatedReserva = await reservasService.confirmarReserva(id);
          break;
        case 'checkin':
          updatedReserva = await reservasService.fazerCheckin(id);
          break;
        case 'checkout':
          updatedReserva = await reservasService.fazerCheckout(id);
          break;
        case 'cancelar':
          updatedReserva = await reservasService.cancelarReserva(id);
          break;
      }

      // Update the reservations list
      setReservas(prev => prev.map(res => res.id === id ? updatedReserva : res));
      
      // Refresh check-ins and check-outs for today
      const checkins = await reservasService.getCheckinsHoje();
      setCheckinsHoje(checkins);
      
      const checkouts = await reservasService.getCheckoutsHoje();
      setCheckoutsHoje(checkouts);
      
    } catch (err: any) {
      console.error(`Erro ao ${action} reserva:`, err);
      setError(err.message || `Erro ao ${action} reserva`);
    } finally {
      setLoading(false);
    }
  };

  const getActionButtons = (reserva: Reserva) => {
    switch (reserva.status) {
      case "PENDENTE":
        return (
          <>
            <Button 
              onClick={() => handleStatusChange(reserva.id!, 'confirmar')}
              className="bg-blue-600 hover:bg-blue-700 mr-2"
              size="sm"
            >
              <CheckCircle className="mr-1 h-4 w-4" /> Confirmar
            </Button>
            <Button 
              onClick={() => handleStatusChange(reserva.id!, 'cancelar')}
              variant="destructive"
              size="sm"
            >
              <XCircle className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          </>
        );
      case "CONFIRMADA":
        return (
          <>
            <Button 
              onClick={() => handleStatusChange(reserva.id!, 'checkin')}
              className="bg-purple-600 hover:bg-purple-700 mr-2"
              size="sm"
            >
              <LogIn className="mr-1 h-4 w-4" /> Check-in
            </Button>
            <Button 
              onClick={() => handleStatusChange(reserva.id!, 'cancelar')}
              variant="destructive"
              size="sm"
            >
              <XCircle className="mr-1 h-4 w-4" /> Cancelar
            </Button>
          </>
        );
      case "CHECKIN":
        return (
          <Button 
            onClick={() => handleStatusChange(reserva.id!, 'checkout')}
            className="bg-emerald-600 hover:bg-emerald-700"
            size="sm"
          >
            <LogOut className="mr-1 h-4 w-4" /> Check-out
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciar Aluguéis</h1>
        <Link href="/proprietario/alugueis/criar">
          <Button>
            <Plus size={18} className="mr-1" /> Nova Reserva
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-purple-700">
              <LogIn className="mr-2 h-5 w-5" /> Check-ins de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-purple-800">{checkinsHoje.length}</p>
            <div className="mt-2 space-y-2">
              {checkinsHoje.length > 0 ? (
                checkinsHoje.map(checkin => (
                  <div key={checkin.id} className="text-sm p-2 bg-white rounded-md shadow-sm">
                    {checkin.casa?.nome || `Casa #${checkin.casaId}`}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum check-in para hoje</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-emerald-700">
              <LogOut className="mr-2 h-5 w-5" /> Check-outs de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-800">{checkoutsHoje.length}</p>
            <div className="mt-2 space-y-2">
              {checkoutsHoje.length > 0 ? (
                checkoutsHoje.map(checkout => (
                  <div key={checkout.id} className="text-sm p-2 bg-white rounded-md shadow-sm">
                    {checkout.casa?.nome || `Casa #${checkout.casaId}`}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhum check-out para hoje</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center text-blue-700">
              <DollarSign className="mr-2 h-5 w-5" /> Resumo de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-800">{reservas.length}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="text-sm bg-white p-2 rounded-md shadow-sm">
                <span className="text-gray-500">Confirmadas:</span>
                <p className="font-medium">
                  {reservas.filter(r => r.status === "CONFIRMADA").length}
                </p>
              </div>
              <div className="text-sm bg-white p-2 rounded-md shadow-sm">
                <span className="text-gray-500">Pendentes:</span>
                <p className="font-medium">
                  {reservas.filter(r => r.status === "PENDENTE").length}
                </p>
              </div>
            </div>
            <div className="mt-2">
              <Link 
                href="/proprietario/alugueis/faturamento" 
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                Ver relatório de faturamento →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reservations list */}
      <Card>
        <CardHeader>
          <CardTitle>Reservas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-gray-500">Carregando reservas...</p>
            </div>
          ) : reservas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Casa
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hóspede
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Período
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reservas.map((reserva) => (
                    <tr key={reserva.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {reserva.casa?.nome || `Casa #${reserva.casaId}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {reserva.hospedePrincipal?.nome || `Hóspede #${reserva.hospedePrincipalId}`}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <Users size={12} className="mr-1" /> {reserva.numPessoas} pessoa(s)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(reserva.dataCheckin)}
                        </div>
                        <div className="text-sm text-gray-500">
                          até {formatDate(reserva.dataCheckout)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={reserva.status || "PENDENTE"} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">
                          R$ {(reserva.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-xs text-gray-500">
                          Pago: R$ {(reserva.valorPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/proprietario/alugueis/${reserva.id}`)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          {getActionButtons(reserva)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 border border-dashed rounded-md">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-500">Nenhuma reserva encontrada</p>
              <Button 
                onClick={() => router.push('/proprietario/alugueis/criar')}
                className="mt-4"
              >
                <Plus size={18} className="mr-1" /> Criar Nova Reserva
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
