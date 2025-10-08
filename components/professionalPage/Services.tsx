'use client';

import { useRef } from 'react';
import { Service } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { TbClock } from 'react-icons/tb';
import { formatCurrency } from '@/lib/utils';

interface ServicesProps {
  services: Service[];
  slug: string;
}

export default function Services({ services, slug }: ServicesProps) {
  const carouselRef = useRef<HTMLDivElement>(null);

  // Determina si hay exactamente 3 servicios para centrar las cards
  const isThreeServices = services.length === 3;

  return (
    <section id="servicios" className="py-16 px-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h2 className="text-3xl md:text-4xl mb-8 font-bold text-gray-900">Servicios disponibles</h2>
      <div className="relative max-w-6xl mx-auto">
        <div
          ref={carouselRef}
          className={`flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory py-2 px-1 ${isThreeServices ? 'justify-center' : ''}`}
          style={{ scrollBehavior: 'smooth' }}>
          {services.map((service) => (
            <article
              key={service.id}
              className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-blue-200 hover:scale-102 transition-all duration-200 ease-in-out cursor-pointer w-72 min-w-[18rem] max-w-[18rem] snap-center"
              onClick={() => {
                window.location.href = `/${slug}/agendar?service=${service.id}`;
              }}>
              <figure className="mb-4">
                <div className="relative w-44 h-44 mb-3 rounded-xl overflow-hidden bg-gray-200 flex items-center justify-center mx-auto">
                  <Image
                    src={service.image_url || '/img/appointments-default.svg'}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 176px, 256px"
                    className="object-cover p-1 rounded-2xl"
                  />
                </div>
                <figcaption className="font-semibold mt-3 text-gray-900">{service.name}</figcaption>
              </figure>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-green-600 flex items-center">{formatCurrency(service.price)}</p>
                <div className="flex items-center text-gray-500">
                  <TbClock className="h-4 w-4 mr-1" />
                  <span className="text-sm">{service.duration_minutes} min</span>
                </div>
              </div>
              {service.description && (
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 text-balance">{service.description}</p>
              )}
            </article>
          ))}
        </div>
        {services.length > 4 && (
          <div className="mt-8">
            <Link href={`/${slug}/agendar`}>
              <span className="inline-block py-3 px-6 font-bold bg-blue-600 text-white no-underline rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                Ver todos los servicios
              </span>
            </Link>
          </div>
        )}
      </div>
      {services.length <= 4 && (
        <div className="mt-10 -mb-5">
          <Link href={`/${slug}/agendar`}>
            <span className="inline-block py-3 px-6 font-bold bg-blue-600 text-white no-underline rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
              ¡Reserva aquí!
            </span>
          </Link>
        </div>
      )}
    </section>
  );
}
