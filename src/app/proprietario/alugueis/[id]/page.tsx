"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { reservasService } from "@/lib/api";
import { Reserva, StatusReserva } from "@/lib/types";
import Link from "next/link";
import { 
  ArrowLeft, 
  CalendarCheck, 
  Home, 
  Users, 
  CheckCircle, 
  XCircle, 
  LogIn, 
  LogOut, 
  AlertTriangle,
  Clock
} from "lucide-react";

// Function to format date nicely
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return dateString;
  }
};

// Component to display the reservation status badge
const StatusBadge = ({ status }: { status: StatusReserva }) => {
  const getStatusInfo = () => {
    switch (status) {
      case "PENDENTE":
        return { color: "bg-yellow-100 text-yellow-800", icon: <Clock size={16} /> };
      case "CONFIRMADA":
        return { color: "bg-blue-100 text-blue-800", icon: <CheckCircle size={16} /> };
      case "CANCELADA":
        return { color: "bg-red-100 text-red-800", icon: <XCircle size={16} /> };
      case "CONCLUIDA":
        return { color: "bg-green-100 text-green-800", icon: <CheckCircle size={16} /> };
      case "CHECKIN":
        return { color: "bg-yellow-100 text-yellow-800", icon: <LogIn size={16} /> };
      case "CHECKOUT":
        return { color: "bg-gray-100 text-gray-800", icon: <LogOut size={16} /> };
      default:
        return { color: "bg-gray-100 text-gray-600", icon: <AlertTriangle size={16} /> };
    }
  };

  const { color, icon } = getStatusInfo();

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full ${color}`}>
      <span className="mr-1">{icon}</span>
      {status}
    </div>
  );
};

export default function DetalhesReserva() {
  const params = useParams();
  const router = useRouter();
  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        setLoading(true);
        if (params.id) {
          const data = await reservasService.getReserva(Number(params.id));
          setReserva(data);
        }
      } catch (err: any) {
        console.error("Erro ao carregar reserva:", err);
        setError(err.message || "Erro ao carregar detalhes da reserva");
      } finally {
        setLoading(false);
      }
    };

    fetchReserva();
  }, [params.id]);

  const handleStatusChange = async (action: 'confirmar' | 'checkin' | 'checkout' | 'cancelar') => {
    if (!reserva || !reserva.id) return;
    
    try {
      setLoading(true);
      let updatedReserva;

      switch (action) {
        case 'confirmar':
          updatedReserva = await reservasService.confirmarReserva(reserva.id);
          break;
        case 'checkin':
          updatedReserva = await reservasService.fazerCheckin(reserva.id);
          break;
        case 'checkout':
          updatedReserva = await reservasService.fazerCheckout(reserva.id);
          break;
        case 'cancelar':
          updatedReserva = await reservasService.cancelarReserva(reserva.id, reserva.motivo);
          break;
      }

      setReserva(updatedReserva);
    } catch (err: any) {
      console.error(`Erro ao ${action} reserva:`, err);
      setError(err.message || `Erro ao ${action} reserva`);
    } finally {
      setLoading(false);
    }
  };

  const getActionButtons = () => {
    if (!reserva) return null;
    
    switch (reserva.status) {
      case "PENDENTE":
        return (
          <>
            <Button 
              onClick={() => handleStatusChange('confirmar')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Reserva
            </Button>
            <Button 
              onClick={() => handleStatusChange('cancelar')}
              variant="destructive"
              className="ml-2"
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancelar Reserva
            </Button>
          </>
        );
      case "CONFIRMADA":
        return (
          <>
            <Button 
              onClick={() => handleStatusChange('checkin')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <LogIn style={{color: 'white'}} className="mr-2 h-4 w-4" /> <p style={{color: 'white'}}>Realizar Check-in</p>
            </Button>
            <Button 
              onClick={() => handleStatusChange('cancelar')}
              variant="destructive"
              className="ml-2"
            >
              <XCircle className="mr-2 h-4 w-4" /> Cancelar Reserva
            </Button>
          </>
        );
      case "CHECKIN":
        return (
          <Button 
            onClick={() => handleStatusChange('checkout')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <LogOut className="mr-2 h-4 w-4" /> Realizar Check-out
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <span className="ml-2">Carregando detalhes da reserva...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/proprietario/alugueis')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Aluguéis
          </Button>
        </div>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Atenção!</strong>
          <span className="block sm:inline"> Reserva não encontrada.</span>
        </div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push('/proprietario/alugueis')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Aluguéis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/proprietario/alugueis">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Detalhes da Reserva</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <CalendarCheck className="mr-2 h-5 w-5 text-blue-600" />
                  Reserva #{reserva.id}
                </CardTitle>
                <StatusBadge status={reserva.status || "PENDENTE"} />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-500 mb-2 flex items-center">
                    <Home className="mr-2 h-4 w-4" /> Imóvel
                  </h3>
                  <p className="text-lg font-medium">{reserva.casa?.nome || `Casa #${reserva.casaId}`}</p>
                  {reserva.casa && (
                    <p className="text-gray-600 mt-1 text-sm">
                      {reserva.casa.endereco}, {reserva.casa.cidade}/{reserva.casa.estado}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-500 mb-2 flex items-center">
                    <Users className="mr-2 h-4 w-4" /> Hóspedes
                  </h3>
                  <p className="text-lg font-medium">
                    {reserva.hospedePrincipal?.nome || `Hóspede #${reserva.hospedePrincipalId}`}
                  </p>
                  <p className="text-gray-600 mt-1">Total: {reserva.numPessoas} pessoa(s)</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-500 mb-2">Período da Estadia</h3>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-500">Check-in</p>
                    <p className="text-md font-medium">{formatDate(reserva.dataCheckin)}</p>
                  </div>
                  <div className="text-gray-400">→</div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-500">Check-out</p>
                    <p className="text-md font-medium">{formatDate(reserva.dataCheckout)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-500 mb-2">Valores</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor Total</span>
                    <span className="text-lg font-medium">
                      R$ {(reserva.valorTotal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                  </div>
                </div>
              </div>

              {reserva.observacoes && (
                <div>
                  <h3 className="font-medium text-gray-500 mb-2">Observações</h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-gray-700 whitespace-pre-wrap">{reserva.observacoes}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                {getActionButtons()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Datas Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Data de Criação</p>
                <p className="font-medium">{reserva.createdAt ? formatDate(reserva.createdAt) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Atualização</p>
                <p className="font-medium">{reserva.updatedAt ? formatDate(reserva.updatedAt) : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/proprietario/casas/${reserva.casaId}`} className="w-full block">
                <Button variant="outline" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" /> Ver Detalhes da Casa
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
