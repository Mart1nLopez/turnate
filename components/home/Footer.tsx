import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-border/60 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col mt-4 py-6 md:flex-row justify-between items-center">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="Turnate Logo" width={28} height={28} className="w-7 h-7" />
              <span className="text-xl font-bold text-foreground">Turnate</span>
            </Link>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition">
              Términos y Condiciones
            </Link>
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition">
              Privacidad
            </Link>
            <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition">
              Contacto
            </Link>
          </div>
        </div>
        <div className="py-4 border-t border-border text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Turnate. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
