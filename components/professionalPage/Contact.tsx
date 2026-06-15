'use client';

import { useState } from 'react';
import { extractMapUrl } from '@/lib/utils';
import { Professional } from '@/types';
import { SocialButtons, SocialPlatform } from '@/components/ui/social-buttons';
import { TbMapPin } from 'react-icons/tb';

interface ContactoProps {
  professional: Professional;
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

const PLATFORMS: SocialPlatform[] = [
  'instagram', 'tiktok', 'whatsapp', 'twitter', 'facebook', 'youtube',
];

export default function Contacto({ professional }: ContactoProps) {
  const [mapError, setMapError] = useState(false);

  const socialLinks   = professional.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((v) => v);
  const hasMap         = !!professional.map_embed_url && !mapError;
  const hasTextLocation = !professional.map_embed_url && !!professional.location;
  const hasLocationInfo = !!professional.map_embed_url || !!professional.location;
  const hasBio         = !!professional.bio;

  if (!hasLocationInfo && !hasSocialLinks && !hasBio) return null;

  const activeSocials = PLATFORMS.filter(
    (p) => !!(socialLinks as Record<SocialPlatform, string | undefined>)[p],
  );

  const showRightCol = hasSocialLinks || hasBio;
  const twoCol       = hasLocationInfo && showRightCol;

  return (
    <section
      id="contactos"
      className="py-20 sm:py-28 px-6"
      style={{ background: 'var(--pp-bg)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-12 sm:mb-14">
          <p
            className="text-xs font-semibold tracking-[0.22em] uppercase mb-4"
            style={{ color: 'var(--pp-accent)' }}
          >
            Encuéntranos
          </p>
          <h2
            className="text-3xl sm:text-4xl font-bold mb-4"
            style={{ color: 'var(--pp-text)' }}
          >
            Contacto
          </h2>
          <div
            className="w-10 h-px"
            style={{ background: 'var(--pp-accent)', opacity: 0.45 }}
            aria-hidden="true"
          />
        </div>

        {/* Grid */}
        <div className={`grid gap-8 ${twoCol ? 'md:grid-cols-2' : 'max-w-xl'}`}>

          {/* ── Ubicación ─────────────────────────────────────────────────── */}
          {hasLocationInfo && (
            <div className="space-y-5">
              <h3
                className="text-xs font-semibold tracking-[0.18em] uppercase"
                style={{ color: 'var(--pp-accent)' }}
              >
                Ubicación
              </h3>

              {/* Map embed — hides itself via onError */}
              {professional.map_embed_url && hasMap && (
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--pp-border)' }}
                >
                  <iframe
                    src={extractMapUrl(professional.map_embed_url)}
                    width="100%"
                    height="300"
                    className="block w-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Mapa de ubicación"
                    allowFullScreen
                    onError={() => setMapError(true)}
                  />
                </div>
              )}

              {/* Text location fallback */}
              {(hasTextLocation || (mapError && professional.location)) && (
                <div
                  className="flex items-start gap-3 p-4 rounded-2xl border"
                  style={{ background: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
                >
                  <span
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: 'var(--pp-accent-sub)' }}
                  >
                    <TbMapPin className="w-5 h-5" style={{ color: 'var(--pp-accent)' }} />
                  </span>
                  <p
                    className="text-sm leading-relaxed break-words"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    {professional.location}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── Redes + Bio ───────────────────────────────────────────────── */}
          {showRightCol && (
            <div className="space-y-8">

              {hasSocialLinks && (
                <div>
                  <h3
                    className="text-xs font-semibold tracking-[0.18em] uppercase mb-5"
                    style={{ color: 'var(--pp-accent)' }}
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
                    size="lg"
                    className="flex-wrap"
                  />
                  <p
                    className="text-xs mt-5 leading-relaxed"
                    style={{ color: 'var(--pp-muted)', opacity: 0.65 }}
                  >
                    Mantente al día con novedades y promociones exclusivas.
                  </p>
                </div>
              )}

              {hasBio && (
                <div>
                  <h3
                    className="text-xs font-semibold tracking-[0.18em] uppercase mb-4"
                    style={{ color: 'var(--pp-accent)' }}
                  >
                    Sobre mí
                  </h3>
                  <p
                    className="text-base leading-relaxed break-words"
                    style={{ color: 'var(--pp-muted)' }}
                  >
                    {professional.bio}
                  </p>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </section>
  );
}
