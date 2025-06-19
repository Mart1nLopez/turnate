import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-secondary">
      <div className="container mx-auto px-4">
        <div className="flex flex-col mt-4 py-8 md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-6 md:mb-0">
            <Image src="/logo.svg" alt="Turnate Logo" width={20} height={20} className="dark:invert" />
            <span className="font-bold">Turnate</span>
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
