"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService, casasService, hospedesService, reservasService } from "@/lib/api";
import {
  Home,
  Key,
  Wallet,
  Building2,
  Users,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ProprietarioDashboardPage() {
  const router = useRouter();
  const user = authService.getUser();
  const [loading, setLoading] = useState(true);
  const [loadingFaturamento, setLoadingFaturamento] = useState(true);
  const [loadingCountHospedes, setLoadingCountHospedes] = useState(true);
  const [faturamentoMensal, setFaturamentoMensal] = useState<String>();
  const [numeroCasas, setNumeroCasas] = useState<number>(0);
  const [countHospedes, setCountHospedes] = useState<number>(0);


  const fetchFaturamento = async () => {
    try {
      setLoadingFaturamento(true);
      const response = await reservasService.getFaturamentoMensal(user.id);
      const faturamentoMensal = response || 0;

      const faturamentoFormatado = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(faturamentoMensal);

      setFaturamentoMensal(faturamentoFormatado);
    } catch (error) {
      toast.error('Erro ao buscar faturamento mensal');
    } finally {
      setLoadingFaturamento(false);
    }
  };

  const fetchCountHospedes = async () => {
    try {
      setLoadingCountHospedes(true);
      const response = await hospedesService.countHospede(user.proprietarioId);
      setCountHospedes(response)

    } catch (error) {
      setCountHospedes(0);
    }
  }

  const fetchNumeroCasas = async () => {
    try {
      setLoading(true);
      const response = await casasService.contarCasas();
      let quantidade = 0;
      if (typeof response === 'object' && response !== null) {
        quantidade = response.quantidade || response.count || response.total || 0;
      } else if (typeof response === 'number') {
        quantidade = response;
      } else if (typeof response === 'string') {
        quantidade = parseInt(response, 10) || 0;
      }
      setNumeroCasas(quantidade);
    } catch (error) {
      setNumeroCasas(0); // Garantir que seja sempre um número
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaturamento();
    fetchNumeroCasas();
    fetchCountHospedes();
  }, []);

  return (
    <div className="space-y-10">
      {/* Título */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800">
          Área do Proprietário
        </h1>
        <p className="text-gray-500 mt-2">
          Gerencie seus imóveis, aluguéis e hóspedes em um só lugar
        </p>
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 shadow-md hover:shadow-lg transition cursor-pointer"
          onClick={() => router.push("/proprietario/casas")}
        >
          <CardHeader className="pb-2 flex items-center gap-2">
            <Home className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-sm font-medium text-gray-700">
              Total de Imóveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="text-sm text-gray-500">Carregando...</span>
              ) : (
                numeroCasas
              )}
            </div>
            <div className="mt-3">
              <Button
                variant="link"
                className="text-emerald-600 p-0 h-auto font-semibold"
              >
                Gerenciar imóveis →
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow-md hover:shadow-lg transition">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Key className="h-5 w-5 text-green-600" />
            <CardTitle className="text-sm font-medium text-gray-700">
              Hóspedes Cadastrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="text-sm text-gray-500">Carregando...</span>
              ) : (
                countHospedes
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow-md hover:shadow-lg transition">
          <CardHeader className="pb-2 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-sm font-medium text-gray-700">
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="text-sm text-gray-500">Carregando...</span>
              ) : (
                faturamentoMensal
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boas-vindas */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
            <Building2 className="h-6 w-6 text-indigo-600" />
            Bem-vindo, {user?.nome || "Proprietário"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 leading-relaxed">
            Este é o seu painel de controle como proprietário. Aqui você pode
            gerenciar seus imóveis, aluguéis, inquilinos e acompanhar seus
            ganhos de forma simples e organizada.
          </p>
        </CardContent>
      </Card>

      {/* Ações principais */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          className="shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => router.push("/proprietario/casas")}
        >
          <CardHeader className="flex items-center gap-2">
            <Home className="h-5 w-5 text-yellow-600" />
            <CardTitle>Gerencie seus imóveis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Cadastre, edite e controle o status dos seus imóveis com
              facilidade.
            </p>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => router.push("/proprietario/alugueis")}
        >
          <CardHeader className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-green-600" />
            <CardTitle>Gerencie seus aluguéis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Visualize, cadastre novos contratos e acompanhe os aluguéis em
              andamento.
            </p>
          </CardContent>
        </Card>

        <Card
          className="shadow-sm hover:shadow-md transition cursor-pointer"
          onClick={() => router.push("/proprietario/hospedes")}
        >
          <CardHeader className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <CardTitle>Gerencie seus hóspedes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Cadastre, edite e remova hóspedes de forma rápida e organizada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
