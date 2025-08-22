"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Casa } from "@/lib/types";
import { casasService, authService } from "@/lib/api";
import { PhotoCarousel } from "@/components/ui/photo-carousel";

export default function CasasListPage() {
  const [casas, setCasas] = useState<Casa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and has proprietário role
    const userRole = authService.getUserRole();
    if (!authService.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    
    if (userRole !== 'PROPRIETARIO') {
      setError('Acesso negado. Somente proprietários podem acessar esta página.');
      setTimeout(() => {
        router.push('/');
      }, 2000);
      return;
    }
    
    setAuthorized(true);
    
    const fetchCasas = async () => {
      setIsLoading(true);
      try {
        // Get basic casa data
        const data = await casasService.listarCasas();
        
        // Create a copy of the data to avoid mutation during async operations
        const casasComFotos = [...data];
        
        // Fetch photos for each casa
        for (let i = 0; i < casasComFotos.length; i++) {
          try {
            // Use the new endpoint to get the photo list
            const fotos = await casasService.getPhotoListByCasaId(casasComFotos[i].id!);
            casasComFotos[i].fotos = fotos;
          } catch (photoErr) {
            console.error(`Erro ao carregar fotos para o imóvel ${casasComFotos[i].id}:`, photoErr);
            casasComFotos[i].fotos = [];
          }
        }
        
        setCasas(casasComFotos);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Erro ao carregar imóveis");
      } finally {
        setIsLoading(false);
      }
    };

    if (authorized) {
      fetchCasas();
    }
  }, [router, authorized]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este imóvel?")) {
      try {
        await casasService.excluirCasa(id);
        setCasas(casas.filter(casa => casa.id !== id));
      } catch (err: any) {
        alert(err.response?.data?.message || "Erro ao excluir imóvel");
      }
    }
  };
  
  const handlePhotoUpload = (casaId: number, newPhotos: string[]) => {
    // Update the house photos in the local state
    setCasas(prevCasas => 
      prevCasas.map(casa => 
        casa.id === casaId ? { ...casa, fotos: newPhotos } : casa
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meus Imóveis</h1>
        {authorized && (
          <Link href="/proprietario/casas/adicionar">
            <Button className="bg-green-600 hover:bg-green-700">
              Adicionar Imóvel
            </Button>
          </Link>
        )}
      </div>

      {!authorized && error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center">
          {error}
        </div>
      ) : isLoading ? (
        <div className="text-center py-10">Carregando imóveis...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : authorized && casas.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">Você ainda não possui imóveis cadastrados</p>
            <Link href="/proprietario/casas/adicionar">
              <Button>Cadastre seu primeiro imóvel</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {casas.map((casa) => (
            <Card key={casa.id} className="overflow-hidden">
              <PhotoCarousel 
                photos={casa.fotos || []} 
                casaId={casa.id!} 
                onUpload={(newPhotos) => handlePhotoUpload(casa.id!, newPhotos)} 
              />
              <CardHeader>
                <CardTitle>{casa.nome}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-2 line-clamp-2">{casa.descricao}</p>
                <p className="mb-1">{casa.cidade}, {casa.estado}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <span>{casa.quartos} quartos</span>
                  <span>{casa.banheiros} banheiros</span>
                  <span>Até {casa.maxPessoas} pessoas</span>
                </div>
                <p className="text-xl font-bold text-green-600">R$ {casa.valorDiaria.toFixed(2)}/noite</p>
                <div className="mt-4 flex justify-end gap-2">
                  <Link href={`/proprietario/casas/${casa.id}`}>
                    <Button variant="outline">Detalhes</Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDelete(casa.id!)}
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
