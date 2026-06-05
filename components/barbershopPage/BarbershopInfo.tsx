import { BarbershopPublicProfile } from '@/types';
import { SocialButtons, SocialPlatform } from '@/components/ui/social-buttons';
import { extractMapUrl } from '@/lib/utils';

interface BarbershopInfoProps {
  barbershop: BarbershopPublicProfile;
}

const getSocialUrl = (platform: string, value: string): string => {
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${value.replace('@', '')}`;
    case 'whatsapp':
      return `https://wa.me/${value.replace(/\D/g, '')}`;
    case 'facebook':
      return value.startsWith('http') ? value : `https://facebook.com/${value}`;
    case 'tiktok':
      return value.startsWith('http') ? value : `https://tiktok.com/@${value.replace('@', '')}`;
    case 'youtube':
      return value.startsWith('http') ? value : `https://youtube.com/@${value.replace('@', '')}`;
    case 'twitter':
      return value.startsWith('http') ? value : `https://twitter.com/${value.replace('@', '')}`;
    default:
      return '#';
  }
};

const SOCIAL_PLATFORMS: SocialPlatform[] = [
  'instagram', 'tiktok', 'whatsapp', 'twitter', 'facebook', 'youtube',
];

export default function BarbershopInfo({ barbershop }: BarbershopInfoProps) {
  const socialLinks = barbershop.social_links ?? {};
  const activeSocials = SOCIAL_PLATFORMS.filter(
    (p) => !!(socialLinks as Record<SocialPlatform, string | undefined>)[p],
  );
  const hasSocials = activeSocials.length > 0;
  const hasPhone   = !!barbershop.phone;
  const hasAddress = !!(barbershop.address || barbershop.location);
  const hasMap     = !!barbershop.map_embed_url;
  const hasContact = hasPhone || hasAddress;
  const addressParts = [barbershop.city, barbershop.region].filter(Boolean);

  if (!hasSocials && !hasContact && !hasMap) return null;

  return (
    <section id="info" className="py-16 px-4 sm:px-6 bg-white w-full">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
          Información
        </h2>

        {/* Grid: 1 col en mobile, 2 en md cuando hay ambos bloques */}
        <div
          className={`grid w-full gap-6 ${
            hasContact && hasSocials ? 'md:grid-cols-2' : 'max-w-lg mx-auto'
          }`}
        >
          {/* Contacto */}
          {hasContact && (
            <div className="space-y-3 min-w-0">
              <h3 className="text-xl font-semibold text-gray-800">Contacto</h3>

              {hasPhone && (
                <a
                  href={`tel:${barbershop.phone}`}
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group w-full"
                >
                  {/* flex-shrink-0 evita que el emoji encoja y empuje el texto */}
                  <span className="text-xl leading-none flex-shrink-0" aria-hidden="true">📞</span>
                  {/* min-w-0 permite que el texto haga wrap dentro del flex */}
                  <span className="text-gray-700 group-hover:text-blue-700 transition-colors min-w-0 break-words">
                    {barbershop.phone}
                  </span>
                </a>
              )}

              {hasAddress && (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl w-full">
                  <span className="text-xl leading-none mt-0.5 flex-shrink-0" aria-hidden="true">📍</span>
                  {/* min-w-0 es crítico aquí: sin él, un address largo desborda el flex container */}
                  <div className="min-w-0">
                    {barbershop.address && (
                      <p className="text-gray-700 break-words">{barbershop.address}</p>
                    )}
                    {!barbershop.address && barbershop.location && (
                      <p className="text-gray-700 break-words">{barbershop.location}</p>
                    )}
                    {addressParts.length > 0 && (
                      <p className="text-gray-400 text-sm mt-0.5 break-words">
                        {addressParts.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Redes sociales */}
          {hasSocials && (
            <div className="space-y-3 min-w-0">
              <h3 className="text-xl font-semibold text-gray-800">Síguenos</h3>
              {/* overflow-hidden protege el contenedor cuando los botones hacen wrap */}
              <div className="p-4 bg-gray-50 rounded-xl overflow-hidden">
                <SocialButtons
                  socials={activeSocials.map((p) => ({
                    platform: p,
                    url: getSocialUrl(
                      p,
                      (socialLinks as Record<SocialPlatform, string | undefined>)[p]!,
                    ),
                  }))}
                  size="md"
                  className="flex-wrap w-full"
                />
                <p className="text-sm text-gray-400 mt-4">
                  Mantente al día con nuestras novedades y promociones.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Mapa */}
        {hasMap && (
          <div className="mt-10 w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Ubicación en el mapa</h3>
            {/* overflow-hidden en el wrapper asegura que el iframe no exceda el contenedor */}
            <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 w-full">
              <iframe
                src={extractMapUrl(barbershop.map_embed_url!)}
                width="100%"
                height="320"
                className="block w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Mapa de ${barbershop.name}`}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
