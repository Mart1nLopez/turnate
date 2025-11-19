'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AuthService } from '@/services/authService';
import { checkEmailAvailability } from '@/services/professionalService';
import { LuMail, LuArrowLeft } from 'react-icons/lu';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Verificar si el correo existe en nuestra base de datos de profesionales
      // checkEmailAvailability retorna true si el correo ESTÁ DISPONIBLE (no registrado)
      // Por lo tanto, si retorna true, significa que el usuario NO existe.
      const isEmailAvailable = await checkEmailAvailability(email);
      
      if (isEmailAvailable) {
        setError('Este correo electrónico no se encuentra registrado.');
        return;
      }

      const { error } = await AuthService.resetPassword(email);
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al enviar el correo. Por favor intenta nuevamente.');
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
              <h2 className="text-2xl text-center font-semibold">Recuperar Contraseña</h2>
              <p className="text-center text-muted-foreground text-sm">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            {error && (
              <div className="mx-6 mt-4 bg-destructive/15 text-destructive text-sm p-3 rounded-md text-center">
                {error}
              </div>
            )}

            {success ? (
              <div className="p-6 text-center space-y-4">
                <div className="bg-green-50 text-green-700 p-4 rounded-md border border-green-200">
                  <p className="font-medium">¡Correo enviado!</p>
                  <p className="text-sm mt-1">
                    Revisa tu bandeja de entrada (o spam) para encontrar el enlace de recuperación y continua desde ahí.
                  </p>
                </div>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center text-sm font-medium text-blue-600 hover:underline">
                  <LuArrowLeft className="mr-2 h-4 w-4" />
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 w-full">
                    {isLoading ? (
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
                        Enviando...
                      </span>
                    ) : (
                      'Enviar enlace de recuperación'
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <Link
                    href="/auth/login"
                    className="inline-flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 hover:underline">
                    <LuArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <BasicFooter />
    </div>
  );
}
