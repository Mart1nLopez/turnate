'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LuMail, LuUser, LuLock, LuEye, LuEyeOff, LuCreditCard } from 'react-icons/lu';
import PhoneInput from '@/components/ui/phone-input';
import Link from 'next/link';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';
import { AuthService } from '@/services/authService';
import { supabase } from '@/lib/supabase';
import { validateRut, formatRutOnInput } from '@/lib/rut-validator';
import { generateSlugWithRandomSuffix } from '@/lib/utils';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rutValidation, setRutValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    rut: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedRut = formatRutOnInput(e.target.value);
    setFormData({
      ...formData,
      rut: formattedRut,
    });

    // Validar RUT en tiempo real si tiene al menos 8 caracteres
    if (formattedRut.length >= 8) {
      const validation = validateRut(formattedRut);
      setRutValidation(validation);
    } else {
      setRutValidation(null);
    }

    // Limpiar error cuando el usuario empiece a escribir
    if (error) setError(null);
  };

  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!formData.name.trim()) {
      errors.push('El nombre es requerido');
    }

    if (!formData.rut.trim()) {
      errors.push('El RUT es requerido');
    } else {
      const rutValidation = validateRut(formData.rut);
      if (!rutValidation.isValid) {
        errors.push(rutValidation.error || 'RUT inválido');
      }
    }

    if (!formData.email.trim()) {
      errors.push('El email es requerido');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('El email no tiene un formato válido');
      }
    }

    if (!formData.phone.trim()) {
      errors.push('El teléfono es requerido');
    }

    if (!formData.password) {
      errors.push('La contraseña es requerida');
    } else if (formData.password.length < 6) {
      errors.push('La contraseña debe tener al menos 6 caracteres');
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push('Las contraseñas no coinciden');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar formulario
    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Limpiar sesión previa si existe
      console.log('🔄 Limpiando sesión previa...');
      await AuthService.signOut();
      // 1. Crear usuario en Supabase Auth
      console.log('🔄 Creando usuario en Auth...');
      const { data: authData, error: authError } = await AuthService.signUp(formData.email, formData.password, {
        name: formData.name,
      });

      if (authError) {
        console.error('❌ Error en Auth:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }

      console.log('✅ Usuario creado en Auth:', authData.user.id);

      // 2. Verificar si tenemos sesión inmediata o si requiere confirmación de email
      if (authData.session) {
        console.log('🔄 Estableciendo sesión...');
        await supabase.auth.setSession(authData.session);
        console.log('✅ Sesión establecida');

        // Proceder con la creación del profesional
        await createProfessionalProfile(authData.user.id, formData);

        // Redirigir al dashboard
        console.log('🔄 Redirigiendo al dashboard...');
        router.push('/dashboard');
      } else {
        // No hay sesión - probablemente requiere confirmación de email
        console.log('📧 Email requiere confirmación, saltando creación de profesional');
        console.log('🔄 Redirigiendo a confirmación de email...');

        // Guardar temporalmente las credenciales para login automático después de confirmación
        sessionStorage.setItem(
          'pendingEmailConfirmation',
          JSON.stringify({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            rut: formData.rut,
            phone: formData.phone,
            timestamp: Date.now(),
          }),
        );

        router.push('/auth/confirm-email?email=' + encodeURIComponent(formData.email));
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
    } finally {
      setIsLoading(false);
    }
  };

  // Función auxiliar para crear el perfil del profesional
  const createProfessionalProfile = async (
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

    console.log('🔄 Creando profesional con slug:', slug);

    // Crear registro en la tabla professionals
    const { error: professionalError } = await supabase.from('professionals').insert({
      user_id: userId,
      name: data.name,
      slug: slug,
      email: data.email,
      rut: data.rut,
      phone: data.phone,
    });

    if (professionalError) {
      console.error('❌ Error creando profesional:', professionalError);
      // Si falla por slug duplicado, intentar con un nuevo sufijo
      if (professionalError.message.includes('duplicate') || professionalError.message.includes('unique')) {
        console.log('🔄 Reintentando con nuevo slug...');
        const newSlug = generateSlugWithRandomSuffix(data.name);
        const { error: retryError } = await supabase.from('professionals').insert({
          user_id: userId,
          name: data.name,
          slug: newSlug,
          email: data.email,
          rut: data.rut,
          phone: data.phone,
        });

        if (retryError) {
          console.error('❌ Error en segundo intento:', retryError);
          throw retryError;
        }
        console.log('✅ Profesional creado con slug:', newSlug);
      } else if (professionalError.message.includes('Signups not allowed')) {
        console.error('❌ Signups no permitidos por Supabase');
        throw new Error('Los registros de nuevos usuarios no están permitidos en este momento.');
      } else {
        throw professionalError;
      }
    } else {
      console.log('✅ Profesional creado exitosamente');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BasicHeader />
      <main className="min-h-screen bg-gray-100 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea tu cuenta profesional</h1>
            <p className="text-gray-600">Comienza a gestionar tus citas de manera inteligente</p>
          </div>

          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="px-6 pt-6 pb-2 space-y-1">
              <h2 className="text-2xl font-bold text-center">Registro</h2>
              <p className="text-center text-muted-foreground">Ingresa tus datos para crear tu cuenta</p>
            </div>
            <div className="px-6 pb-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nombre */}
                <div className="space-y-2">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <LuUser className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Juan Pérez"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* RUT */}
                <div className="space-y-2">
                  <label
                    htmlFor="rut"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    RUT
                  </label>
                  <div className="relative">
                    <LuCreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="rut"
                      name="rut"
                      type="text"
                      placeholder="12.345.678-9"
                      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-10 ${
                        rutValidation?.isValid === false ? 'border-red-500 focus-visible:ring-red-500'
                        : rutValidation?.isValid === true ? 'border-green-500 focus-visible:ring-green-500'
                        : ''
                      }`}
                      value={formData.rut}
                      onChange={handleRutChange}
                      maxLength={12}
                      required
                    />
                    {/* Indicador de validación */}
                    {rutValidation && (
                      <div className="absolute right-3 top-3">
                        {rutValidation.isValid ?
                          <div className="h-4 w-4 text-green-500">✓</div>
                        : <div className="h-4 w-4 text-red-500">✗</div>}
                      </div>
                    )}
                  </div>
                  {/* Mensaje de error del RUT */}
                  {rutValidation && !rutValidation.isValid && (
                    <p className="text-sm text-red-500">{rutValidation.error}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email
                  </label>
                  <div className="relative">
                    <LuMail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="juan@ejemplo.com"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <PhoneInput
                    label="Número Celular"
                    value={formData.phone}
                    onChange={(value) => {
                      setFormData({
                        ...formData,
                        phone: value,
                      });
                      // Limpiar error cuando el usuario empiece a escribir
                      if (error) setError(null);
                    }}
                    required
                  />
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Contraseña
                  </label>
                  <div className="relative">
                    <LuLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-10"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                      {showPassword ?
                        <LuEyeOff className="h-4 w-4" />
                      : <LuEye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirmar Contraseña */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <LuLock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full">
                  {isLoading ?
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creando cuenta...
                    </>
                  : 'Crear Cuenta'}
                </button>
              </form>

              {/* Separador */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t"></span>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">o</span>
                </div>
              </div>
              {/* Botones de terceros */}
              {/*
              <div className="space-y-2">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continuar con Google
                </button>
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  Continuar con Apple
                </button>
              </div> */}

              <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Inicia sesión
                </Link>
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-gray-500">
            Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" className="text-blue-600 hover:underline">
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </main>
      <BasicFooter />
    </div>
  );
}
