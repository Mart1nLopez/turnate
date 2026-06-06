import { TbUsers, TbCalendarCheck, TbPhone, TbMapPin } from 'react-icons/tb';
import { IconType } from 'react-icons';
import { BarbershopPublicProfile, TeamMember } from '@/types';

interface TrustMetricsProps {
  team: TeamMember[];
  barbershop: BarbershopPublicProfile;
}

interface Metric {
  Icon: IconType;
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
      Icon:  TbUsers,
      value: String(team.length),
      label: team.length === 1 ? 'Profesional' : 'Profesionales',
    },
    {
      Icon:  TbCalendarCheck,
      value: 'Online',
      label: 'Reservas disponibles',
    },
    ...(hasContact
      ? [{ Icon: TbPhone, value: '✓', label: 'Contacto disponible' } satisfies Metric]
      : []),
    ...(hasLocation
      ? [{ Icon: TbMapPin, value: locationLabel ?? 'Ver mapa', label: 'Ubicación' } satisfies Metric]
      : []),
  ];

  return (
    <section
      className="py-10 sm:py-12 px-6 w-full border-b"
      style={{ background: 'var(--bb-bg)', borderColor: 'var(--bb-border)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Mobile: horizontal scroll · sm+: grid */}
        <div className="flex gap-4 overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {metrics.map(({ Icon, value, label }) => (
            <div
              key={label}
              className="flex-shrink-0 w-44 sm:w-auto rounded-2xl px-5 py-5 flex flex-col gap-3 border"
              style={{ background: 'var(--bb-card)', borderColor: 'var(--bb-border)' }}
            >
              {/* Icon badge */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--bb-accent-sub)' }}
              >
                <Icon className="w-5 h-5" style={{ color: 'var(--bb-accent)' }} />
              </div>

              {/* Value + label */}
              <div>
                <p
                  className="text-2xl font-bold leading-none mb-1 truncate"
                  style={{ color: 'var(--bb-accent)' }}
                >
                  {value}
                </p>
                <p
                  className="text-sm leading-snug"
                  style={{ color: 'var(--bb-muted)' }}
                >
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
