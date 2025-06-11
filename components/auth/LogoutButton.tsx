'use client';

import { useAuth } from '@/components/auth/AuthProvider';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <button
      onClick={handleLogout}
      className={`text-red-600 hover:text-red-800 transition-colors ${className}`}
    >
      {children || 'Logout'}
    </button>
  );
} 