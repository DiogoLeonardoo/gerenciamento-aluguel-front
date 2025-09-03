"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Casa } from "@/lib/types";
import { casasService, authService } from "@/lib/api";
import { PhotoCarousel } from "@/components/ui/photo-carousel";
import { Power, PowerOff, Home, MapPin, Users, Bed, Bath, DollarSign, Plus, Filter } from "lucide-react";
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
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white border-2 border-green-500 rounded-lg shadow-sm">
            <Home className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Meus Imóveis
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {casasFiltradas.length} {casasFiltradas.length === 1 ? 'imóvel' : 'imóveis'} {filtro !== 'todos' ? `(${filtro})` : ''}
            </p>
          </div>
        </div>
        {authorized && (
          <Link href="/proprietario/casas/adicionar" className="self-start sm:self-auto">
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="font-medium">Adicionar Imóvel</span>
            </Button>
          </Link>
        )}
      </div>
      
      {authorized && !isLoading && casas.length > 0 && (
        <div className="flex gap-2 mb-6 p-4 bg-white rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mr-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtrar:</span>
          </div>
          <Button 
            variant={filtro === "todos" ? "default" : "outline"} 
            onClick={() => setFiltro("todos")}
            size="sm"
            className={`transition-all duration-200 ${filtro === "todos" ? "shadow-md" : "hover:bg-gray-50"}`}
          >
            Todos ({casas.length})
          </Button>
          <Button 
            variant={filtro === "ativos" ? "default" : "outline"} 
            onClick={() => setFiltro("ativos")}
            size="sm"
            className={`transition-all duration-200 ${filtro === "ativos" ? "bg-green-600 hover:bg-green-700 shadow-md" : "hover:bg-green-50"}`}
          >
            Ativos ({casas.filter(c => c.ativa).length})
          </Button>
          <Button 
            variant={filtro === "inativos" ? "default" : "outline"} 
            onClick={() => setFiltro("inativos")}
            size="sm"
            className={`transition-all duration-200 ${filtro === "inativos" ? "bg-red-600 hover:bg-red-700 shadow-md" : "hover:bg-red-50"}`}
          >
            Inativos ({casas.filter(c => !c.ativa).length})
          </Button>
        </div>
      )}

      {!authorized && error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center">
          {error}
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 border-4 border-green-200 rounded-full animate-spin border-t-green-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Carregando imóveis e fotos...</p>
          <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : authorized && casas.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Home className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum imóvel cadastrado</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Você ainda não possui imóveis cadastrados. Comece adicionando seu primeiro imóvel para começar a receber reservas.
            </p>
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
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {casasFiltradas.map((casa, index) => (
            <Card 
              key={casa.id} 
              className={`overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-0 shadow-md bg-white ${
                !casa.ativa 
                  ? 'border-red-200 bg-red-50/50 hover:bg-red-50' 
                  : 'hover:shadow-2xl hover:border-gray-200'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
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
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
                    {casa.nome}
                  </CardTitle>
                  <div className="flex items-center gap-1 ml-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                  {casa.descricao}
                </p>
                
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  <span>{casa.cidade}, {casa.estado}</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 py-2">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Bed className="h-4 w-4 text-blue-500" />
                    <span>{casa.quartos}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Bath className="h-4 w-4 text-cyan-500" />
                    <span>{casa.banheiros}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-green-500" />
                    <span>{casa.maxPessoas}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-xl font-bold text-green-600">
                      R$ {casa.valorDiaria.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-500">/noite</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center">
                    {casa.ativa ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <div className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></div>
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        <div className="w-2 h-2 mr-2 bg-red-500 rounded-full"></div>
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link href={`/proprietario/casas/${casa.id}`} className="flex-1 sm:flex-none">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full sm:w-auto transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                      >
                        Editar
                      </Button>
                    </Link>
                    <Button 
                      variant={casa.ativa ? "destructive" : "secondary"} 
                      size="sm"
                      onClick={() => prepararToggleStatus(casa)}
                      className={`flex-1 sm:flex-none flex items-center justify-center gap-1 transition-all duration-200 ${
                        casa.ativa 
                          ? 'hover:bg-red-600 w-full sm:w-auto' 
                          : 'bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto'
                      }`}
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
