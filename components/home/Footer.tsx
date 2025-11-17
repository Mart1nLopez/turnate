import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto px-4">
        <div className="flex flex-col mt-4 py-6 md:flex-row justify-between items-center">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
            <Link href="/" className="flex items-center">
              <Image src="/logo.svg" alt="Turnate Logo" width={32} height={32} className="w-8 h-8" />
              <span className="text-2xl font-bold text-foreground">Turnate</span>
            </Link>
          </div>
          <div className="flex gap-6">
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition">
              Términos
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
