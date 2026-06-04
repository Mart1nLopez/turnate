'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { createProfessionalProfile } from '@/services/professionalService';
import { createBarbershopForProfessional } from '@/services/barbershopService';
import { getActiveMembershipByProfessionalId } from '@/services/barbershopMemberService';
import { supabase } from '@/lib/supabase';
import { generateSlugWithRandomSuffix } from '@/lib/utils';
import { translatePasswordError } from '@/lib/passwordValidator';

// Intenta crear la barbería para el professional recién registrado.
// Nunca lanza: si falla, el professional queda funcional y la barbería se crea en Fase 4.
// Verifica membresía activa previa para soportar retries y el backfill ya ejecutado.
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

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await AuthService.signIn(email, password);
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      let errorMessage = 'Ha ocurrido un error al iniciar sesión';
      if (err instanceof Error) {
        switch (err.message) {
          case 'Invalid login credentials':
            errorMessage = 'Credenciales de inicio de sesión inválidas';
            break;
          case 'Email not confirmed':
            errorMessage = 'Correo electrónico no confirmado';
            break;
          case 'Too many requests':
            errorMessage = 'Demasiadas solicitudes. Inténtalo de nuevo más tarde';
            break;
          default:
            errorMessage = err.message;
        }
      }
      setError(errorMessage);
      throw err; // Re-throw to handle in component if needed
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; rut: string; phone: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Limpiar sesión previa si existe
      console.log('Limpiando sesión previa...');
      await AuthService.signOut();

      // 1. Crear usuario en Supabase Auth
      console.log('Creando usuario en Auth...');
      const { data: authData, error: authError } = await AuthService.signUp(data.email, data.password, {
        name: data.name,
      });

      if (authError) {
        console.error('Error en Auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('Usuario creado en Auth:', authData.user.id);

      // 2. Verificar si tenemos sesión inmediata o si requiere confirmación de email
      if (authData.session) {
        console.log('Estableciendo sesión...');
        await supabase.auth.setSession(authData.session);
        console.log('Sesión establecida');

        // Proceder con la creación del profesional
        await handleCreateProfessional(authData.user.id, data);

        // Crear barbería automáticamente (best-effort — fallo silencioso)
        await tryCreateBarbershopBestEffort(authData.user.id);

        // Redirigir al dashboard
        console.log('Redirigiendo al dashboard...');
        router.push('/dashboard');
      } else {
        // No hay sesión - probablemente requiere confirmación de email
        console.log('📧 Email requiere confirmación, saltando creación de profesional');
        console.log('Redirigiendo a confirmación de email...');

        // Guardar temporalmente las credenciales para login automático después de confirmación
        sessionStorage.setItem(
          'pendingEmailConfirmation',
          JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name,
            rut: data.rut,
            phone: data.phone,
            timestamp: Date.now(),
          }),
        );

        router.push('/auth/confirm-email?email=' + encodeURIComponent(data.email));
      }
    } catch (error) {
      console.error('Error en registro:', error);

      let errorMessage = 'Error al crear la cuenta. Por favor intenta nuevamente.';

      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'Ya existe una cuenta con este email';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'El formato del email no es válido';
        } else if (error.message.includes('Password')) {
          const translated = translatePasswordError(error);
          if (translated) {
            errorMessage = translated;
          }
        } else if (error.message.includes('Signups not allowed')) {
          errorMessage = 'Los registros de nuevos usuarios no están permitidos wuaja 😛.';
        }
      }

      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProfessional = async (
    userId: string,
    data: {
      name: string;
      email: string;
      rut: string;
      phone: string;
    },
  ) => {
    // Crear slug único
    const slug = generateSlugWithRandomSuffix(data.name);

    console.log('Creando profesional con slug:', slug);

    try {
      await createProfessionalProfile(userId, {
        ...data,
        slug,
      });
      console.log('Profesional creado exitosamente');
    } catch (professionalError: unknown) {
      console.error('Error creando profesional:', professionalError);
      // Si falla por slug duplicado, intentar con un nuevo sufijo
      const errorMessage = professionalError instanceof Error ? professionalError.message : String(professionalError);

      if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        console.log('Reintentando con nuevo slug...');
        const newSlug = generateSlugWithRandomSuffix(data.name);
        try {
          await createProfessionalProfile(userId, {
            ...data,
            slug: newSlug,
          });
          console.log('Profesional creado con slug:', newSlug);
        } catch (retryError) {
          console.error('Error en segundo intento:', retryError);
          throw retryError;
        }
      } else if (errorMessage.includes('Signups not allowed')) {
        console.error('Signups no permitidos por Supabase');
        throw new Error('Los registros de nuevos usuarios no están permitidos en este momento.');
      } else {
        throw professionalError;
      }
    }
  };

  const logout = async () => {
    try {
      await AuthService.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return {
    login,
    register,
    logout,
    isLoading,
    error,
  };
}
