'use client';

import { useEffect, useState, useCallback } from 'react';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { TbMail, TbCheck, TbRefresh } from 'react-icons/tb';
import { generateSlugWithRandomSuffix } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Link from 'next/link';

function ConfirmEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // Evitar procesamiento múltiple

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

        console.log('🔄 Creando perfil profesional con datos completos:', { name, rut, phone, email: user.email });

        const { error } = await supabase.from('professionals').insert({
          user_id: user.id,
          name: name,
          slug: slug,
          email: user.email,
          rut: rut,
          phone: phone,
        });

        if (error) {
          console.error('Error creando perfil profesional:', error);
          // Intentar con un slug diferente si falla
          const newSlug = generateSlugWithRandomSuffix(name);
          const { error: retryError } = await supabase.from('professionals').insert({
            user_id: user.id,
            name: name,
            slug: newSlug,
            email: user.email,
            rut: rut,
            phone: phone,
          });

          if (retryError) {
            console.error('Error en segundo intento creando perfil:', retryError);
            throw retryError;
          } else {
            console.log('✅ Perfil profesional creado con slug:', newSlug);
          }
        } else {
          console.log('✅ Perfil profesional creado con slug:', slug);
        }
      } catch (error) {
        console.error('Error inesperado creando perfil:', error);
        throw error;
      }
    },
    [],
  );

  const handleEmailConfirmed = useCallback(
    async (user: { id: string; email?: string; phone?: string; user_metadata?: { name?: string } }) => {
      // Evitar procesamiento múltiple
      if (isProcessing) {
        console.log('⚠️ Ya se está procesando la confirmación, saltando...');
        return;
      }

      setIsProcessing(true);

      try {
        console.log('🔄 Manejando email confirmado para usuario:', user.id);

        // Intentar crear el perfil directamente, si ya existe obtendremos un error específico
        try {
          console.log('🔄 Intentando crear perfil profesional...');
          await createProfessionalFromUser(user);
          console.log('✅ Perfil profesional creado exitosamente');
        } catch (createError: unknown) {
          console.log('Error al crear perfil:', createError);

          // Si el error es por duplicado, significa que ya existe
          const errorMessage = createError instanceof Error ? createError.message : String(createError);
          const errorCode = (createError as { code?: string })?.code;

          if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorCode === '23505') {
            console.log('✅ Perfil profesional ya existe (detectado por error de duplicado)');
          } else {
            // Para otros errores, intentar la consulta de verificación
            try {
              const { data: existingProfessional } = await supabase
                .from('professionals')
                .select('id, user_id, name, slug')
                .eq('user_id', user.id)
                .maybeSingle();

              if (!existingProfessional) {
                // No existe y no se pudo crear, relanzar el error
                throw createError;
              } else {
                console.log('✅ Perfil profesional ya existía');
              }
            } catch (queryError) {
              console.error('Error verificando perfil existente:', queryError);
              // En caso de problemas con RLS, asumir éxito y continuar
              console.log('⚠️ Asumiendo que el perfil se creó correctamente debido a problemas de RLS');
            }
          }
        }

        // Limpiar datos temporales después de procesar
        sessionStorage.removeItem('pendingEmailConfirmation');

        console.log('🔄 Redirigiendo al dashboard...');
        router.push('/dashboard');
      } catch (error) {
        console.error('Error manejando email confirmado:', error);
        // En caso de error, redirigir al dashboard de todos modos
        router.push('/dashboard');
      } finally {
        setIsProcessing(false);
      }
    },
    [router, createProfessionalFromUser, isProcessing, setIsProcessing],
  );

  // Función auxiliar para intentar login automático cuando no hay sesión
  const tryAutoLogin = useCallback(async () => {
    console.log('🔄 Intentando login automático...');

    const pendingData = sessionStorage.getItem('pendingEmailConfirmation');
    if (!pendingData) {
      console.log('❌ No hay credenciales guardadas');
      return false;
    }

    try {
      const { email: savedEmail, password, timestamp } = JSON.parse(pendingData);

      // Verificar que no sean muy viejas (máximo 1 hora)
      if (Date.now() - timestamp > 3600000) {
        console.log('❌ Credenciales guardadas expiradas');
        sessionStorage.removeItem('pendingEmailConfirmation');
        return false;
      }

      if (savedEmail === email) {
        console.log('🔄 Ejecutando login automático...');

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: savedEmail,
          password: password,
        });

        if (loginError) {
          console.error('Error en login automático:', loginError);
          return false;
        }

        if (loginData.user?.email_confirmed_at) {
          console.log('✅ Login automático exitoso, email confirmado');
          // Limpiar credenciales guardadas
          sessionStorage.removeItem('pendingEmailConfirmation');
          await handleEmailConfirmed(loginData.user);
          return true;
        } else {
          console.log('❌ Login exitoso pero email aún no confirmado');
          return false;
        }
      }
    } catch (parseError) {
      console.error('Error procesando credenciales guardadas:', parseError);
      sessionStorage.removeItem('pendingEmailConfirmation');
    }

    return false;
  }, [email, handleEmailConfirmed]);

  useEffect(() => {
    let pollingInterval: NodeJS.Timeout;
    let mounted = true;

    // Verificar sesión actual inmediatamente al cargar la página
    const checkCurrentSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Error obteniendo sesión:', error);
          // Si hay error de sesión, intentar login automático
          return await tryAutoLogin();
        }

        if (session?.user?.email_confirmed_at) {
          console.log('✅ Email ya confirmado, verificando perfil...');
          if (mounted) {
            await handleEmailConfirmed(session.user);
          }
          return true;
        } else if (!session) {
          console.log('❌ No hay sesión, intentando login automático...');
          // No hay sesión, intentar login automático
          return await tryAutoLogin();
        } else {
          console.log('📧 Email aún no confirmado, esperando...');
          return false;
        }
      } catch (error) {
        console.error('Error verificando sesión:', error);
        return false;
      }
    };

    // Función de polling para verificar confirmación
    const startPolling = () => {
      pollingInterval = setInterval(async () => {
        console.log('🔄 Verificando estado de confirmación...');

        // Intentar refrescar la sesión para obtener el estado más actual
        try {
          await supabase.auth.refreshSession();
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (refreshError) {
          console.log('No se pudo refrescar sesión:', refreshError);
        }

        const isConfirmed = await checkCurrentSession();
        if (isConfirmed && pollingInterval) {
          clearInterval(pollingInterval);
        }
      }, 5000); // Verificar cada 5 segundos (menos frecuente para dar tiempo al refresh)
    };

    // Verificar sesión al cargar
    checkCurrentSession().then((isConfirmed) => {
      if (!isConfirmed && mounted) {
        // Si no está confirmado, iniciar polling
        startPolling();
      }
    });

    // También escuchar cambios en el estado de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email_confirmed_at);

      if (session?.user?.email_confirmed_at && mounted) {
        console.log('✅ Email confirmado via auth state change');
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        await handleEmailConfirmed(session.user);
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      subscription.unsubscribe();
    };
  }, [handleEmailConfirmed, tryAutoLogin]);

  const [isChecking, setIsChecking] = useState(false);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      console.log('🔄 Verificación manual de confirmación...');

      // Primero verificar si tenemos sesión
      const {
        data: { session: initialSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (!initialSession || sessionError) {
        console.log('❌ No hay sesión activa, verificando credenciales guardadas...');

        // Intentar obtener credenciales guardadas del registro
        const pendingData = sessionStorage.getItem('pendingEmailConfirmation');
        if (pendingData) {
          try {
            const { email: savedEmail, password, timestamp } = JSON.parse(pendingData);

            // Verificar que no sean muy viejas (máximo 1 hora)
            if (Date.now() - timestamp > 3600000) {
              console.log('❌ Credenciales guardadas expiradas');
              sessionStorage.removeItem('pendingEmailConfirmation');
              toast.error('La sesión de confirmación ha expirado. Por favor regístrate nuevamente.');
              router.push('/auth/register');
              return;
            }

            if (savedEmail === email) {
              console.log('🔄 Intentando login automático después de confirmación...');

              const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                email: savedEmail,
                password: password,
              });

              if (loginError) {
                console.error('Error en login automático:', loginError);
                toast.error('Error al acceder automáticamente. Por favor ve al login manual.');
                router.push('/auth/login');
                return;
              }

              if (loginData.user?.email_confirmed_at) {
                console.log('✅ Login automático exitoso, email confirmado');
                // Limpiar credenciales guardadas
                sessionStorage.removeItem('pendingEmailConfirmation');
                await handleEmailConfirmed(loginData.user);
                return;
              } else {
                console.log('❌ Login exitoso pero email aún no confirmado');
                toast.warning('El email aún no está confirmado.');
              }
            }
          } catch (parseError) {
            console.error('Error procesando credenciales guardadas:', parseError);
            sessionStorage.removeItem('pendingEmailConfirmation');
          }
        }

        setIsChecking(false);
        toast.error('El email parece confirmado pero no hay sesión activa. Por favor intenta hacer login manualmente.');
        router.push('/auth/login');
        return;
      }

      // Método 1: Forzar actualización de la sesión
      console.log('🔄 Forzando actualización de sesión...');
      await supabase.auth.refreshSession();

      // Esperar un momento para que se actualice
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Método 2: Obtener usuario actual directamente
      console.log('🔄 Obteniendo usuario actual...');
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error obteniendo usuario:', userError);
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Error obteniendo sesión:', error);
        toast.error('Error al verificar el estado. Por favor intenta nuevamente.');
        return;
      }

      console.log('🔍 Estado actual del usuario (sesión):', {
        userId: session?.user?.id,
        email: session?.user?.email,
        emailConfirmed: session?.user?.email_confirmed_at,
        confirmedAt: session?.user?.email_confirmed_at,
      });

      console.log('🔍 Estado actual del usuario (getUser):', {
        userId: user?.id,
        email: user?.email,
        emailConfirmed: user?.email_confirmed_at,
        confirmedAt: user?.email_confirmed_at,
      });

      // Usar el usuario más actualizado
      const currentUser = user || session?.user;

      if (currentUser?.email_confirmed_at) {
        console.log('✅ Email confirmado en verificación manual');
        await handleEmailConfirmed(currentUser);
      } else {
        console.log('📧 Email aún no confirmado en verificación manual');
        toast.warning(
          'El email aún no ha sido confirmado. Por favor revisa tu bandeja de entrada y haz clic en el enlace de confirmación.',
        );
      }
    } catch (error) {
      console.error('Error en verificación manual:', error);
      toast.error('Error al verificar el estado. Por favor intenta nuevamente.');
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
      toast.error('Error al reenviar el email. Por favor intenta nuevamente.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TbMail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Confirma tu email</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">Hemos enviado un link de confirmación a:</p>

          <p className="font-medium text-gray-900 bg-gray-100 px-3 py-2 rounded">{email}</p>

          <p className="text-sm text-gray-500">
            Revisa tu bandeja de entrada (y carpeta de spam) y haz clic en el link para activar tu cuenta.
          </p>

          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
              <span className="text-sm">Verificando automáticamente cada 5 segundos...</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button onClick={handleManualCheck} disabled={isChecking} className="w-full">
              {isChecking ?
                <>
                  <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              : <>
                  <TbCheck className="w-4 h-4 mr-2" />
                  Ya confirmé mi email
                </>
              }
            </Button>

            {!resent ?
              <Button onClick={handleResendEmail} disabled={isResending} variant="outline" className="w-full">
                {isResending ?
                  <>
                    <TbRefresh className="w-4 h-4 mr-2 animate-spin" />
                    Reenviando...
                  </>
                : <>
                    <TbRefresh className="w-4 h-4 mr-2" />
                    Reenviar email
                  </>
                }
              </Button>
            : <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <TbCheck className="w-4 h-4 mr-2" />
                  <span className="text-sm">Email reenviado exitosamente</span>
                </div>
              </div>
            }

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-3">¿Problemas con la confirmación?</p>
              <Link href="/auth/login">
                <Button variant="ghost" className="w-full">
                  Volver al login
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ConfirmEmailContent />
    </Suspense>
  );
}
