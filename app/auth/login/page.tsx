'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/authService';
import { LuMail, LuLock, LuEye, LuEyeOff } from 'react-icons/lu';
import HeaderAuth from '@/components/auth/HeaderAuth';
import FooterAuth from '@/components/auth/FooterAuth';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await AuthService.signIn(formData.email, formData.password);
      if (error) throw error;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  {/*
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await AuthService.signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error al iniciar sesión con Google');
      setIsLoading(false);
    }
  };
  */}

  return (
    <div className="min-h-screen flex flex-col">
      <HeaderAuth />

      <main className="flex-1 flex items-center bg-gray-100 justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden border">
            <div className="px-6 pt-6 pb-2 space-y-1">
              <h2 className="text-2xl text-center">Iniciar Sesión</h2>
              <p className="text-center text-muted-foreground">Ingresa tus credenciales para acceder</p>
            </div>

            {error && (
              <div className="mx-6 mb-4 bg-destructive/15 text-destructive text-sm p-3 rounded-md">{error}</div>
            )}

            <div className="px-6 pb-6 space-y-4">
              <form onSubmit={handleLogin} className="space-y-4">
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
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Contraseña
                    </label>
                    <Link href="/recuperar-password" className="text-sm text-blue-600 hover:underline">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
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
                      disabled={isLoading}
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

                {/* Boton de recordar sesión
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="remember" className="text-sm">
                    Recordar mi sesión
                  </label>
                </div>*/}

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
                      Iniciando sesión...
                    </span>
                  : 'Iniciar Sesión'}
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

              {/*}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
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
              </div> */}

              <div className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link href="/auth/register" className="text-blue-600 hover:underline">
                  Regístrate gratis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterAuth />
    </div>
  );
}
