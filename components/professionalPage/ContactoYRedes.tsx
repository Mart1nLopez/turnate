'use client';

import { extractMapUrl } from '@/lib/utils';
import { Professional } from '@/types';
import { SocialButtons } from '@/components/ui/social-buttons';

interface ContactoYRedesProps {
  professional: Professional;
}

export default function ContactoYRedes({ professional }: ContactoYRedesProps) {
  const getSocialUrl = (platform: string, value: string) => {
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
      default:
        return '#';
    }
  };

  const socialLinks = professional.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((value) => value);
  const hasLocationInfo = professional.map_embed_url || professional.location;
  const hasBio = professional.bio;

  // Si no hay información de contacto, redes sociales o biografía, no mostrar la sección
  if (!hasLocationInfo && !hasSocialLinks && !hasBio) {
    return null;
  }

  return (
    <section id="contactos" className="py-16 px-6 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl mb-12 font-bold text-gray-900 text-center">Contacto</h2>

        <div
          className={`grid gap-8 max-w-6xl mx-auto ${
            hasLocationInfo && (hasSocialLinks || hasBio) ? 'md:grid-cols-2' : 'max-w-2xl'
          }`}>
          {/* Sección de Contacto - Solo mostrar si hay información de ubicación */}
          {hasLocationInfo && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 text-center">Ubicación</h3>
              {professional.map_embed_url ?
                <div className="w-full">
                  <iframe
                    src={extractMapUrl(professional.map_embed_url)}
                    width="100%"
                    className="w-full h-80 border-0 rounded-lg shadow-lg"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              : <div className="p-8 bg-gray-100 rounded-lg shadow-sm">
                  <p className="text-lg text-gray-700 mb-2">📍 Ubicación</p>
                  <p className="text-gray-600">{professional.location}</p>
                </div>
              }
            </div>
          )}

          {/* Sección de Redes Sociales y Biografía */}
          {(hasSocialLinks || hasBio) && (
            <div className="space-y-6">
              {/* Redes Sociales - Solo mostrar si hay redes sociales */}
              {hasSocialLinks && (
                <>
                  <h3 className="text-xl font-semibold text-gray-800 text-center">Síguenos</h3>
                  <div className="flex flex-col items-center justify-center">
                    <SocialButtons
                      socials={Object.entries(socialLinks)
                        .filter(([, value]) => !!value)
                        .map(([platform, value]) => ({
                          platform: platform as keyof typeof socialLinks,
                          url: getSocialUrl(platform, value as string),
                        }))}
                      size="lg"
                      className="justify-center items-center flex-wrap mb-6"
                    />
                    <p className="text-center text-gray-600 max-w-xs mb-6">
                      Mantente al día con nuestras novedades y promociones
                    </p>
                  </div>
                </>
              )}

              {/* Biografía - Solo mostrar si hay biografía */}
              {hasBio && (
                <div className="mt-8">
                  <h4 className="text-lg font-medium text-gray-800 text-center mb-4">Sobre mí</h4>
                  <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                    <p className="text-gray-700 leading-relaxed text-center">{professional.bio}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
