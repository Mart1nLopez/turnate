'use client';

import { useState } from 'react';
import { LuMail, LuUser, LuLock, LuCreditCard } from 'react-icons/lu';
import PhoneInput from '@/components/ui/phone-input';
import { PasswordInput } from '@/components/ui/password-input';
import Link from 'next/link';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';
import { useAuth } from '@/hooks/useAuth';
import { validateRut, formatRutOnInput } from '@/lib/rut-validator';
import { validatePassword } from '@/lib/passwordValidator';
import { checkEmailAvailability, checkRutAvailability } from '@/services/professionalService';

export default function RegisterPage() {
  const [rutValidation, setRutValidation] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [rutAvailability, setRutAvailability] = useState<{ isValid: boolean; error?: string } | null>(null);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; error?: string } | null>(null);

  const { register, isLoading, error: authError } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

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
    if (formError) setFormError(null);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setFormData({
      ...formData,
      email,
    });
    // Limpiar error cuando el usuario empiece a escribir
    if (formError) setFormError(null);
    // Limpiar validación previa
    setEmailValidation(null);
  };

  const handleRutBlur = async () => {
    const rut = formData.rut;
    if (!rut || rut.length < 8) return;

    // Primero validar formato
    const validation = validateRut(rut);
    if (!validation.isValid) {
      setRutValidation(validation);
      return;
    }

    // Verificar disponibilidad
    try {
      const isAvailable = await checkRutAvailability(rut);
      if (isAvailable) {
        setRutAvailability({ isValid: true });
      } else {
        setRutAvailability({ isValid: false, error: 'Este RUT ya está registrado' });
      }
    } catch (error) {
      console.error('Error checking RUT availability:', error);
      setRutAvailability({ isValid: false, error: 'Error al verificar el RUT' });
    }
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

    // Limpiar disponibilidad previa
    setRutAvailability(null);

    // Limpiar error cuando el usuario empiece a escribir
    if (formError) setFormError(null);
  };

  const handleEmailBlur = async () => {
    const email = formData.email;
    if (!email) return;

    // Validar formato básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailValidation({ isValid: false, error: 'El email no tiene un formato válido' });
      return;
    }

    // Verificar disponibilidad
    try {
      const isAvailable = await checkEmailAvailability(email);
      if (isAvailable) {
        setEmailValidation({ isValid: true });
      } else {
        setEmailValidation({ isValid: false, error: 'Este email ya está registrado' });
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      setEmailValidation({ isValid: false, error: 'Error al verificar el email' });
    }
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
      } else if (!rutAvailability) {
        errors.push('Por favor verifica la disponibilidad de tu RUT');
      } else if (!rutAvailability.isValid) {
        errors.push(rutAvailability.error || 'El RUT no es válido');
      }
    }

    if (!formData.email.trim()) {
      errors.push('El email es requerido');
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.push('El email no tiene un formato válido');
      } else if (!emailValidation) {
        errors.push('Por favor verifica la disponibilidad de tu email');
      } else if (!emailValidation.isValid) {
        errors.push(emailValidation.error || 'El email no es válido');
      }
    }

    if (!formData.phone.trim()) {
      errors.push('El teléfono es requerido');
    }

    if (!formData.password) {
      errors.push('La contraseña es requerida');
    } else {
      const passwordValidation = validatePassword(formData.password, formData.confirmPassword);
      if (!passwordValidation.isValid) {
        errors.push(passwordValidation.error!);
      }
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
      setFormError(validation.errors.join(', '));
      return;
    }

    setFormError(null);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        rut: formData.rut,
        phone: formData.phone,
      });
    } catch (error) {
      // Error is handled in useAuth and exposed via authError state
      console.error(error);
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
                      onBlur={handleRutBlur}
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
                  {rutAvailability && !rutAvailability.isValid && (
                    <p className="text-sm text-red-600">{rutAvailability.error}</p>
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
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      required
                    />
                  </div>
                  {emailValidation && !emailValidation.isValid && (
                    <p className="text-sm text-red-600">{emailValidation.error}</p>
                  )}
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
                      if (formError) setFormError(null);
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
                    <LuLock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                    <PasswordInput
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
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
                    <LuLock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                    <PasswordInput
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Error Message */}
                {(formError || authError) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    <p className="text-sm">{formError || authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    (emailValidation !== null && !emailValidation.isValid) ||
                    (rutAvailability !== null && !rutAvailability.isValid)
                  }
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
