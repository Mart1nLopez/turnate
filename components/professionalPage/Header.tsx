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
  const initial = professional.name?.charAt(0) || 'P';

  return (
    <header
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        background: 'rgba(17,17,17,0.85)',
        borderColor: 'var(--theme-border)',
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3 gap-4">

        {/* ── Identity ── */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <a href="#hero" className="flex-shrink-0">
            {professional.profile_image ? (
              <div
                className="w-10 h-10 rounded-full overflow-hidden"
                style={{ boxShadow: '0 0 0 1.5px var(--theme-accent-ring)' }}
              >
                <Image
                  src={professional.profile_image}
                  alt={`Foto de ${professional.name}`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'var(--theme-surface)',
                  boxShadow: '0 0 0 1.5px var(--theme-accent-ring)',
                }}
              >
                <span className="text-sm font-bold select-none" style={{ color: 'var(--theme-accent)' }}>
                  {initial}
                </span>
              </div>
            )}
          </a>

          <div className="min-w-0">
            <a href="#hero" className="block">
              <span
                className="text-base sm:text-lg font-bold truncate block leading-tight"
                style={{ color: 'var(--theme-text)' }}
              >
                {professional.name}
              </span>
            </a>
            {barbershop && (
              <Link
                href={`/barberia/${barbershop.slug}`}
                className="text-xs leading-tight hover:opacity-80 transition-opacity truncate block mt-0.5"
                style={{ color: 'var(--theme-accent)' }}
              >
                {barbershop.name}
              </Link>
            )}
          </div>
        </div>

        {/* ── Nav ── */}
        <nav className="hidden md:flex items-center gap-7">
          <a
            href="#servicios"
            className="text-sm font-medium transition-colors duration-200 hover:opacity-100"
            style={{ color: 'var(--theme-muted)', opacity: 0.85 }}
          >
            Servicios
          </a>
          {hasContactInfo && (
            <a
              href="#contactos"
              className="text-sm font-medium transition-colors duration-200 hover:opacity-100"
              style={{ color: 'var(--theme-muted)', opacity: 0.85 }}
            >
              Contacto
            </a>
          )}
          {hasReviews && (
            <a
              href="#reseñas"
              className="text-sm font-medium transition-colors duration-200 hover:opacity-100"
              style={{ color: 'var(--theme-muted)', opacity: 0.85 }}
            >
              Reseñas
            </a>
          )}
        </nav>

        {/* ── CTA ── */}
        <Link href={`/${slug}/agendar`} className="flex-shrink-0">
          <span
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{
              background:   'var(--theme-accent)',
              color:        'var(--theme-accent-fg)',
              borderRadius: '8px',
            }}
          >
            Reservar
          </span>
        </Link>

      </div>
    </header>
  );
}
