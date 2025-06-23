'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LoadingSpinner from '@/components/ui/loading-spinner';
import {
  TbHome,
  TbCalendar,
  TbUsers,
  TbUser,
  TbSettings,
  TbStars,
  TbClock,
  TbLogout,
  TbMenu2,
  TbX,
  TbTrendingUp,
  TbCalendarOff,
} from 'react-icons/tb';
import { AuthService } from '@/services/authService';
import { getCurrentProfessional } from '@/lib/supabase';
import { Professional } from '@/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Inicio', href: '/dashboard', icon: TbHome },
  { name: 'Citas', href: '/dashboard/citas', icon: TbCalendar },
  { name: 'Servicios', href: '/dashboard/servicios', icon: TbUsers },
  { name: 'Disponibilidad', href: '/dashboard/disponibilidad', icon: TbClock },
  { name: 'Libres', href: '/dashboard/libres', icon: TbCalendarOff },
  { name: 'Analíticas', href: '/dashboard/analytics', icon: TbTrendingUp },
  { name: 'Perfil', href: '/dashboard/perfil', icon: TbUser },
  { name: 'Reseñas', href: '/dashboard/resenas', icon: TbStars },
  { name: 'Configuración', href: '/dashboard/configuracion', icon: TbSettings },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleSignOut = () => {
    router.push('/auth/logout');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b">
          <Link href="/" className="flex items-center">
            <Image src="/logo.svg" alt="Turnate Logo" width={24} height={24} className="mr-2 dark:invert" />
            <span className="text-xl font-bold">Turnate</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500">
            <TbX className="h-5 w-5" />
          </button>
        </div>

        {/* Professional info */}
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="text-white font-medium">{professional?.name?.charAt(0) || 'U'}</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{professional?.name}</p>
              <p className="text-xs text-gray-500">{professional?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  console.log('Navegando a:', item.href);
                  // Cerrar sidebar en móvil después de hacer clic
                  setSidebarOpen(false);
                }}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer">
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        {/* Sign out button */}
        <div className="absolute bottom-0 w-full p-3">
          <button
            onClick={handleSignOut}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 transition-colors">
            <TbLogout className="mr-3 h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <TbMenu2 className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1 items-center">
              <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
