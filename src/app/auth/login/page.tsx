"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { LoginFormData } from "@/lib/types";

const loginFormSchema = z.object({
  email: z
    .string()
    .email("Digite um e-mail válido")
    .min(1, "E-mail é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(data.email, data.password);
      
      const userRole = response?.user?.role || authService.getUserRole();
      
      console.log("Login successful", userRole);
      
      // Redirect based on user role
      if (userRole === 'ADMIN') {
        router.push("/admin/dashboard");
      } else if (userRole === 'PROPRIETARIO') {
        router.push("/proprietario/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
      <CardHeader className="space-y-1 bg-white">
        <CardTitle className="text-2xl font-bold text-slate-700">Login</CardTitle>
        <CardDescription className="text-slate-500">
          Entre com seu e-mail e senha para acessar o sistema
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4 bg-white">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              {...register("email")}
              className="border-slate-300"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-slate-700">
                Senha
              </label>
            </div>
            <Input
              id="password"
              type="password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 bg-white">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-emerald-600 to-green-500"
            disabled={isLoading}
          >
            <p style={{color:'white'}}>{isLoading ? "Entrando..." : "Entrar"}</p>
          </Button>
          <div className="text-center text-sm text-slate-600">
            Não tem uma conta?{" "}
            <Link
              href="/auth/register"
              className="text-emerald-500 hover:text-emerald-700 font-medium"
            >
              Registre-se
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
    </div>
  );
}
