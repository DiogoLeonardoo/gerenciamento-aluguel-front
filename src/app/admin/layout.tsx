import { Metadata } from "next";
import Link from "next/link";
import AuthCheck from "@/components/auth-check";
import RoleGuard from "@/components/role-guard";
import LogoutButton from "@/components/logout-button";

export const metadata: Metadata = {
  title: "Admin Dashboard - Sistema de Gerenciamento de Aluguéis",
  description: "Painel administrativo do sistema de gerenciamento de aluguéis",
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthCheck>
      <RoleGuard allowedRoles={['ADMIN']}>
        <div className="min-h-screen flex">
          {/* Admin Sidebar */}
          <div className="w-64 bg-purple-700 text-white p-4 hidden md:block">
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
              InHouse Admin
            </div>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/admin/dashboard"
                    className="block py-2 px-4 rounded hover:bg-purple-800 transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/dashboard/usuarios"
                    className="block py-2 px-4 rounded hover:bg-purple-800 transition-colors"
                  >
                    Usuários
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/dashboard/proprietarios"
                    className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors"
                  >
                    Proprietários
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/dashboard/imoveis"
                    className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors"
                  >
                    Imóveis
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/dashboard/relatorios"
                    className="block py-2 px-4 rounded hover:bg-gray-800 transition-colors"
                  >
                    Relatórios
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <header className="bg-white shadow h-16 flex items-center justify-between px-4">
              <div className="md:hidden">
                <button className="text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16m-7 6h7"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex-1 md:flex-none"></div>
              <div className="flex items-center">
                <div className="relative mr-4">
                  <button className="flex items-center text-gray-700 hover:text-gray-900">
                    <span className="mr-2 text-sm hidden md:inline-block">Admin</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
                <div>
                  <LogoutButton />
                </div>
              </div>
            </header>

            {/* Content */}
            <main className="p-6">{children}</main>
          </div>
        </div>
      </RoleGuard>
    </AuthCheck>
  );
}
