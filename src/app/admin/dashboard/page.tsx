"use client";

import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { authService } from "@/lib/api";

export default function AdminDashboardPage() {
  useEffect(() => {
    // Fetch admin-specific data when component mounts
  }, []);

  const user = authService.getUser();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Proprietários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total de Imóveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo, {user?.nome || 'Administrador'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Este é o painel administrativo do sistema InHouse. Aqui você pode gerenciar usuários, 
            proprietários, imóveis e visualizar relatórios importantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
