'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LuMenu, LuX } from 'react-icons/lu';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#caracteristicas', label: 'Características' },
  { href: '#contacto', label: 'Contacto' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  // Cierra el menú con Escape mientras está abierto.
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16 sm:h-[72px]">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image src="/logo.svg" alt="Turnate Logo" width={28} height={28} className="dark:invert" />
          <span className="text-lg sm:text-xl font-bold tracking-tight">Turnate</span>
        </Link>

        <nav className="nav">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-underline">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm" className="text-sm sm:text-base font-medium rounded-xl">
              Iniciar sesión
            </Button>
          </Link>
          <Link href="/auth/register" className="hidden md:block">
            <Button size="sm" className="text-sm sm:text-base font-medium rounded-xl">
              Registrarse
            </Button>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="md:hidden rounded-xl px-2"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ?
              <LuX className="h-5 w-5" aria-hidden="true" />
            : <LuMenu className="h-5 w-5" aria-hidden="true" />}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Navegación principal"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="md:hidden overflow-hidden border-t border-border/60 bg-background"
          >
            <div className="flex flex-col px-4 sm:px-6 py-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-base font-medium text-foreground/80 hover:text-primary transition-colors border-b border-border/40 last:border-none"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
