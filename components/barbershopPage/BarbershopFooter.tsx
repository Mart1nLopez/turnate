import Image from 'next/image';
import Link from 'next/link';

export default function BarbershopFooter() {
  return (
    <footer
      className="py-6 px-6 border-t"
      style={{ background: 'var(--bb-card)', borderColor: 'var(--bb-border)' }}
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

        {/* Turnate branding */}
        <Link
          href="/"
          className="flex items-center gap-2 opacity-50 hover:opacity-80 transition-opacity duration-200"
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
            style={{ color: 'var(--bb-text)' }}
          >
            Powered by Turnate
          </span>
        </Link>

        {/* Copyright */}
        <p
          className="text-xs"
          style={{ color: 'var(--bb-muted)', opacity: 0.5 }}
        >
          &copy; {new Date().getFullYear()} Todos los derechos reservados
        </p>

      </div>
    </footer>
  );
}
