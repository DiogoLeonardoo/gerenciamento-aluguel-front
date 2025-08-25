"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Casa, CasaFormData, InventarioItem } from "@/lib/types";
import { casasService, authService, inventarioService } from "@/lib/api";
import { maskCEP, removeMask } from "@/lib/validation";
import { buscarEndereco } from "@/lib/cep-busca";
import { X, ArrowLeft, Star, Trash2, Check } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { InventarioSection } from "@/components/ui/inventario-section";

export default function EditarCasaPage() {
  const [formData, setFormData] = useState<CasaFormData>({
    nome: "",
    descricao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
    quartos: 1,
    banheiros: 1,
    maxPessoas: 1,
    valorDiaria: 0,
    ativa: true
  });

  const [casa, setCasa] = useState<Casa | null>(null);
  const [fotos, setFotos] = useState<File[]>([]);
  const [existingFotos, setExistingFotos] = useState<any[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [inventario, setInventario] = useState<InventarioItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const router = useRouter();
  const params = useParams();
  const casaId = params.id as string;
  
  // Check if user is authenticated and has the proprietário role
  useEffect(() => {
    const userRole = authService.getUserRole();
    if (!authService.isAuthenticated()) {
      toast.error("Sessão expirada", "Por favor, faça login novamente.");
      router.push('/auth/login');
      return;
    }
    
    if (userRole !== 'PROPRIETARIO') {
      setError('Acesso negado. Somente proprietários podem acessar esta página.');
      toast.error("Acesso negado", "Somente proprietários podem acessar esta página.");
      setTimeout(() => {
        router.push('/');
      }, 2000);
      return;
    }
    
    setAuthorized(true);
  }, [router]);

  // Fetch casa data
  useEffect(() => {
    const fetchCasaData = async () => {
      if (!authorized || !casaId) return;
      
      setIsFetching(true);
      try {
        const data = await casasService.getCasaById(parseInt(casaId));
        setCasa(data);
        
        // Populate form data
        setFormData({
          nome: data.nome || "",
          descricao: data.descricao || "",
          endereco: data.endereco || "",
          cidade: data.cidade || "",
          estado: data.estado || "",
          cep: data.cep || "",
          quartos: data.quartos || 1,
          banheiros: data.banheiros || 1,
          maxPessoas: data.maxPessoas || 1,
          valorDiaria: data.valorDiaria || 0,
          ativa: data.ativa
        });
        
        // Fetch photos for this house
        try {
          const photoResponse = await casasService.getPhotoListByCasaId(parseInt(casaId));
          if (photoResponse && photoResponse.fotos) {
            setExistingFotos(photoResponse.fotos || []);
          }
        } catch (photoErr) {
          console.error("Erro ao carregar fotos:", photoErr);
        }
        
        // Fetch inventory items for this house
        try {
          const inventarioItems = await inventarioService.getInventarioCasa(parseInt(casaId));
          if (inventarioItems && Array.isArray(inventarioItems)) {
            setInventario(inventarioItems);
          }
        } catch (invError) {
          console.error("Erro ao carregar inventário:", invError);
          // Don't set error state, just log it - inventory is optional
        }
        
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Erro ao carregar dados do imóvel");
        toast.error("Erro", "Não foi possível carregar os dados do imóvel.");
      } finally {
        setIsFetching(false);
      }
    };
    
    fetchCasaData();
  }, [authorized, casaId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "cep") {
      const formattedCep = maskCEP(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedCep,
      }));
      
      // If CEP is complete (8 digits + formatting), search for address
      if (formattedCep.length === 9) {
        handleCepSearch(formattedCep);
      }
    } else if (["quartos", "banheiros", "maxPessoas"].includes(name)) {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else if (name === "valorDiaria") {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };
  
  const handleCepSearch = async (cep: string) => {
    if (cep.length !== 9) return;
    
    try {
      setIsLoading(true);
      const endereco = await buscarEndereco(cep);
      
      if (endereco) {
        setFormData(prev => ({
          ...prev,
          endereco: endereco.logradouro,
          cidade: endereco.localidade,
          estado: endereco.uf,
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFotosChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !casaId) return;
    
    const newFotos = Array.from(e.target.files);
    
    // Check if adding these new photos would exceed the 10 photo limit
    const totalFotos = existingFotos.length + newFotos.length;
    if (totalFotos > 10) {
      const remainingSlots = 10 - existingFotos.length;
      toast.warning(
        "Limite de fotos",
        `Você só pode adicionar mais ${remainingSlots} foto${remainingSlots !== 1 ? 's' : ''} (máximo de 10 no total).`
      );
      
      if (remainingSlots <= 0) return;
      
      // Only take the number of photos that would fit within the 10 photo limit
      newFotos.splice(remainingSlots);
    }
    
    try {
      setIsPhotoLoading(true);
      
      // Upload the photos immediately using the API
      // Note: We don't need to create a FormData object here anymore since we're using the API service
      // which now handles setting the correct field name ("files")
      
      // Use the uploadFotosCasa function from the API service
      await casasService.uploadFotosCasa(parseInt(casaId), newFotos);
      
      // Refresh the photo list after uploading
      const photoResponse = await casasService.getPhotoListByCasaId(parseInt(casaId));
      if (photoResponse && photoResponse.fotos) {
        setExistingFotos(photoResponse.fotos || []);
      }
      
      // Clear the file input
      e.target.value = '';
      
      // Show success message
      toast.success(
        "Sucesso", 
        `${newFotos.length > 1 ? 'Fotos adicionadas' : 'Foto adicionada'} com sucesso!`
      );
      
    } catch (err: any) {
      console.error("Erro ao fazer upload das fotos:", err);
      // Add more detailed error information
      const errorDetails = err.response?.data || err.message || "Erro desconhecido";
      console.error("Error details:", errorDetails);
      
      // Create a more informative error message
      let errorMessage = "Não foi possível fazer upload das fotos. ";
      
      if (err.response?.status) {
        errorMessage += `Status: ${err.response.status}. `;
      }
      
      if (typeof errorDetails === 'object') {
        errorMessage += JSON.stringify(errorDetails);
      } else {
        errorMessage += errorDetails;
      }
      
      toast.error("Erro", errorMessage);
    } finally {
      setIsPhotoLoading(false);
      setFotos([]);
      setFotosPreview([]);
    }
  };

  // No longer need removeFoto since we're handling photos differently

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nome) newErrors.nome = "Nome do imóvel é obrigatório";
    if (!formData.descricao) newErrors.descricao = "Descrição é obrigatória";
    if (!formData.endereco) newErrors.endereco = "Endereço é obrigatório";
    if (!formData.cidade) newErrors.cidade = "Cidade é obrigatória";
    if (!formData.estado) newErrors.estado = "Estado é obrigatório";
    if (formData.estado && formData.estado.length !== 2) {
      newErrors.estado = "Estado deve ser a sigla com 2 caracteres";
    }
    if (!formData.cep) newErrors.cep = "CEP é obrigatório";
    if (formData.quartos <= 0) newErrors.quartos = "Número de quartos deve ser maior que zero";
    if (formData.banheiros <= 0) newErrors.banheiros = "Número de banheiros deve ser maior que zero";
    if (formData.maxPessoas <= 0) newErrors.maxPessoas = "Capacidade deve ser maior que zero";
    if (formData.valorDiaria <= 0) newErrors.valorDiaria = "Valor da diária deve ser maior que zero";
    
    // Check if there's at least one photo
    if (existingFotos.length === 0) {
      newErrors.fotos = "É necessário ter pelo menos uma foto do imóvel";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authorization again before submitting
    if (!authorized) {
      toast.error("Acesso negado", "Você não tem permissão para realizar esta ação.");
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Create a FormData object to send files
      const formDataObj = new FormData();
      
      // Add text fields
      formDataObj.append("nome", formData.nome);
      formDataObj.append("descricao", formData.descricao);
      formDataObj.append("endereco", formData.endereco);
      formDataObj.append("cidade", formData.cidade);
      formDataObj.append("estado", formData.estado);
      formDataObj.append("cep", removeMask(formData.cep));
      formDataObj.append("quartos", formData.quartos.toString());
      formDataObj.append("banheiros", formData.banheiros.toString());
      formDataObj.append("maxPessoas", formData.maxPessoas.toString());
      formDataObj.append("valorDiaria", formData.valorDiaria.toString());
      
      // Use the casasService to update the house with PATCH
      await casasService.atualizarCasaPatch(parseInt(casaId), formDataObj);
      
      // Update inventory items if any exist
      if (inventario.length > 0) {
        try {
          // First get existing inventory
          const existingInventory = await inventarioService.getInventarioCasa(parseInt(casaId));
          
          // If there are existing items, we need to decide which to update vs add
          if (existingInventory && Array.isArray(existingInventory) && existingInventory.length > 0) {
            const existingIds = existingInventory.map(item => item.id);
            
            // Items to update (have ids)
            const itemsToUpdate = inventario.filter(item => item.id && existingIds.includes(item.id));
            
            // Items to add (no ids)
            const itemsToAdd = inventario.filter(item => !item.id);
            
            // Update existing items
            for (const item of itemsToUpdate) {
              await inventarioService.atualizarItemInventario(item.id!, {
                item: item.item,
                descricao: item.descricao || "",
                quantidade: item.quantidade,
                condicao: item.condicao,
                valorEstimado: item.valorEstimado,
                observacoes: item.observacoes || "",
              });
            }
            
            // Add new items
            if (itemsToAdd.length > 0) {
              await inventarioService.adicionarMultiplosItensInventario(
                parseInt(casaId),
                itemsToAdd.map(item => ({
                  item: item.item,
                  descricao: item.descricao || "",
                  quantidade: item.quantidade,
                  condicao: item.condicao,
                  valorEstimado: item.valorEstimado,
                  observacoes: item.observacoes || "",
                }))
              );
            }
          } else {
            // No existing inventory, just add all items
            await inventarioService.adicionarMultiplosItensInventario(
              parseInt(casaId),
              inventario.map(item => ({
                item: item.item,
                descricao: item.descricao || "",
                quantidade: item.quantidade,
                condicao: item.condicao,
                valorEstimado: item.valorEstimado,
                observacoes: item.observacoes || "",
              }))
            );
          }
        } catch (inventarioErr) {
          console.error("Erro ao atualizar inventário:", inventarioErr);
          // Continue even if inventory update fails
        }
      }
      
      toast.success("Sucesso", "Imóvel atualizado com sucesso!");
      
      // Navigate back to casa listing after success
      router.push("/proprietario/casas");
      
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Erro ao atualizar imóvel";
      setError(errorMsg);
      toast.error("Erro", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    router.push("/proprietario/casas");
  };

  // Function to set a photo as primary
  const setAsPrimary = async (fotoId: number) => {
    if (!casaId) return;
    
    try {
      setIsPhotoLoading(true);
      
      // Try using the API service first
      try {
        await casasService.setFotoPrincipal(fotoId);
      } catch (serviceError) {
        console.error("Error using API service, trying direct fetch:", serviceError);
        
        // Fallback to direct fetch as a workaround
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
        const token = localStorage.getItem("token");
        
        // Try with proxy
        const proxyUrl = `/api/proxy?path=api/fotos/${fotoId}/principal`;
        const response = await fetch(proxyUrl, {
          method: 'PUT',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          }
        });
        
        if (!response.ok) {
          console.error("Direct fetch failed with status:", response.status);
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to set principal photo: ${response.status}`);
        }
      }
      
      // Refresh the photo list after setting a new primary photo
      const photoResponse = await casasService.getPhotoListByCasaId(parseInt(casaId));
      if (photoResponse && photoResponse.fotos) {
        setExistingFotos(photoResponse.fotos || []);
      }
      
      toast.success("Sucesso", "Foto definida como principal.");
    } catch (err: any) {
      console.error("Erro ao definir foto principal:", err);
      toast.error("Erro", "Não foi possível definir a foto como principal.");
    } finally {
      setIsPhotoLoading(false);
    }
  };

  // Function to prepare to delete a photo
  const prepareDeletePhoto = (foto: any) => {
    setPhotoToDelete(foto);
    setConfirmDialogOpen(true);
  };

  // Function to confirm and delete a photo
  const confirmDeletePhoto = async () => {
    if (!photoToDelete || !casaId) return;
    
    try {
      setIsPhotoLoading(true);
      setConfirmDialogOpen(false);
      
      await casasService.deleteFoto(photoToDelete.id);
      
      // Remove the deleted photo from the list
      setExistingFotos(prev => prev.filter(f => f.id !== photoToDelete.id));
      
      toast.success("Sucesso", "Foto removida com sucesso.");
    } catch (err: any) {
      console.error("Erro ao excluir foto:", err);
      toast.error("Erro", "Não foi possível excluir a foto.");
    } finally {
      setIsPhotoLoading(false);
      setPhotoToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confirmation Dialog for Photo Deletion */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            {photoToDelete && (
              <div className="max-h-40 overflow-hidden rounded">
                <img 
                  src={photoToDelete.dataUrl || '/no-image.svg'} 
                  alt="Foto para excluir" 
                  className="object-contain h-full w-full"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeletePhoto}
              disabled={isPhotoLoading}
            >
              {isPhotoLoading ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={goBack} size="sm">
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Editar Imóvel</h1>
            {casa && <p className="text-gray-600">{casa.nome}</p>}
          </div>
        </div>
      </div>

      {isFetching ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-emerald-500 border-r-transparent align-middle mb-2"></div>
          <p>Carregando dados do imóvel...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                    Nome do Imóvel *
                  </label>
                  <Input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className={errors.nome ? "border-red-500" : ""}
                  />
                  {errors.nome && <p className="text-red-500 text-xs">{errors.nome}</p>}
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="valorDiaria" className="block text-sm font-medium text-gray-700">
                    Valor da Diária (R$) *
                  </label>
                  <Input
                    type="number"
                    id="valorDiaria"
                    name="valorDiaria"
                    min="0"
                    step="0.01"
                    value={formData.valorDiaria}
                    onChange={handleChange}
                    className={errors.valorDiaria ? "border-red-500" : ""}
                  />
                  {errors.valorDiaria && <p className="text-red-500 text-xs">{errors.valorDiaria}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">
                    Descrição *
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    rows={3}
                    value={formData.descricao}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${errors.descricao ? "border-red-500" : ""}`}
                  ></textarea>
                  {errors.descricao && <p className="text-red-500 text-xs">{errors.descricao}</p>}
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="endereco" className="block text-sm font-medium text-gray-700">
                    Endereço *
                  </label>
                  <Input
                    type="text"
                    id="endereco"
                    name="endereco"
                    value={formData.endereco}
                    onChange={handleChange}
                    className={errors.endereco ? "border-red-500" : ""}
                  />
                  {errors.endereco && <p className="text-red-500 text-xs">{errors.endereco}</p>}
                </div>
                

                
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="cep" className="block text-sm font-medium text-gray-700">
                    CEP * (Digite o CEP para preencher endereço automaticamente)
                  </label>
                  <Input
                    type="text"
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    className={errors.cep ? "border-red-500" : ""}
                    placeholder="00000-000"
                  />
                  {errors.cep && <p className="text-red-500 text-xs">{errors.cep}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="cidade" className="block text-sm font-medium text-gray-700">
                      Cidade *
                    </label>
                    <Input
                      type="text"
                      id="cidade"
                      name="cidade"
                      value={formData.cidade}
                      onChange={handleChange}
                      className={errors.cidade ? "border-red-500" : ""}
                    />
                    {errors.cidade && <p className="text-red-500 text-xs">{errors.cidade}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                      Estado (UF) *
                    </label>
                    <Input
                      type="text"
                      id="estado"
                      name="estado"
                      maxLength={2}
                      value={formData.estado}
                      onChange={handleChange}
                      className={`uppercase ${errors.estado ? "border-red-500" : ""}`}
                      disabled
                    />
                    {errors.estado && <p className="text-red-500 text-xs">{errors.estado}</p>}
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="quartos" className="block text-sm font-medium text-gray-700">
                      Quartos *
                    </label>
                    <Input
                      type="number"
                      id="quartos"
                      name="quartos"
                      min="1"
                      value={formData.quartos}
                      onChange={handleChange}
                      className={errors.quartos ? "border-red-500" : ""}
                    />
                    {errors.quartos && <p className="text-red-500 text-xs">{errors.quartos}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="banheiros" className="block text-sm font-medium text-gray-700">
                      Banheiros *
                    </label>
                    <Input
                      type="number"
                      id="banheiros"
                      name="banheiros"
                      min="1"
                      value={formData.banheiros}
                      onChange={handleChange}
                      className={errors.banheiros ? "border-red-500" : ""}
                    />
                    {errors.banheiros && <p className="text-red-500 text-xs">{errors.banheiros}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="maxPessoas" className="block text-sm font-medium text-gray-700">
                      Capacidade *
                    </label>
                    <Input
                      type="number"
                      id="maxPessoas"
                      name="maxPessoas"
                      min="1"
                      value={formData.maxPessoas}
                      onChange={handleChange}
                      className={errors.maxPessoas ? "border-red-500" : ""}
                    />
                    {errors.maxPessoas && <p className="text-red-500 text-xs">{errors.maxPessoas}</p>}
                  </div>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Gerenciar Fotos</h3>
                  <div className="text-sm text-gray-500 mb-3">
                    Adicione, exclua ou defina a foto principal do imóvel. É necessário ter pelo menos uma foto.
                    {existingFotos.length === 0 && <span className="text-red-500 font-medium"> Adicione pelo menos uma foto.</span>}
                  </div>
                  
                  {/* Existing photos display */}
                  {existingFotos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Fotos existentes: ({existingFotos.length})</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {existingFotos.map((foto, index) => (
                          <div key={foto.id} className="relative h-36 bg-gray-100 rounded-md overflow-hidden group">
                            <img 
                              src={foto.dataUrl || '/no-image.svg'} 
                              alt={`Foto ${index + 1}`}
                              className="h-full w-full object-cover" 
                            />
                            
                            {/* Primary photo indicator */}
                            {foto.principal && (
                              <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-1 py-0.5 flex items-center">
                                <Star size={12} className="mr-1" />
                                Principal
                              </div>
                            )}
                            
                            {/* Photo management buttons */}
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              {!foto.principal && (
                                <Button
                                  onClick={() => setAsPrimary(foto.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-white hover:bg-green-700 hover:text-white p-1.5"
                                  title="Definir como Principal"
                                  disabled={isPhotoLoading}
                                >
                                  <Star size={18} />
                                </Button>
                              )}
                              <Button
                                onClick={() => prepareDeletePhoto(foto)}
                                variant="ghost"
                                size="sm"
                                className="text-white hover:bg-red-700 hover:text-white p-1.5"
                                title="Excluir Foto"
                                disabled={isPhotoLoading || (existingFotos.length === 1 && foto.principal)}
                              >
                                <Trash2 size={18} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Passe o mouse sobre as fotos para gerenciá-las. A foto principal não pode ser excluída se for a única foto.
                      </p>
                    </div>
                  )}
                  
                  <label htmlFor="fotos" className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar novas fotos {existingFotos.length === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Input
                      type="file"
                      id="fotos"
                      name="fotos"
                      onChange={handleFotosChange}
                      multiple
                      accept="image/*"
                      className={errors.fotos ? "border-red-500" : ""}
                      disabled={isPhotoLoading || existingFotos.length >= 10}
                    />
                    {isPhotoLoading && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-solid border-emerald-500 border-r-transparent"></div>
                          <span className="text-sm">Processando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {existingFotos.length < 10 ? (
                      <>
                        Você pode adicionar até {10 - existingFotos.length} {10 - existingFotos.length === 1 ? 'nova foto' : 'novas fotos'} 
                        (máximo de 10 fotos no total)
                      </>
                    ) : (
                      <span className="text-red-500">Limite máximo de 10 fotos atingido</span>
                    )}
                  </p>
                  {errors.fotos && <p className="text-red-500 text-xs">{errors.fotos}</p>}
                </div>
                
                {/* Seção de Inventário */}
                <div className="space-y-2 md:col-span-2">
                  <InventarioSection 
                    inventario={inventario} 
                    onChange={setInventario} 
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-solid border-white border-t-transparent"></div>
                      Salvando...
                    </span>
                  ) : (
                    "Salvar Alterações"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
