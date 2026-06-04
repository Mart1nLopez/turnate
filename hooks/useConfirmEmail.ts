import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { createProfessionalProfile } from '@/services/professionalService';
import { createBarbershopForProfessional } from '@/services/barbershopService';
import { getActiveMembershipByProfessionalId } from '@/services/barbershopMemberService';
import { generateSlugWithRandomSuffix } from '@/lib/utils';
import { toast } from 'sonner';

// Mismo patrón que useAuth.ts — ver comentario allí.
async function tryCreateBarbershopBestEffort(userId: string): Promise<void> {
  try {
    const { data: profData, error: profError } = await supabase
      .from('professionals')
      .select('id, name, slug, phone')
      .eq('user_id', userId)
      .maybeSingle();

    if (profError || !profData) {
      console.warn('[onboarding] Professional no encontrado, omitiendo creación de barbería');
      return;
    }

    const existing = await getActiveMembershipByProfessionalId(profData.id as string);
    if (existing) {
      console.log('[onboarding] Ya tiene membresía activa, omitiendo barbería duplicada');
      return;
    }

    await createBarbershopForProfessional(userId, {
      id: profData.id as string,
      name: profData.name as string,
      slug: profData.slug as string,
      phone: (profData.phone as string | null) ?? undefined,
    });
    console.log('[onboarding] Barbería creada para professional:', profData.id);
  } catch (err) {
    console.error('[onboarding] Error creando barbería (no bloquea registro):', err);
  }
}

