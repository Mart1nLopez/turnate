'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="py-6 px-6 border-t"
      style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Turnate branding */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80"
          style={{ opacity: 0.5 }}
          aria-label="Turnate"
        >
          <Image
            src="/logo.svg"
            alt="Turnate"
            width={18}
            height={18}
            className="w-[18px] h-[18px]"
          />
          <span
            className="text-xs font-semibold tracking-[0.15em] uppercase"
            style={{ color: 'var(--theme-text)' }}
          >
            Powered by Turnate
          </span>
        </Link>

        {/* Copyright */}
        <p
          className="text-xs"
          style={{ color: 'var(--theme-muted)', opacity: 0.5 }}
        >
          &copy; {new Date().getFullYear()} Todos los derechos reservados
        </p>

      </div>
    </footer>
  );
}
