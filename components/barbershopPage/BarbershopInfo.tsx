import { BarbershopPublicProfile } from '@/types';
import { SocialButtons, SocialPlatform } from '@/components/ui/social-buttons';
import { extractMapUrl } from '@/lib/utils';
import { TbPhone, TbMapPin } from 'react-icons/tb';
import MapEmbed from './MapEmbed';

interface BarbershopInfoProps {
  barbershop: BarbershopPublicProfile;
}

const getSocialUrl = (platform: string, value: string): string => {
  switch (platform) {
    case 'instagram': return `https://instagram.com/${value.replace('@', '')}`;
    case 'whatsapp':  return `https://wa.me/${value.replace(/\D/g, '')}`;
    case 'facebook':  return value.startsWith('http') ? value : `https://facebook.com/${value}`;
    case 'tiktok':    return value.startsWith('http') ? value : `https://tiktok.com/@${value.replace('@', '')}`;
    case 'youtube':   return value.startsWith('http') ? value : `https://youtube.com/@${value.replace('@', '')}`;
    case 'twitter':   return value.startsWith('http') ? value : `https://twitter.com/${value.replace('@', '')}`;
    default:          return '#';
  }
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'tiktok', 'whatsapp', 'twitter', 'facebook', 'youtube',
];

export default function BarbershopInfo({ barbershop }: BarbershopInfoProps) {
  const socialLinks   = barbershop.social_links ?? {};
  const activeSocials = SOCIAL_PLATFORMS.filter(
    (p) => !!(socialLinks as Record<SocialPlatform, string | undefined>)[p],
  );
  const hasSocials   = activeSocials.length > 0;
  const hasPhone     = !!barbershop.phone;
  const hasAddress   = !!(barbershop.address || barbershop.location);
  const mapUrl       = barbershop.map_embed_url ? extractMapUrl(barbershop.map_embed_url) : '';
  const hasMap       = !!mapUrl;
  const hasContact   = hasPhone || hasAddress;
  const addressParts = [barbershop.city, barbershop.region].filter(Boolean);

  if (!hasSocials && !hasContact && !hasMap) return null;

  return (
    <section
      id="info"
      className="py-20 sm:py-28 px-6 w-full"
      style={{ background: 'var(--theme-bg)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12 sm:mb-14">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--theme-accent)' }}
          >
            Visítanos
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Encuéntranos
          </h2>
          {/* Accent divider */}
          <div
            className="w-10 h-px"
            style={{ background: 'var(--theme-accent)', opacity: 0.45 }}
            aria-hidden="true"
          />
        </div>

        {/* Contact + Socials grid */}
        {(hasContact || hasSocials) && (
          <div
            className={`grid gap-5 mb-8 ${
              hasContact && hasSocials ? 'md:grid-cols-2' : 'max-w-lg'
            }`}
          >
            {/* ── Contacto ─────────────────────────────────────────────── */}
            {hasContact && (
              <div
                className="rounded-2xl p-6 border"
                style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
              >
                <h3
                  className="text-xs font-semibold tracking-[0.18em] uppercase mb-5"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  Contacto
                </h3>
                <div className="space-y-3">

                  {hasPhone && (
                    <a
                      href={`tel:${barbershop.phone}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 w-full border-[var(--theme-border)] hover:border-[var(--theme-accent-ring)]"
                      style={{ background: 'var(--theme-bg)' }}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--theme-accent-sub)' }}
                      >
                        <TbPhone className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                      </span>
                      <span
                        className="text-sm min-w-0 break-words"
                        style={{ color: 'var(--theme-muted)' }}
                      >
                        {barbershop.phone}
                      </span>
                    </a>
                  )}

                  {hasAddress && (
                    <div
                      className="flex items-start gap-3 p-3.5 rounded-xl border w-full border-[var(--theme-border)]"
                      style={{ background: 'var(--theme-bg)' }}
                    >
                      <span
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: 'var(--theme-accent-sub)' }}
                      >
                        <TbMapPin className="w-5 h-5" style={{ color: 'var(--theme-accent)' }} />
                      </span>
                      <div className="min-w-0">
                        {barbershop.address && (
                          <p
                            className="text-sm break-words"
                            style={{ color: 'var(--theme-muted)' }}
                          >
                            {barbershop.address}
                          </p>
                        )}
                        {!barbershop.address && barbershop.location && (
                          <p
                            className="text-sm break-words"
                            style={{ color: 'var(--theme-muted)' }}
                          >
                            {barbershop.location}
                          </p>
                        )}
                        {addressParts.length > 0 && (
                          <p
                            className="text-xs mt-1 break-words"
                            style={{ color: 'var(--theme-muted)', opacity: 0.7 }}
                          >
                            {addressParts.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Redes sociales ───────────────────────────────────────── */}
            {hasSocials && (
              <div
                className="rounded-2xl p-6 border"
                style={{ background: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
              >
                <h3
                  className="text-xs font-semibold tracking-[0.18em] uppercase mb-5"
                  style={{ color: 'var(--theme-accent)' }}
                >
                  Síguenos
                </h3>
                <SocialButtons
                  socials={activeSocials.map((p) => ({
                    platform: p,
                    url: getSocialUrl(
                      p,
                      (socialLinks as Record<SocialPlatform, string | undefined>)[p]!,
                    ),
                  }))}
                  size="md"
                  className="flex-wrap"
                />
                <p
                  className="text-xs mt-5 leading-relaxed"
                  style={{ color: 'var(--theme-muted)', opacity: 0.6 }}
                >
                  Síguenos para novedades y promociones exclusivas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Mapa — MapEmbed se oculta automáticamente si el iframe lanza error */}
        {hasMap && (
          <div
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: 'var(--theme-border)' }}
          >
            <MapEmbed
              src={mapUrl}
              title={`Mapa de ${barbershop.name}`}
            />
          </div>
        )}

      </div>
    </section>
  );
}