export function useConfirmEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  
  // Refs to prevent race conditions and multiple executions
  const isProcessingRef = useRef(false);
  const mountedRef = useRef(true);

  const createProfessionalFromUser = useCallback(
    async (user: { id: string; email?: string; phone?: string; user_metadata?: { name?: string } }) => {
      try {
        // Extraer datos del usuario y de sessionStorage
        const pendingData = sessionStorage.getItem('pendingEmailConfirmation');
        let rut = '';
        let phone = user.phone || '';
        let name = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario';

        // Si hay datos pendientes, usar esos (que incluyen RUT y teléfono del registro)
        if (pendingData) {
          try {
            const { rut: savedRut, phone: savedPhone, name: savedName } = JSON.parse(pendingData);
            if (savedRut) rut = savedRut;
            if (savedPhone) phone = savedPhone;
            if (savedName) name = savedName;
          } catch {
            console.log('No se pudieron recuperar datos adicionales del registro');
          }
        }

        // Crear slug único usando función utilitaria
        const slug = generateSlugWithRandomSuffix(name);

        console.log('Creando perfil profesional con datos completos:', { name, rut, phone, email: user.email });

        try {
          await createProfessionalProfile(user.id, {
            name,
            slug,
            email: user.email || '',
            rut,
            phone,
          });
          console.log('Perfil profesional creado con slug:', slug);
        } catch (error: any) {
          // Log detallado del error para depuración
          // console.error('Error detallado creando perfil:', JSON.stringify(error, null, 2));
          
          const errorMessage = error.message || '';
          const errorCode = error.code || '';

          // Caso 1: El perfil ya existe (duplicado de email o user_id)
          if (errorMessage.includes('professionals_email_key') || errorMessage.includes('professionals_user_id_key')) {
             console.log('El perfil ya existe (detectado por constraint de email/user_id)');
             return;
          }

          // Caso 2: Duplicado de slug (solo en este caso reintentamos)
          if (errorMessage.includes('professionals_slug_key') || (errorCode === '23505' && !errorMessage.includes('email'))) {
             console.log('Detectado posible duplicado de slug, reintentando...');
             const newSlug = generateSlugWithRandomSuffix(name);
             try {
                await createProfessionalProfile(user.id, {
                    name,
                    slug: newSlug,
                    email: user.email || '',
                    rut,
                    phone,
                });
                console.log('Perfil profesional creado con slug (reintento):', newSlug);
             } catch (retryError: any) {
                // Si falla el segundo intento, verificamos si es por email/user_id (race condition durante el reintento)
                if (retryError.message?.includes('professionals_email_key') || retryError.message?.includes('professionals_user_id_key')) {
                    console.log('El perfil ya existe (confirmado en reintento)');
                    return;
                }
                console.error('Error en segundo intento creando perfil:', retryError);
                throw retryError;
             }
          } else {
             // Si no es error de duplicado conocido, verificamos si el perfil ya existe antes de lanzar error
             const { data: existing } = await supabase
                .from('professionals')
                .select('id')
                .eq('user_id', user.id)
                .maybeSingle();
            
             if (existing) {
                 console.log('El perfil ya existía, ignorando error de creación');
                 return;
             }
             // Si no existe y falló por otra razón, lanzamos el error
             console.error('Error no manejado creando perfil:', error);
             throw error;
          }
        }
      } catch (error) {
        console.error('Error final en createProfessionalFromUser:', error);
        throw error;
      }
    },
    [],
  );

  const handleEmailConfirmed = useCallback(
    async (user: { id: string; email?: string; phone?: string; user_metadata?: { name?: string } }) => {
      // Evitar procesamiento múltiple usando ref
      if (isProcessingRef.current) {
        console.log('Ya se está procesando la confirmación, saltando...');
        return;
      }

      isProcessingRef.current = true;

      try {
        console.log('Manejando email confirmado para usuario:', user.id);

        // Intentar crear el perfil
        await createProfessionalFromUser(user);

        // Crear barbería automáticamente (best-effort — fallo silencioso)
        await tryCreateBarbershopBestEffort(user.id);

        // Limpiar datos temporales después de procesar
        sessionStorage.removeItem('pendingEmailConfirmation');

        console.log('Redirigiendo al dashboard...');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error manejando email confirmado:', error);
        // En caso de error, redirigir al dashboard de todos modos, ya que el usuario está confirmado
        router.push('/dashboard');
      } finally {
        isProcessingRef.current = false;
      }
    },
    [router, createProfessionalFromUser],
  );

  const tryAutoLogin = useCallback(async () => {
    const pendingData = sessionStorage.getItem('pendingEmailConfirmation');
    if (!pendingData) return false;

    try {
      const { email: savedEmail, password, timestamp } = JSON.parse(pendingData);

      if (Date.now() - timestamp > 3600000) {
        sessionStorage.removeItem('pendingEmailConfirmation');
        return false;
      }

      if (savedEmail === email) {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: savedEmail,
          password: password,
        });

        if (loginError) {
           // Silently fail for expected errors
           return false;
        }

        if (loginData.user?.email_confirmed_at) {
          console.log('Login automático exitoso, email confirmado');
          sessionStorage.removeItem('pendingEmailConfirmation');
          await handleEmailConfirmed(loginData.user);
          return true;
        }
      }
    } catch (error) {
      console.error('Error en auto login:', error);
    }
    return false;
  }, [email, handleEmailConfirmed]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      console.log('Verificación manual...');
      
      // 1. Refresh session
      await supabase.auth.refreshSession();
      
      // 2. Check session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.email_confirmed_at) {
          console.log('Email confirmado (manual check)');
          await handleEmailConfirmed(session.user);
          return;
      }

      // 3. Try auto login if no session
      if (!session) {
          const success = await tryAutoLogin();
          if (success) return;
      }

      toast.warning('El email aún no ha sido confirmado. Por favor revisa tu bandeja de entrada.');

    } catch (error) {
      console.error('Error en verificación manual:', error);
      toast.error('Error al verificar el estado.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;
      setResent(true);
      toast.success('Email de confirmación enviado nuevamente');
    } catch (error) {
      console.error('Error reenviando email:', error);
      toast.error('Error al reenviar el email.');
    } finally {
      setIsResending(false);
    }
  };

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    mountedRef.current = true;

    const checkStatus = async () => {
        if (!mountedRef.current) return;
        
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session?.user?.email_confirmed_at) {
                await handleEmailConfirmed(session.user);
                return true;
            }
            
            if (!session) {
                return await tryAutoLogin();
            }
        } catch (error) {
            // Silent error
        }
        return false;
    };

    // Initial check
    checkStatus();

    // Polling
    pollingInterval = setInterval(async () => {
        // Refresh session periodically
        try {
            await supabase.auth.refreshSession();
        } catch {}
        
        const confirmed = await checkStatus();
        if (confirmed && pollingInterval) {
            clearInterval(pollingInterval);
        }
    }, 3000);

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user?.email_confirmed_at && mountedRef.current) {
            await handleEmailConfirmed(session.user);
        }
    });

    return () => {
        mountedRef.current = false;
        if (pollingInterval) clearInterval(pollingInterval);
        subscription.unsubscribe();
    };
  }, [handleEmailConfirmed, tryAutoLogin]);

  return {
    email,
    isResending,
    resent,
    isChecking,
    handleManualCheck,
    handleResendEmail
  };
}
