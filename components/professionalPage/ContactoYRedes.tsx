'use client';

import { TbBrandInstagram, TbBrandWhatsapp, TbBrandFacebook } from 'react-icons/tb';
import { FaTiktok, FaYoutube } from 'react-icons/fa';
import { extractMapUrl } from '@/lib/utils';
import { Professional } from '@/types';

interface ContactoYRedesProps {
  professional: Professional;
}

export default function ContactoYRedes({ professional }: ContactoYRedesProps) {
  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return <TbBrandInstagram className="w-6 h-6" />;
      case 'whatsapp':
        return <TbBrandWhatsapp className="w-6 h-6" />;
      case 'facebook':
        return <TbBrandFacebook className="w-6 h-6" />;
      case 'tiktok':
        return <FaTiktok className="w-6 h-6" />;
      case 'youtube':
        return <FaYoutube className="w-6 h-6" />;
      default:
        return null;
    }
  };

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

  const getSocialColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500';
      case 'whatsapp':
        return 'hover:bg-green-500';
      case 'facebook':
        return 'hover:bg-blue-600';
      case 'tiktok':
        return 'hover:bg-black';
      case 'youtube':
        return 'hover:bg-red-600';
      default:
        return 'hover:bg-primary';
    }
  };

  const socialLinks = professional.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some((value) => value);

  return (
    <section id="contactos" className="py-16 px-6 bg-white">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl mb-12 font-bold text-gray-900 text-center">Contacto y Redes Sociales</h2>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Sección de Contacto */}
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
            : professional.location ?
              <div className="p-8 bg-gray-100 rounded-lg shadow-sm">
                <p className="text-lg text-gray-700 mb-2">📍 Ubicación</p>
                <p className="text-gray-600">{professional.location}</p>
              </div>
            : <div className="p-8 bg-gray-100 rounded-lg shadow-sm">
                <p className="text-gray-500">Información de contacto no disponible</p>
              </div>
            }
          </div>

          {/* Sección de Redes Sociales y Biografía */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-800 text-center">Síguenos</h3>
            {hasSocialLinks ?
              <div className="flex flex-col items-center justify-center">
                <div className="flex justify-center items-center gap-4 flex-wrap mb-6">
                  {Object.entries(socialLinks).map(([platform, value]) => {
                    if (!value) return null;

                    return (
                      <a
                        key={platform}
                        href={getSocialUrl(platform, value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center w-14 h-14 bg-white border border-gray-200 rounded-full text-gray-600 transition-all duration-300 hover:text-white hover:scale-110 hover:shadow-lg ${getSocialColor(platform)}`}
                        aria-label={`Seguir en ${platform}`}>
                        {getSocialIcon(platform)}
                      </a>
                    );
                  })}
                </div>
                <p className="text-center text-gray-600 max-w-xs mb-6">
                  Mantente al día con nuestras novedades y promociones
                </p>
              </div>
            : <div className="flex items-center justify-center mb-6">
                <div className="p-6 bg-gray-100 rounded-lg shadow-sm">
                  <p className="text-gray-500 text-center">No hay redes sociales disponibles</p>
                </div>
              </div>
            }

            {/* Biografía */}
            {professional.bio && (
              <div className="mt-8">
                <h4 className="text-lg font-medium text-gray-800 text-center mb-4">Sobre mí</h4>
                <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
                  <p className="text-gray-700 leading-relaxed text-center">{professional.bio}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
