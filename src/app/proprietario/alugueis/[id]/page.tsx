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
        return {
          color: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white shadow-lg",
          icon: <Clock size={16} />
        };
      case "CONFIRMADA":
        return {
          color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg",
          icon: <CheckCircle size={16} />
        };
      case "CANCELADA":
        return {
          color: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
          icon: <XCircle size={16} />
        };
      case "CONCLUIDA":
        return {
          color: "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg",
          icon: <CheckCircle size={16} />
        };
      case "CHECKIN":
        return {
          color: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg",
          icon: <LogIn size={16} />
        };
      case "CHECKOUT":
        return {
          color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg",
          icon: <LogOut size={16} />
        };
      default:
        return {
          color: "bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg",
          icon: <AlertTriangle size={16} />
        };
    }
  };

  const { color, icon } = getStatusInfo();

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-full ${color} font-medium text-sm`}>
      <span className="mr-2">{icon}</span>
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
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleStatusChange('confirmar')}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Confirmar Reserva
            </Button>
            <Button
              onClick={() => handleStatusChange('cancelar')}
              variant="destructive"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancelar Reserva
            </Button>
          </div>
        );
      case "CONFIRMADA":
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleStatusChange('checkin')}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Realizar Check-in
            </Button>
            <Button
              onClick={() => handleStatusChange('cancelar')}
              variant="destructive"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Cancelar Reserva
            </Button>
          </div>
        );
      case "CHECKIN":
        return (
          <Button
            onClick={() => handleStatusChange('checkout')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            <LogOut className="mr-2 h-5 w-5" />
            Realizar Check-out
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-r-transparent"></div>
          <span className="text-emerald-700 font-medium">Carregando detalhes da reserva...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white border-l-4 border-red-500 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <XCircle className="h-6 w-6 text-red-500 mr-3" />
              <div>
                <strong className="font-bold text-red-700">Erro!</strong>
                <span className="block text-red-600 mt-1">{error}</span>
              </div>
            </div>
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/proprietario/alugueis')}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Aluguéis
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!reserva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 py-8">
        <div className="container mx-auto px-4">
          <div className="bg-white border-l-4 border-yellow-500 rounded-xl shadow-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
              <div>
                <strong className="font-bold text-yellow-700">Atenção!</strong>
                <span className="block text-yellow-600 mt-1">Reserva não encontrada.</span>
              </div>
            </div>
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => router.push('/proprietario/alugueis')}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Aluguéis
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/proprietario/alugueis">
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 shadow-sm"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
                Detalhes da Reserva
              </h1>
              <p className="text-emerald-600 mt-1">Gerencie todas as informações da reserva</p>
            </div>
          </div>
          <div className="hidden md:block">
            <StatusBadge status={reserva.status || "PENDENTE"} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main Info Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-t-xl">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center text-white">
                    <CalendarCheck className="mr-3 h-6 w-6" />
                    Reserva #{reserva.id}
                  </CardTitle>
                  <div className="md:hidden">
                    <StatusBadge status={reserva.status || "PENDENTE"} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Property and Guest Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-800 mb-4 flex items-center">
                      <Home className="mr-2 h-5 w-5" /> Imóvel
                    </h3>
                    <p className="text-xl font-bold text-blue-900 mb-2">
                      {reserva.casa?.nome || `Casa #${reserva.casaId}`}
                    </p>
                    {reserva.casa && (
                      <p className="text-blue-700 text-sm">
                        {reserva.casa.endereco}, {reserva.casa.cidade}/{reserva.casa.estado}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-6 rounded-xl border border-teal-200">
                    <h3 className="font-semibold text-teal-800 mb-4 flex items-center">
                      <Users className="mr-2 h-5 w-5" /> Hóspedes
                    </h3>
                    <p className="text-xl font-bold text-teal-900 mb-2">
                      {reserva.hospedePrincipal?.nome || `Hóspede #${reserva.hospedePrincipalId}`}
                    </p>
                    <p className="text-teal-700 text-sm">
                      Total: {reserva.numPessoas} pessoa(s)
                    </p>
                  </div>
                </div>

                {/* Stay Period */}
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200">
                  <h3 className="font-semibold text-emerald-800 mb-4 flex items-center">
                    <CalendarCheck className="mr-2 h-5 w-5" /> Período da Estadia
                  </h3>
                  <div className="flex items-center space-x-6">
                    <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Check-in</p>
                      <p className="text-lg font-bold text-emerald-900 mt-1">
                        {formatDate(reserva.dataCheckin)}
                      </p>
                    </div>
                    <div className="text-emerald-500 text-2xl">→</div>
                    <div className="flex-1 bg-white p-4 rounded-lg shadow-sm border border-emerald-200">
                      <p className="text-xs text-emerald-600 font-medium uppercase tracking-wide">Check-out</p>
                      <p className="text-lg font-bold text-emerald-900 mt-1">
                        {formatDate(reserva.dataCheckout)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Values */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-4">💰 Valores</h3>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-green-700 font-medium">Valor Total</span>
                      <span className="text-2xl font-bold text-green-900">
                        R$ {(reserva.valorTotal || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Observations */}
                {reserva.observacoes && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                    <h3 className="font-semibold text-amber-800 mb-4 flex items-center">
                      📝 Observações
                    </h3>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-amber-200">
                      <p className="text-amber-900 whitespace-pre-wrap leading-relaxed">
                        {reserva.observacoes}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    {getActionButtons()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Important Dates */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-t-xl">
                <CardTitle className="text-lg flex items-center">
                  📅 Datas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                  <p className="text-sm text-cyan-600 font-medium">Data de Criação</p>
                  <p className="font-bold text-cyan-900 mt-1">
                    {reserva.createdAt ? formatDate(reserva.createdAt) : 'N/A'}
                  </p>
                </div>
                <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
                  <p className="text-sm text-teal-600 font-medium">Última Atualização</p>
                  <p className="font-bold text-teal-900 mt-1">
                    {reserva.updatedAt ? formatDate(reserva.updatedAt) : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Status Summary */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-xl">
                <CardTitle className="text-lg flex items-center">
                  📊 Status da Reserva
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">
                  <StatusBadge status={reserva.status || "PENDENTE"} />
                  <p className="text-sm text-gray-600 mt-3">
                    {reserva.status === "PENDENTE" && "Aguardando confirmação"}
                    {reserva.status === "CONFIRMADA" && "Reserva confirmada, aguardando check-in"}
                    {reserva.status === "CHECKIN" && "Hóspede fez check-in"}
                    {reserva.status === "CHECKOUT" && "Hóspede fez check-out"}
                    {reserva.status === "CONCLUIDA" && "Reserva finalizada com sucesso"}
                    {reserva.status === "CANCELADA" && "Reserva foi cancelada"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
