'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { createProfessionalProfile } from '@/services/professionalService';
import { supabase } from '@/lib/supabase';
import { generateSlugWithRandomSuffix } from '@/lib/utils';

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

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    rut: string;
    phone: string;
  }) => {
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
          errorMessage = 'La contraseña debe tener al menos 6 caracteres';
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
    } catch (professionalError: any) {
      console.error('Error creando profesional:', professionalError);
      // Si falla por slug duplicado, intentar con un nuevo sufijo
      if (professionalError.message?.includes('duplicate') || professionalError.message?.includes('unique')) {
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
      } else if (professionalError.message?.includes('Signups not allowed')) {
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
  }

  return {
    login,
    register,
    logout,
    isLoading,
    error,
  };
}
