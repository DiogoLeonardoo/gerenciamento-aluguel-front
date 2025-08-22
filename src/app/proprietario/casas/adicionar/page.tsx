"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Casa, CasaFormData } from "@/lib/types";
import { casasService, authService } from "@/lib/api";
import { maskCEP, removeMask } from "@/lib/validation";
import { X } from "lucide-react";

export default function AdicionarCasaPage() {
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
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [fotosPreview, setFotosPreview] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  
  const router = useRouter();
  
  // Check if user is authenticated and has the proprietário role
  useEffect(() => {
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
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "cep") {
      setFormData(prev => ({
        ...prev,
        [name]: maskCEP(value),
      }));
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

  const handleFotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    // Validate file types and size
    const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    
    const newFotos = Array.from(e.target.files).filter(file => {
      // Check file type
      if (!validImageTypes.includes(file.type)) {
        alert(`Formato inválido: ${file.name}. Apenas PNG, JPG ou JPEG são permitidos.`);
        return false;
      }
      
      // Check file size
      if (file.size > maxSizeInBytes) {
        alert(`Arquivo muito grande: ${file.name}. O tamanho máximo é 5MB.`);
        return false;
      }
      
      return true;
    });
    
    if (newFotos.length === 0) return;
    
    // Check if adding these new photos would exceed the 10 photo limit
    if (fotos.length + newFotos.length > 10) {
      const remainingSlots = 10 - fotos.length;
      alert(`Você só pode adicionar mais ${remainingSlots} foto${remainingSlots !== 1 ? 's' : ''} (máximo de 10 no total).`);
      
      // Only take the number of photos that would fit within the 10 photo limit
      const limitedNewFotos = newFotos.slice(0, remainingSlots);
      const limitedPreviewUrls = limitedNewFotos.map(file => URL.createObjectURL(file));
      
      setFotos(prev => [...prev, ...limitedNewFotos]);
      setFotosPreview(prev => [...prev, ...limitedPreviewUrls]);
      return;
    }
    
    const newPreviewUrls = newFotos.map(file => URL.createObjectURL(file));
    
    setFotos(prev => [...prev, ...newFotos]);
    setFotosPreview(prev => [...prev, ...newPreviewUrls]);
    
    // Clear any previous errors related to photos
    if (errors.fotos) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors.fotos;
        return newErrors;
      });
      setError(null);
    }
  };

  const removeFoto = (index: number) => {
    const newFotos = [...fotos];
    const newPreviews = [...fotosPreview];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);
    
    newFotos.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFotos(newFotos);
    setFotosPreview(newPreviews);
  };

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
    
    // Check if at least one photo is uploaded
    if (fotos.length === 0) {
      newErrors.fotos = "É necessário adicionar pelo menos uma foto do imóvel";
      // Display the error near the photos section
      setError("É necessário adicionar pelo menos uma foto do imóvel");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authorization again before submitting
    if (!authorized) {
      setError('Você não tem permissão para realizar esta ação. Somente proprietários podem cadastrar imóveis.');
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
      
      // Add photos if there are any
      fotos.forEach(foto => {
        formDataObj.append("fotos", foto);
      });
      
      await casasService.criarCasa(formDataObj);
      
      // Navigate back to casa listing after success
      router.push("/proprietario/casas");
      
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Erro ao cadastrar imóvel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Adicionar Novo Imóvel</h1>
        <Button
          variant="outline"
          onClick={() => router.push("/proprietario/casas")}
        >
          Voltar
        </Button>
      </div>
      
      {!authorized && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-center">
          {error}
        </div>
      )}
      
      {authorized && (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Imóvel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {authorized && error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
                  {error}
                </div>
              )}
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="nome" className="block text-sm font-medium mb-1">
                    Nome do imóvel *
                  </label>
                  <Input
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    placeholder="Ex: Casa na Praia, Apartamento no Centro"
                  />
                  {errors.nome && <p className="text-sm text-red-500 mt-1">{errors.nome}</p>}
                </div>
                
                <div>
                  <label htmlFor="cep" className="block text-sm font-medium mb-1">
                    CEP *
                  </label>
                  <Input
                    id="cep"
                    name="cep"
                    value={formData.cep}
                    onChange={handleChange}
                    placeholder="00000-000"
                    maxLength={9}
                  />
                  {errors.cep && <p className="text-sm text-red-500 mt-1">{errors.cep}</p>}
                </div>
              </div>
              
              <div>
                <label htmlFor="endereco" className="block text-sm font-medium mb-1">
                  Endereço *
                </label>
                <Input
                  id="endereco"
                  name="endereco"
                  value={formData.endereco}
                  onChange={handleChange}
                  placeholder="Rua, número, complemento"
                />
                {errors.endereco && <p className="text-sm text-red-500 mt-1">{errors.endereco}</p>}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="cidade" className="block text-sm font-medium mb-1">
                    Cidade *
                  </label>
                  <Input
                    id="cidade"
                    name="cidade"
                    value={formData.cidade}
                    onChange={handleChange}
                  />
                  {errors.cidade && <p className="text-sm text-red-500 mt-1">{errors.cidade}</p>}
                </div>
                
                <div>
                  <label htmlFor="estado" className="block text-sm font-medium mb-1">
                    Estado (UF) *
                  </label>
                  <Input
                    id="estado"
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    placeholder="SP"
                    maxLength={2}
                    className="uppercase"
                  />
                  {errors.estado && <p className="text-sm text-red-500 mt-1">{errors.estado}</p>}
                </div>
              </div>
              
              <div>
                <label htmlFor="descricao" className="block text-sm font-medium mb-1">
                  Descrição *
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Descreva seu imóvel, mencione pontos fortes, comodidades, etc."
                />
                {errors.descricao && <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>}
              </div>
              
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <label htmlFor="quartos" className="block text-sm font-medium mb-1">
                    Quartos *
                  </label>
                  <Input
                    id="quartos"
                    name="quartos"
                    type="number"
                    min={1}
                    value={formData.quartos}
                    onChange={handleChange}
                  />
                  {errors.quartos && <p className="text-sm text-red-500 mt-1">{errors.quartos}</p>}
                </div>
                
                <div>
                  <label htmlFor="banheiros" className="block text-sm font-medium mb-1">
                    Banheiros *
                  </label>
                  <Input
                    id="banheiros"
                    name="banheiros"
                    type="number"
                    min={1}
                    value={formData.banheiros}
                    onChange={handleChange}
                  />
                  {errors.banheiros && <p className="text-sm text-red-500 mt-1">{errors.banheiros}</p>}
                </div>
                
                <div>
                  <label htmlFor="maxPessoas" className="block text-sm font-medium mb-1">
                    Capacidade *
                  </label>
                  <Input
                    id="maxPessoas"
                    name="maxPessoas"
                    type="number"
                    min={1}
                    value={formData.maxPessoas}
                    onChange={handleChange}
                  />
                  {errors.maxPessoas && <p className="text-sm text-red-500 mt-1">{errors.maxPessoas}</p>}
                </div>
                
                <div>
                  <label htmlFor="valorDiaria" className="block text-sm font-medium mb-1">
                    Valor Diária (R$) *
                  </label>
                  <Input
                    id="valorDiaria"
                    name="valorDiaria"
                    type="number"
                    min={0}
                    step={0.01}
                    value={formData.valorDiaria}
                    onChange={handleChange}
                  />
                  {errors.valorDiaria && <p className="text-sm text-red-500 mt-1">{errors.valorDiaria}</p>}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Fotos do Imóvel {`(${fotosPreview.length}/10)`}
                  {fotosPreview.length > 0 && fotosPreview.length < 10 && (
                    <span className="text-xs text-gray-500 ml-2">
                      {10 - fotosPreview.length} {10 - fotosPreview.length === 1 ? 'foto restante' : 'fotos restantes'}
                    </span>
                  )}
                </label>
                
                {fotosPreview.length < 10 && (
                  <div className="flex items-center justify-center w-full">
                    <label
                      htmlFor="fotos"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg
                          className="w-8 h-8 mb-4 text-gray-500"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 20 16"
                        >
                          <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                          />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG ou JPEG (Máx. 5MB por foto)</p>
                        <p className="text-xs text-gray-500 mt-1">Máximo de 10 fotos no total</p>
                      </div>
                      <Input
                        id="fotos"
                        name="fotos"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFotosChange}
                        className="hidden"
                        disabled={fotosPreview.length >= 10 || isLoading}
                      />
                    </label>
                  </div>
                )}
                
                {fotosPreview.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Fotos selecionadas:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {fotosPreview.map((url, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square w-full overflow-hidden rounded-lg">
                            <img
                              src={url}
                              alt={`Preview ${index}`}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFoto(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
                            title="Remover foto"
                            disabled={isLoading}
                          >
                            <X size={16} />
                          </button>
                          <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1 rounded">
                            {index + 1}/{fotosPreview.length}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {fotosPreview.length >= 10 && (
                      <p className="text-xs text-amber-600 mt-2">
                        Você atingiu o limite máximo de 10 fotos.
                      </p>
                    )}
                  </div>
                )}
                
                {errors.fotos && <p className="text-sm text-red-500 mt-1">{errors.fotos}</p>}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? "Cadastrando..." : "Cadastrar Imóvel"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
