'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Professional } from '@/types';

interface HeaderProps {
  professional: Professional;
  slug: string;
  hasReviews?: boolean;
  hasContactInfo?: boolean;
  barbershop?: { name: string; slug: string } | null;
}

export default function Header({
  professional,
  slug,
  hasReviews = true,
  hasContactInfo = true,
  barbershop = null,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between p-2 sm:p-2 md:py-3 lg:px-4">
        <div className="flex items-center flex-1 min-w-0">
          <a href="#hero" className="flex-shrink-0 mr-4">
            {professional.profile_image ?
              <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-blue-600/20">
                <Image
                  src={professional.profile_image}
                  alt={`Foto de ${professional.name}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>
            : <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">{professional.name?.charAt(0) || 'P'}</span>
              </div>
            }
          </a>
          <div className="min-w-0">
            <a href="#hero" className="block">
              <span className="text-xl sm:text-2xl font-bold truncate block">{professional.name}</span>
            </a>
            {barbershop && (
              <Link
                href={`/barberia/${barbershop.slug}`}
                className="block text-sm text-blue-600 hover:underline leading-tight mt-0.5 truncate"
              >
                Trabaja en {barbershop.name}
              </Link>
            )}
          </div>
        </div>

        <nav className="nav">
          <a href="#servicios" className="nav-underline">
            Servicios
          </a>
          {hasContactInfo && (
            <a href="#contactos" className="nav-underline">
              Contacto
            </a>
          )}
          {hasReviews && (
            <a href="#reseñas" className="nav-underline">
              Reseñas
            </a>
          )}
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
