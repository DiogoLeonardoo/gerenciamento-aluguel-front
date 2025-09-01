"use client";

import Link from "next/link";
import { useState } from "react";
import AuthCheck from "@/components/auth-check";
import RoleGuard from "@/components/role-guard";
import LogoutButton from "@/components/logout-button";
import { Menu, X, Home, Building, Calendar, Users, DollarSign } from "lucide-react";

export default function ProprietarioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const menuItems = [
    { href: "/proprietario/dashboard", label: "Home", icon: Home },
    { href: "/proprietario/casas", label: "Meus Imóveis", icon: Building },
    { href: "/proprietario/calendario", label: "Calendário", icon: Calendar },
    { href: "/proprietario/alugueis", label: "Aluguéis", icon: Calendar },
    { href: "/proprietario/hospedes", label: "Hóspedes", icon: Users },
    { href: "/proprietario/financeiro", label: "Financeiro", icon: DollarSign },
  ];
  return (
    <AuthCheck>
      <RoleGuard allowedRoles={['PROPRIETARIO']}>
        <div className="min-h-screen flex flex-col md:flex-row">
          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={closeMobileMenu}
            />
          )}

          {/* Proprietário Sidebar - Desktop */}
          <div className="w-64 bg-emerald-600 text-white p-4 hidden md:block">
            <div className="text-xl font-bold mb-6 flex items-center">
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
              <Link href="/proprietario/dashboard">
                <span className="white">
                  InHouse
                </span>
              </Link>
            </div>
            <nav>
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center py-2 px-4 rounded hover:bg-emerald-700 transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Mobile Sidebar */}
          <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-emerald-600 text-white transform transition-transform duration-300 ease-in-out md:hidden ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}>
            <div className="flex items-center justify-between p-4 border-b border-emerald-500">
              <div className="text-xl font-bold flex items-center">
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
                InHouse
              </div>
              <button
                onClick={closeMobileMenu}
                className="p-2 rounded-md hover:bg-emerald-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4">
              <ul className="space-y-2">
                {menuItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={closeMobileMenu}
                      className="flex items-center py-3 px-4 rounded hover:bg-emerald-700 transition-colors"
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow h-16 flex items-center justify-between px-4 border-b border-gray-200">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
              <div className="flex-1 md:flex-none"></div>
              <div className="flex items-center">
                <div>
                  <LogoutButton />
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="flex-1 p-4 md:p-6 bg-neutral-50 overflow-x-auto">
              <div className="max-w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </RoleGuard>
    </AuthCheck>
  );
}
