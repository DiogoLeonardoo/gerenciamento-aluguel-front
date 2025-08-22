"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/lib/api";
import { 
  validateCPF, 
  validateCEP, 
  validatePhone,
  maskCPF,
  maskCEP,
  maskPhone,
  removeMask,
  validationMessages
} from "@/lib/validation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    password: "",
    confirmPassword: "",
    isProprietario: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [proprietarioData, setProprietarioData] = useState({
    cpf: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "telefone") {
      setFormData((prev) => ({
        ...prev,
        [name]: maskPhone(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleProprietarioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Apply masks for specific fields
    if (name === "cpf") {
      setProprietarioData((prev) => ({
        ...prev,
        [name]: maskCPF(value),
      }));
    } else if (name === "cep") {
      setProprietarioData((prev) => ({
        ...prev,
        [name]: maskCEP(value),
      }));
    } else {
      setProprietarioData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Basic validation for all users
    if (!formData.nome) newErrors.nome = "Nome é obrigatório";
    
    if (!formData.email) newErrors.email = "E-mail é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) 
      newErrors.email = "E-mail inválido";
    
    if (!formData.password) newErrors.password = "Senha é obrigatória";
    else if (formData.password.length < 8) 
      newErrors.password = "A senha deve ter no mínimo 8 caracteres";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password))
      newErrors.password = "A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais";
    
    if (!formData.confirmPassword) 
      newErrors.confirmPassword = "Confirme sua senha";
    else if (formData.password !== formData.confirmPassword) 
      newErrors.confirmPassword = "As senhas não coincidem";

    // Validate phone number if provided
    if (formData.telefone && !validatePhone(formData.telefone)) {
      newErrors.telefone = validationMessages.phone.invalid;
    }
    
    // Additional validation for proprietarios
    if (step === 2 && formData.isProprietario) {
      // CPF is required for proprietarios
      if (!proprietarioData.cpf) {
        newErrors.cpf = validationMessages.cpf.required;
      } else if (!validateCPF(proprietarioData.cpf)) {
        newErrors.cpf = validationMessages.cpf.invalid;
      }
      
      // Address fields validation
      if (proprietarioData.cep && !validateCEP(proprietarioData.cep)) {
        newErrors.cep = validationMessages.cep.invalid;
      }
      
      // State should be 2 characters
      if (proprietarioData.estado && proprietarioData.estado.length !== 2) {
        newErrors.estado = validationMessages.estado.minLength;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (formData.isProprietario && step === 1) {
      setStep(2);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare registration data based on the user type
      const userData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone ? removeMask(formData.telefone) : undefined,
        password: formData.password,
        role: formData.isProprietario ? "PROPRIETARIO" : "USER",
      };

      // Add proprietario specific fields if the user is a proprietario
      if (formData.isProprietario) {
        Object.assign(userData, {
          cpf: removeMask(proprietarioData.cpf),
          endereco: proprietarioData.endereco || undefined,
          cidade: proprietarioData.cidade || undefined,
          estado: proprietarioData.estado || undefined,
          cep: proprietarioData.cep ? removeMask(proprietarioData.cep) : undefined,
        });
      }

      await authService.register(userData);
      router.push("/auth/login?registered=true");
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao registrar usuário");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardHeader className="space-y-1 bg-white">
        <CardTitle className="text-2xl font-bold text-slate-700">Criar conta</CardTitle>
        <CardDescription className="text-slate-500">
          Preencha os campos abaixo para criar sua conta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 bg-white">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <div className="space-y-2">
                <label htmlFor="nome" className="text-sm font-medium text-slate-700">
                  Nome completo
                </label>
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Seu nome completo"
                  value={formData.nome}
                  onChange={handleChange}
                  className="border-slate-300"
                />
                {errors.nome && (
                  <p className="text-sm text-red-500">{errors.nome}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="telefone" className="text-sm font-medium">
                  Telefone (opcional)
                </label>
                <Input
                  id="telefone"
                  name="telefone"
                  placeholder="(99) 99999-9999"
                  value={formData.telefone}
                  onChange={handleChange}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-500">{errors.telefone}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">
                  Senha
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirme sua senha
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isProprietario"
                  name="isProprietario"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.isProprietario}
                  onChange={handleChange}
                />
                <label
                  htmlFor="isProprietario"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Sou proprietário de imóveis
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Informações do Proprietário</h3>

              <div className="space-y-2">
                <label htmlFor="cpf" className="text-sm font-medium">
                  CPF
                </label>
                <Input 
                  id="cpf" 
                  name="cpf"
                  placeholder="000.000.000-00" 
                  value={proprietarioData.cpf}
                  onChange={handleProprietarioChange}
                />
                {errors.cpf && (
                  <p className="text-sm text-red-500">{errors.cpf}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="endereco" className="text-sm font-medium">
                  Endereço
                </label>
                <Input 
                  id="endereco" 
                  name="endereco"
                  placeholder="Rua, número" 
                  value={proprietarioData.endereco}
                  onChange={handleProprietarioChange}
                />
                {errors.endereco && (
                  <p className="text-sm text-red-500">{errors.endereco}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cidade" className="text-sm font-medium">
                    Cidade
                  </label>
                  <Input 
                    id="cidade" 
                    name="cidade"
                    value={proprietarioData.cidade}
                    onChange={handleProprietarioChange}
                  />
                  {errors.cidade && (
                    <p className="text-sm text-red-500">{errors.cidade}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="estado" className="text-sm font-medium">
                    Estado
                  </label>
                  <Input 
                    id="estado" 
                    name="estado"
                    maxLength={2} 
                    value={proprietarioData.estado}
                    onChange={handleProprietarioChange}
                  />
                  {errors.estado && (
                    <p className="text-sm text-red-500">{errors.estado}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="cep" className="text-sm font-medium">
                  CEP
                </label>
                <Input 
                  id="cep" 
                  name="cep"
                  placeholder="00000-000" 
                  value={proprietarioData.cep}
                  onChange={handleProprietarioChange}
                />
                {errors.cep && (
                  <p className="text-sm text-red-500">{errors.cep}</p>
                )}
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="w-full mb-2"
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-white">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-green-500"
            disabled={isLoading}
          >
            {isLoading
              ? "Registrando..."
              : step === 1 && formData.isProprietario
              ? "Próximo"
              : "Registrar"}
          </Button>
          <div className="text-center text-sm text-slate-600">
            Já tem uma conta?{" "}
            <Link
              href="/auth/login"
              className="text-emerald-500 hover:text-emerald-700 font-medium"
            >
              Faça login
            </Link>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 mr-2"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Voltar para Home
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
