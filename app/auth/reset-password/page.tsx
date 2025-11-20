'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthService } from '@/services/authService';
import { validatePassword, translatePasswordError } from '@/lib/passwordValidator';
import { LuLock, LuCheck } from 'react-icons/lu';
import { PasswordInput } from '@/components/ui/password-input';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar si hay una sesión activa (el link de recuperación loguea al usuario automáticamente)
    const checkSession = async () => {
      const { session } = await AuthService.getSession();
      if (!session) {
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validatePassword(password, confirmPassword);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await AuthService.updatePassword(password);
      if (error) throw error;

      // Cerrar sesión para obligar al usuario a loguearse con la nueva contraseña
      await AuthService.signOut();

      setSuccess(true);

      // Redirigir después de unos segundos
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err) {
      let errorMessage = 'Error al actualizar la contraseña. Asegúrate de haber usado el enlace enviado a tu correo.';

      if (err instanceof Error) {
        const translated = translatePasswordError(err);
        if (translated) {
          errorMessage = translated;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BasicHeader />

      <main className="flex-1 flex items-center bg-gray-100 justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border">
            <div className="px-6 pt-6 pb-2 space-y-1">
              <h2 className="text-2xl text-center font-semibold">Restablecer Contraseña</h2>
              <p className="text-center text-muted-foreground text-sm">Ingresa tu nueva contraseña</p>
            </div>

            {error && (
              <div className="mx-6 mt-4 bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}

            {success ?
              <div className="p-6 text-center space-y-6">
                <div className="flex justify-center">
                  <LuCheck className="h-16 w-16 text-green-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium text-green-700">¡Contraseña Actualizada!</h3>
                  <p className="text-muted-foreground">
                    Tu contraseña ha sido cambiada exitosamente. Por seguridad, hemos cerrado tu sesión. Serás
                    redirigido al inicio de sesión en unos segundos...
                  </p>
                </div>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full">
                  Ir al Inicio de Sesión
                </Link>
              </div>
            : <div className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <LuLock className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <PasswordInput
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

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
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full">
                    {isLoading ?
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Actualizando...
                      </span>
                    : 'Actualizar Contraseña'}
                  </button>
                </form>
              </div>
            }
          </div>
        </div>
      </main>

      <BasicFooter />
    </div>
  );
}
