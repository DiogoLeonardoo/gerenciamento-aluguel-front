"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // If user is authenticated, redirect to dashboard
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      if (token) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow border-b border-slate-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8 mr-2 text-emerald-500"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <Link href="/">
              <span className="text-xl font-bold text-slate-700 cursor-pointer">
                InHouse
              </span>
            </Link>
          </div>
          <div className="space-x-4">
            <Link
              href="/auth/login"
              className="px-4 py-2 text-emerald-500 hover:text-emerald-700 font-medium"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600"
            >
              Registrar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow flex">
        <section className="bg-gradient-to-r from-emerald-600 to-green-500 text-white flex-grow flex items-center">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h1 className="text-4xl font-bold mb-6 leading-tight">
                  Gerencie seus imóveis para aluguel de forma simples
                </h1>
                <p className="text-xl mb-8 text-emerald-50">
                  Uma plataforma completa para proprietários e administradores de imóveis
                  que facilita o gerenciamento de casas, reservas, hóspedes e contratos.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link
                    href="/auth/register"
                    className="px-6 py-3 bg-white text-emerald-600 font-medium rounded-md hover:bg-emerald-50 text-center shadow-md"
                  >
                    Começar agora
                  </Link>
                  <Link
                    href="/auth/login"
                    className="px-6 py-3 bg-emerald-700 text-white font-medium rounded-md hover:bg-emerald-800 text-center shadow-md"
                  >
                    Fazer login
                  </Link>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-lg shadow-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-64 w-full text-emerald-500"
                  >
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
