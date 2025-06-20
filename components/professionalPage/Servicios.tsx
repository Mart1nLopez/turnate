'use client';

import Image from 'next/image';
import Link from 'next/link';
import { TbClock } from 'react-icons/tb';
import { Service } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ServiciosProps {
  services: Service[];
  slug: string;
}

export default function Servicios({ services, slug }: ServiciosProps) {
  return (
    <section id="servicios" className="py-16 px-6 text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <h2 className="text-3xl md:text-4xl mb-8 font-bold text-gray-900">Servicios disponibles</h2>

      {services.length === 0 ?
        <p className="text-gray-500 text-center py-8">No hay servicios disponibles en este momento</p>
      : <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-10 justify-center max-w-6xl mx-auto">
            {services.map((service) => (
              <article
                key={service.id}
                className="bg-white border border-gray-300 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:shadow-blue-200 hover:scale-105 transition-all duration-200 ease-in-out cursor-pointer max-w-sm mx-auto w-full"
                onClick={() => {
                  window.location.href = `/${slug}/agendar?service=${service.id}`;
                }}>
                <figure className="mb-4">
                  <div className="relative w-full h-48 mb-3 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    <Image
                      src={service.image_url || '/appointments-default.svg'}
                      alt={service.name}
                      fill
                      className="object-contain p-3"
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
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{service.description}</p>
                )}
              </article>
            ))}
          </div>

          <div className="mt-10 -mb-5">
            <Link href={`/${slug}/agendar`}>
              <span className="inline-block py-3 px-6 font-bold bg-blue-600 text-white no-underline rounded-lg hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                ¡Reserva aquí!
              </span>
            </Link>
          </div>
        </>
      }
    </section>
  );
}
