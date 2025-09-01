"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/api';
import { Button } from './ui/button';

export default function LogoutButton() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      authService.logout();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button 
      variant="ghost" 
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="text-gray-600 hover:text-gray-900 border border-green-500 rounded-md px-4 py-2 hover:bg-green-50 transition-colors"
    >
      {isLoggingOut ? 'Saindo...' : 'Sair'}
    </Button>
  );
}
