'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Professional } from '@/types';

interface HeaderProps {
  professional: Professional;
  slug: string;
}

export default function Header({ professional, slug }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between p-2 sm:p-2 md:py-3 lg:px-4">
        <div className="flex items-center">
          <a href="#hero" className="flex items-center">
            {professional.profile_image ?
              <div className="h-14 w-14 rounded-full overflow-hidden mr-4 border-2 border-blue-600/20">
                <Image
                  src={professional.profile_image}
                  alt={`Foto de ${professional.name}`}
                  width={100}
                  height={100}
                  className="w-full h-full object-cover"
                />
              </div>
            : <div className="h-14 w-14 rounded-full bg-blue-600 flex items-center justify-center mr-4">
                <span className="text-white font-medium text-sm">{professional.name?.charAt(0) || 'P'}</span>
              </div>
            }
            <div>
              <span className="text-xl sm:text-2xl font-bold">{professional.name}</span>
            </div>
          </a>
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
