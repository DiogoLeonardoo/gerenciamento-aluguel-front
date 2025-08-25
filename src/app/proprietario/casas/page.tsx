"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Casa } from "@/lib/types";
import { casasService, authService } from "@/lib/api";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { Power, PowerOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export default function CasasListPage() {
  const [casas, setCasas] = useState<Casa[]>([]); // fonte de verdade
  const [casasFiltradas, setCasasFiltradas] = useState<Casa[]>([]); // derivado de casas + filtro
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [filtro, setFiltro] = useState<"todos" | "ativos" | "inativos">("todos");
  const [casaParaAlterar, setCasaParaAlterar] = useState<Casa | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState<number | null>(null);
  const router = useRouter();

  // Função para buscar casas - extraída para fora do useEffect
  const fetchCasas = useCallback(async () => {
    setIsLoading(true);
    try {
      // Get basic casa data
      const data = await casasService.listarCasas();
      
      // Create a copy of the data to avoid mutation during async operations
      const casasComFotos = [...data];
      
      // Fetch photos for each casa
      for (let i = 0; i < casasComFotos.length; i++) {
        try {
          // Use the endpoint to get all photos for the house
          const fotoResponse = await casasService.getPhotoListByCasaId(casasComFotos[i].id!);
          
          console.log(`Loaded ${fotoResponse?.fotos?.length || 0} photos for house ${casasComFotos[i].id}`);
          
          // A resposta já inclui fotoPrincipalData, totalFotos, fotoPrincipalId e fotos
          if (fotoResponse) {
            // Atualizar a casa com as informações de fotos
            casasComFotos[i] = {
              ...casasComFotos[i],
              fotoPrincipalData: fotoResponse.fotoPrincipalData,
              fotoPrincipalId: fotoResponse.fotoPrincipalId,
              totalFotos: fotoResponse.totalFotos,
              fotos: fotoResponse.fotos || []
            };
          } else {
            casasComFotos[i].fotos = [];
          }
        } catch (photoErr) {
          console.error(`Erro ao carregar fotos para o imóvel ${casasComFotos[i].id}:`, photoErr);
          casasComFotos[i].fotos = [];
        }
      }
      
      // Ordenar casas: ativas primeiro, depois inativas
      const casasOrdenadas = [...casasComFotos].sort((a, b) => {
        // Primeiro por status (ativas primeiro)
        if (a.ativa && !b.ativa) return -1;
        if (!a.ativa && b.ativa) return 1;
        // Depois por data de criação (mais recentes primeiro)
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
      
      setCasas(casasOrdenadas);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao carregar imóveis");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efeito só para autenticação
  useEffect(() => {
    try {
      const isAuth = authService.isAuthenticated();
      const userRole = authService.getUserRole();
      if (!isAuth) {
        toast.error("Sessão expirada", "Por favor, faça login novamente.");
        router.push('/auth/login');
        return;
      }
      if (userRole !== 'PROPRIETARIO') {
        setError('Acesso negado. Somente proprietários podem acessar esta página.');
        toast.error("Acesso negado", "Somente proprietários podem acessar esta página.");
        setTimeout(() => router.push('/'), 1500);
        return;
      }
      setAuthorized(true);
    } catch (err) {
      console.error("Erro ao verificar autenticação:", err);
      toast.error("Erro de autenticação", "Ocorreu um problema ao verificar suas credenciais.");
      router.push('/auth/login');
    }
  }, [router]);

  // Efeito para carregar casas quando autorizado
  useEffect(() => {
    if (authorized) {
      fetchCasas();
    }
  }, [authorized, fetchCasas]);
  
  // Derivar lista filtrada sempre que casas ou filtro mudarem
  useEffect(() => {
    let filtradas = casas;
    if (filtro === 'ativos') filtradas = casas.filter(c => c.ativa);
    if (filtro === 'inativos') filtradas = casas.filter(c => !c.ativa);
    setCasasFiltradas(filtradas);
  }, [casas, filtro]);

  // Preparar para alternar o status, abre o modal de confirmação
  const prepararToggleStatus = (casa: Casa) => {
    setCasaParaAlterar(casa);
    setConfirmDialogOpen(true);
  };
  
  // Confirmar a alteração de status
  const confirmarToggleStatus = async () => {
    if (!casaParaAlterar) return;
    
    const action = casaParaAlterar.ativa ? 'desativar' : 'ativar';
    try {
      setConfirmDialogOpen(false);
      setIsTogglingId(casaParaAlterar.id!);
      
      // Verificar se o usuário está autenticado
      if (!authService.isAuthenticated()) {
        toast.error("Sessão expirada", "Por favor, faça login novamente.");
        router.push('/auth/login');
        return;
      }
      
      // Log para debug
      console.log(`Tentando ${action} o imóvel ID: ${casaParaAlterar.id}`);
      
      // Salvar o ID da casa antes da chamada de API
      const casaId = casaParaAlterar.id!;
      const novoStatus = !casaParaAlterar.ativa;
      
      // Chame a API para alternar o status
      await casasService.alternarStatusCasa(casaId, casaParaAlterar.ativa);
      
      // Otimismo: atualizar estado imediatamente; fetch posterior garante consistência
      setCasas(prev => {
        const atualizadas = prev.map(c => c.id === casaId ? { ...c, ativa: novoStatus } : c);
        // reordenar mantendo regra
        return [...atualizadas].sort((a, b) => {
          if (a.ativa && !b.ativa) return -1;
          if (!a.ativa && b.ativa) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
      });
      
      // Mostrar mensagem de sucesso usando toast
      toast.success(
        `Imóvel ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`
      );
      
      // Limpar a casa selecionada
      setCasaParaAlterar(null);
      setIsTogglingId(null);
      // Recarregar silenciosamente do servidor para garantir sync (não bloqueante)
      fetchCasas();
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      setIsTogglingId(null);
      
      // Verificar se é um erro de autenticação
      if (err.response?.status === 403 || err.response?.status === 401) {
        toast.error(
          "Sem permissão", 
          "Você não tem permissão para realizar essa ação ou sua sessão expirou."
        );
        
        // Se for erro de autenticação, redireciona para login
        if (err.response?.status === 401) {
          authService.logout();
          router.push('/auth/login');
        }
      } else {
        // Mostrar mensagem de erro usando toast
        toast.error(
          `Erro ao ${action} imóvel`, 
          err.response?.data?.message || `Não foi possível ${action} o imóvel. Tente novamente.`
        );
        
        // Em caso de erro, recarregar dados para garantir consistência
        if (authorized) {
          toast.info("Recarregando dados...");
          fetchCasas();
        }
      }
    }
  };
  
  const handlePhotoUpload = (casaId: number, newPhotos: any) => {
    // Update the house photos in the local state
    const updateCasaPhotos = (prevCasas: Casa[]) => 
      prevCasas.map(casa => {
        if (casa.id === casaId) {
          // Encontrar a foto principal se houver
          const fotoPrincipal = newPhotos && newPhotos.fotos ? 
            newPhotos.fotos.find((foto: any) => foto.principal) : null;
          
          console.log(`Updating house ${casaId} with ${newPhotos.fotos?.length || 0} photos`);
          
          return { 
            ...casa, 
            fotos: newPhotos.fotos || [],
            fotoPrincipalData: fotoPrincipal ? fotoPrincipal.dataUrl : (newPhotos.fotoPrincipalData || ''),
            fotoPrincipalId: fotoPrincipal ? fotoPrincipal.id : (newPhotos.fotoPrincipalId || null),
            totalFotos: newPhotos.totalFotos || (newPhotos.fotos?.length || 0)
          };
        }
        return casa;
      });
    
    // Atualizar ambos os estados
    setCasas(updateCasaPhotos); // efeito derivado cuidará de casasFiltradas
    
    // Se necessário, também podemos forçar um refresh para garantir que temos os dados mais recentes
    if (newPhotos && newPhotos.fotos && newPhotos.fotos.length > 0) {
      toast.success("Fotos atualizadas", "As fotos foram atualizadas com sucesso!");
    }
  };

  return (
    <div className="space-y-6">
      {/* Modal de confirmação */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Alteração</DialogTitle>
            <DialogDescription>
              {casaParaAlterar?.ativa 
                ? "Tem certeza que deseja desativar este imóvel? Ele não será mais visível para aluguel." 
                : "Tem certeza que deseja ativar este imóvel? Ele ficará visível para aluguel."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant={casaParaAlterar?.ativa ? "destructive" : "default"}
              className={casaParaAlterar?.ativa ? "" : "bg-green-600 hover:bg-green-700"}
              onClick={confirmarToggleStatus}
            >
              {casaParaAlterar?.ativa ? "Desativar" : "Ativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Meus Imóveis</h1>
        {authorized && (
          <Link href="/proprietario/casas/adicionar">
            <Button className="bg-green-600 hover:bg-green-700">
              <p style={{color: 'white'}}>Adicionar Imóvel</p>
            </Button>
          </Link>
        )}
      </div>
      
      {authorized && !isLoading && casas.length > 0 && (
        <div className="flex gap-2 mb-4">
          <Button 
            variant={filtro === "todos" ? "default" : "outline"} 
            onClick={() => setFiltro("todos")}
            size="sm"
          >
            Todos
          </Button>
          <Button 
            variant={filtro === "ativos" ? "default" : "outline"} 
            onClick={() => setFiltro("ativos")}
            size="sm"
            className={filtro === "ativos" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Ativos
          </Button>
          <Button 
            variant={filtro === "inativos" ? "default" : "outline"} 
            onClick={() => setFiltro("inativos")}
            size="sm"
            className={filtro === "inativos" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            Inativos
          </Button>
        </div>
      )}

      {!authorized && error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center">
          {error}
        </div>
      ) : isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-emerald-500 border-r-transparent align-middle mb-2"></div>
          <p>Carregando imóveis e fotos...</p>
        </div>
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
      ) : authorized && casasFiltradas.length === 0 && casas.length > 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500 mb-4">
              {filtro === "ativos" 
                ? "Você não possui imóveis ativos" 
                : "Você não possui imóveis inativos"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {casasFiltradas.map((casa) => (
            <Card 
              key={casa.id} 
              className={`overflow-hidden ${!casa.ativa ? 'border-red-200 bg-red-50' : ''}`}
            >
              <div className="relative">
                <PhotoCarousel 
                  photos={casa.fotos && casa.fotos.length > 0 ? casa.fotos : (
                    casa.fotoPrincipalData ? [{
                      id: casa.fotoPrincipalId || 0,
                      dataUrl: casa.fotoPrincipalData,
                      nomeArquivo: '',
                      descricao: null,
                      principal: true,
                      contentType: '',
                      tamanho: 0
                    }] : []
                  )} 
                  casaId={casa.id!} 
                  onUpload={(newPhotos) => handlePhotoUpload(casa.id!, newPhotos)} 
                />
                {!casa.ativa && (
                  <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
                    <span className="bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                      Imóvel Inativo
                    </span>
                  </div>
                )}
              </div>
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
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {casa.ativa ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-2 h-2 mr-1 bg-red-500 rounded-full"></span>
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/proprietario/casas/${casa.id}`}>
                      <Button variant="outline" size="sm">Editar</Button>
                    </Link>
                    <Button 
                      variant={casa.ativa ? "destructive" : "secondary"} 
                      size="sm"
                      onClick={() => prepararToggleStatus(casa)}
                      className="flex items-center gap-1"
                      disabled={isTogglingId === casa.id}
                    >
                      {casa.ativa ? (
                        <>
                          <PowerOff size={14} />
                          <span>{isTogglingId === casa.id ? 'Alterando...' : 'Desativar'}</span>
                        </>
                      ) : (
                        <>
                          <Power size={14} />
                          <span>{isTogglingId === casa.id ? 'Alterando...' : 'Ativar'}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
