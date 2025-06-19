'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/lib/auth';
import { CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/ui/loading-spinner';

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleLogout = async () => {
      try {
        setStatus('loading');

        // Usar AuthService para mantener consistencia
        const { error } = await AuthService.signOut();

        if (error) {
          console.error('Error during logout:', error);
          setErrorMessage(error.message || 'Error al cerrar sesión');
          setStatus('error');

          // Redirigir al dashboard después de un breve delay si hay error
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
          return;
        }

        setStatus('success');

        // Redirigir a la página principal después de logout exitoso
        setTimeout(() => {
          router.push('/?message=logout_success');
        }, 1500);
      } catch (error) {
        console.error('Unexpected error during logout:', error);
        setErrorMessage('Error inesperado al cerrar sesión');
        setStatus('error');

        // Redirigir al dashboard después de un breve delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      }
    };

    handleLogout();
  }, [router]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <LoadingSpinner size="lg" text="Cerrando sesión..." />
            <p className="text-gray-500 text-sm mt-4">Por favor espera un momento</p>
          </>
        );

      case 'success':
        return (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Sesión cerrada exitosamente</p>
            <p className="text-gray-500 text-sm">Redirigiendo...</p>
          </>
        );

      case 'error':
        return (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Error al cerrar sesión</p>
            <p className="text-red-600 text-sm mb-3">{errorMessage}</p>
            <p className="text-gray-500 text-sm">Redirigiendo al dashboard...</p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">{renderContent()}</div>
      </div>
    </div>
  );
}
