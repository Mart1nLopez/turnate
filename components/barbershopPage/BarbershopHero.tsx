import Image from 'next/image';
import { BarbershopPublicProfile } from '@/types';

interface BarbershopHeroProps {
  barbershop: BarbershopPublicProfile;
}

export default function BarbershopHero({ barbershop }: BarbershopHeroProps) {
  const initial = barbershop.name.charAt(0).toUpperCase();
  const locationParts = [barbershop.city, barbershop.region].filter(Boolean);
  const hasCover = !!barbershop.cover_image_url;

  return (
    <section
      className={`relative w-full overflow-hidden py-12 sm:py-16 md:py-20 px-6 text-white${
        hasCover ? ' min-h-[280px]' : ' bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
      }`}
    >
      {/* Portada — capa 0 */}
      {hasCover && (
        <>
          <Image
            src={barbershop.cover_image_url!}
            alt=""
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Overlay — capa 1: garantiza contraste WCAG sobre cualquier imagen */}
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
        </>
      )}

      {/* Contenido — capa 2, siempre encima del fondo */}
      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center gap-6">

        {barbershop.logo_url ? (
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/20 flex-shrink-0">
            <Image
              src={barbershop.logo_url}
              alt={`Logo de ${barbershop.name}`}
              width={96}
              height={96}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl ring-4 ring-blue-400/30 flex-shrink-0">
            <span className="text-white text-4xl font-bold select-none">{initial}</span>
          </div>
        )}

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight w-full break-words">
          {barbershop.name}
        </h1>

        {locationParts.length > 0 && (
          <p className="text-gray-300 text-base md:text-lg w-full break-words">
            📍 {locationParts.join(', ')}
          </p>
        )}

        {barbershop.description && (
          <p className="text-gray-200 text-base md:text-lg leading-relaxed max-w-2xl w-full break-words">
            {barbershop.description}
          </p>
        )}

      </div>
    </section>
  );
}
