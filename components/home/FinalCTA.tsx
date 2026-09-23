import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/home/ScrollReveal';

export default function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-16 sm:px-12 sm:py-20 text-center">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(55% 65% at 50% 0%, color-mix(in srgb, var(--primary) 35%, transparent) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance text-background max-w-2xl mx-auto">
              Digitaliza tu negocio profesional hoy mismo
            </h2>
            <p className="mt-4 text-lg text-background/70 max-w-xl mx-auto text-balance">
              Únete a profesionales de todo Chile que ya transformaron su forma de trabajar con Turnate.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/auth/register">
                <Button size="lg" className="h-12 px-7 text-base gap-2 group rounded-xl">
                  Registrarse
                  <LuArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <Link href="/contact" id="contacto">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-7 text-base rounded-xl border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
                >
                  Contactar con ventas
                </Button>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
