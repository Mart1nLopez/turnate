'use client';

import Link from 'next/link';
import { Professional } from '@/types';

interface HeaderProps {
  professional: Professional;
  slug: string;
}

export default function Header({ professional, slug }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between p-2 sm:p-3 md:py-4 lg:px-4">
        <div className="flex items-center">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center mr-4">
              <span className="text-white font-medium text-sm">{professional.name?.charAt(0) || 'P'}</span>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold">{professional.name}</span>
            </div>
          </div>
        </div>

        <nav className="nav">
          <a href="#servicios" className="nav-underline">
            Servicios
          </a>
          <a href="#contactos" className="nav-underline">
            Contacto
          </a>
          <a href="#reseñas" className="nav-underline">
            Reseñas
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={`/${slug}/agendar`}>
            <span className="inline-block py-2 px-4 sm:py-3 sm:px-6 font-bold bg-blue-600 text-white no-underline rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer text-sm sm:text-base">
              ¡Reserva Ya!
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
