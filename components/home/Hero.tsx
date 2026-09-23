import Link from 'next/link';
import { LuArrowRight } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import DashboardMockup from '@/components/home/DashboardMockup';
import TypingAnimation from '@/components/ui/typing-animation';
import { VERTICALS_SINGULAR } from '@/lib/verticals';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle contained accent glow, kept inside the hero only */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-24 h-[560px]"
        style={{
          background:
            'radial-gradient(60% 60% at 20% 20%, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 lg:pt-24 pb-16 md:pb-24 grid md:grid-cols-2 items-center gap-10 md:gap-12">
        <div className="turnate-animate" style={{ '--delay': '0ms' } as React.CSSProperties}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] text-balance">
            Gestiona tu{' '}
            <TypingAnimation words={VERTICALS_SINGULAR} className="text-primary" />{' '}
            <br className="hidden sm:block" />
            con total facilidad
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-xl text-balance">
            Tu propia página web, agenda online y gestión de citas en un solo lugar, pensado para profesionales
            independientes.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/auth/register" className="shrink-0">
              <Button size="lg" className="h-12 px-7 text-base gap-2 group whitespace-nowrap rounded-xl">
                Regístrate ahora
                <LuArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">Gratis para comenzar, sin tarjeta de crédito.</p>
          </div>
        </div>

        {/* Sin alto fijo bajo md: el mockup mobile (DashboardMockup) ahora
            administra su propio alto y evita que su tilt 3D se superponga
            con la sección siguiente. El alto fijo solo aplica en desktop,
            donde nunca causó overflow. */}
        <div
          className="relative flex items-center justify-center md:h-[420px] turnate-scale"
          style={{ '--delay': '120ms' } as React.CSSProperties}
        >
          <DashboardMockup
            desktopImage="/mockups/dashboard.svg"
            mobileImage="/mockups/dashboard-mobile.svg"
            alt="Dashboard de Turnate"
            priority
          />
        </div>
      </div>
    </section>
  );
}
