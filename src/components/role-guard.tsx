"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService } from '@/lib/api';

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const userRole = authService.getUserRole();
      
      // If not authenticated, redirect to login
      if (!authService.isAuthenticated()) {
        router.push(`/auth/login?returnUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      // If authenticated but not authorized for this route
      if (userRole && !allowedRoles.includes(userRole)) {
        // Redirect based on role
        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard');
        } else if (userRole === 'PROPRIETARIO') {
          router.push('/proprietario/dashboard');
        } else {
          router.push('/dashboard');
        }
        return;
      }

      // User is authorized
      setIsAuthorized(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [pathname, router, allowedRoles]);

  // Show loading or render children based on authorization status
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return isAuthorized ? <>{children}</> : null;
}
