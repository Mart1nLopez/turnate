import { BarbershopPublicProfile, TeamMember } from '@/types';

interface TrustMetricsProps {
  team: TeamMember[];
  barbershop: BarbershopPublicProfile;
}

interface Metric {
  value: string;
  label: string;
}

export default function TrustMetrics({ team, barbershop }: TrustMetricsProps) {
  const hasContact = !!(
    barbershop.phone ||
    barbershop.social_links?.instagram ||
    barbershop.social_links?.whatsapp ||
    barbershop.social_links?.facebook ||
    barbershop.social_links?.tiktok ||
    barbershop.social_links?.twitter ||
    barbershop.social_links?.youtube
  );
  const locationLabel = barbershop.city ?? barbershop.region ?? null;
  const hasLocation   = !!(barbershop.address || barbershop.location || locationLabel);

  const metrics: Metric[] = [
    {
      value: String(team.length),
      label: team.length === 1 ? 'Profesional' : 'Profesionales',
    },
    {
      value: 'Online',
      label: 'Reservas disponibles',
    },
    ...(hasContact
      ? [{ value: '24 h', label: 'Contacto disponible' } satisfies Metric]
      : []),
    ...(hasLocation
      ? [{ value: locationLabel ?? 'Ver mapa', label: 'Ubicación' } satisfies Metric]
      : []),
  ];

  return (
    <section
      className="py-12 sm:py-16 px-6 w-full border-b"
      style={{ background: 'var(--theme-bg)', borderColor: 'var(--theme-border)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/*
          Mobile: 2×2 grid with dividers.
          Desktop: single row of 4 with dividers.
          Border logic:
            - Even items (0,2): left column — no left border.
            - Odd items (1,3): right column — left border on mobile.
            - All items except first: left border on desktop (md+).
            - Top-row items (0,1) get bottom border on mobile when a second row exists.
        */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {metrics.map(({ value, label }, i) => {
            const isOdd        = i % 2 === 1;
            const isTopRow     = i < 2 && metrics.length > 2;
            const isFirstOnDt  = i === 0;

            return (
              <div
                key={label}
                className={[
                  'px-6 py-8 text-center md:text-left',
                  isOdd              ? 'border-l'            : '',
                  isTopRow           ? 'border-b md:border-b-0' : '',
                  !isFirstOnDt       ? 'md:border-l'         : '',
                ].filter(Boolean).join(' ')}
                style={{ borderColor: 'var(--theme-border)' }}
              >
                <p
                  className="text-3xl sm:text-4xl font-bold leading-none mb-2 truncate"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  {value}
                </p>
                <p
                  className="text-sm leading-snug"
                  style={{ color: 'var(--theme-muted)' }}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
