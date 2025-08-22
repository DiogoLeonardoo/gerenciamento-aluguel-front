import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login - Sistema de Gerenciamento de Aluguéis",
  description: "Página de login do sistema de gerenciamento de aluguéis",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-500" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 h-6 w-6"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Sistema de Gerenciamento de Aluguéis
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Nosso sistema facilita a gestão de suas propriedades, contratos e reservas de forma simples e eficiente.&rdquo;
            </p>
            <footer className="text-sm">inHouse Gerenciamento</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-8 lg:p-8 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
