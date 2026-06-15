'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TbClock } from 'react-icons/tb';
import { Service } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ServicesProps {
  services: Service[];
  slug: string;
}

export default function Services({ services, slug }: ServicesProps) {
  if (services.length === 0) return null;

  return (
    <section
      id="servicios"
      className="py-20 sm:py-28 px-6"
      style={{ background: 'var(--pp-bg)' }}
    >
      <div className="max-w-6xl mx-auto">

        {/* Section header */}
        <div className="mb-14 sm:mb-16">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--pp-accent)' }}
          >
            Servicios
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-4"
            style={{ color: 'var(--pp-text)' }}
          >
            Servicios disponibles
          </h2>
          <div
            className="w-10 h-px mb-5"
            style={{ background: 'var(--pp-accent)', opacity: 0.45 }}
            aria-hidden="true"
          />
          <p
            className="text-base sm:text-lg max-w-md leading-relaxed"
            style={{ color: 'var(--pp-muted)' }}
          >
            Selecciona un servicio para agendar directamente.
          </p>
        </div>

        {/* Service grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {services.map((service) => (
            <article
              key={service.id}
              className="group rounded-2xl overflow-hidden border border-[var(--pp-border)] hover:border-[var(--pp-accent-ring)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_-8px_var(--pp-accent-ring)] cursor-pointer"
              style={{ background: 'var(--pp-surface)' }}
              onClick={() => {
                window.location.href = `/${slug}/agendar?service=${service.id}`;
              }}
            >
              {/* Service image */}
              <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '4/3', borderBottom: '1px solid var(--pp-border)' }}
              >
                <Image
                  src={service.image_url || '/img/appointments-default.svg'}
                  alt={service.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Card body */}
              <div className="p-6">

                {/* Name */}
                <h3
                  className="text-lg font-bold leading-snug mb-2 break-words transition-colors duration-200 text-[var(--pp-text)] group-hover:text-[var(--pp-accent)]"
                >
                  {service.name}
                </h3>

                {/* Description */}
                {service.description && (
                  <p
                    className="text-sm leading-relaxed line-clamp-2 mb-4 break-words"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    {service.description}
                  </p>
                )}

                {/* Meta row: duration + price */}
                <div
                  className="flex items-center justify-between pt-4 mt-auto"
                  style={{ borderTop: '1px solid var(--pp-border)' }}
                >
                  {/* Duration — primary info */}
                  <div className="flex items-center gap-1.5">
                    <TbClock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-accent)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--pp-text)' }}>
                      {service.duration_minutes} min
                    </span>
                  </div>

                  {/* Price — secondary info */}
                  <span
                    className="text-sm font-semibold tabular-nums"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    {formatCurrency(service.price)}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 flex justify-center">
          <Link href={`/${slug}/agendar`}>
            <span
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{
                background:   'var(--pp-accent)',
                color:        'var(--pp-accent-fg)',
                borderRadius: 'var(--pp-radius)',
              }}
            >
              Ver disponibilidad y agendar
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
