"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/api";

export default function ProprietarioDashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Fetch proprietario-specific data when component mounts
  }, []);

  const user = authService.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Área do Proprietário</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Imóveis
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
          <div className="mt-2">
            <Button 
              variant="link" 
              className="text-emerald-600 p-0 h-auto"
              onClick={() => router.push("/proprietario/casas")}
            >
              Gerenciar imóveis
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">
            Imóveis Alugados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
        </CardContent>
      </Card>        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo, {user?.nome || 'Proprietário'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Este é o seu painel de controle como proprietário. Aqui você pode gerenciar seus imóveis, 
            aluguéis, inquilinos e acompanhar seus ganhos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
