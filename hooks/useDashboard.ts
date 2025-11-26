import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { getCurrentProfessional, supabase } from '@/lib/supabase';
import { Professional } from '@/types';
import { toast } from 'sonner';
import { saveGoogleRefreshToken } from '@/services/professionalService';

export function useDashboard() {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { user, error } = await AuthService.getCurrentUser();

      if (error || !user) {
        router.push('/auth/login');
        return;
      }

      const { professional, error: profError } = await getCurrentProfessional();

      if (profError || !professional) {
        router.push('/auth/login');
        return;
      }

      setProfessional(professional);
    } catch (error) {
      console.error('Error checking auth:', error);
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        
        // Verificamos si estamos en medio de un proceso de conexión iniciado por el usuario
        const isConnecting = typeof window !== 'undefined' && window.localStorage.getItem('is_connecting_google') === 'true';

        // Solo actuamos si hay sesión, hay token Y  el usuario pidió conectar
        if (event === 'SIGNED_IN' && session?.provider_refresh_token && isConnecting) {
          console.log('Detectado retorno de Google con intención de conectar.');
          
          try {
            await saveGoogleRefreshToken(session.provider_refresh_token);

            toast.success('¡Google Calendar conectado exitosamente!');
            
            // Borramos la marca para que no vuelva a salir el toast al recargar
            window.localStorage.removeItem('is_connecting_google');
            
            // Limpieza visual de la URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            // Disparamos evento para que la UI se actualice
            window.dispatchEvent(new Event('google-calendar-updated'));
            
            checkAuth(); 
            
          } catch (e: unknown) {
            const message = e instanceof Error ? e.message : String(e);
            console.error('Error saving token:', message);
            toast.error('Error al guardar la conexión: ' + message);
          }
        }
      }
    );

    const handleProfessionalUpdate = () => {
      checkAuth();
    };

    window.addEventListener('professional-updated', handleProfessionalUpdate);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('professional-updated', handleProfessionalUpdate);
    };
  }, [router, checkAuth]); 

  const handleSignOut = () => {
    router.push('/auth/logout');
  };

  return {
    professional,
    loading,
    handleSignOut,
  };
}
