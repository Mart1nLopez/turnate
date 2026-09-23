import Image from 'next/image';
import { LuCalendar, LuGlobe, LuStar } from 'react-icons/lu';
import ScrollReveal from '@/components/home/ScrollReveal';

export default function Benefits() {
  return (
    <section id="beneficios" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="max-w-2xl mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
            Todo lo que necesitas para hacer crecer tu negocio
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Desde la agenda hasta tu presencia online: las herramientas esenciales para verte profesional y ahorrar
            tiempo cada semana.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          <ScrollReveal delay={0.05} className="md:row-span-2">
            <div className="relative h-full min-h-[320px] rounded-2xl overflow-hidden group">
              <Image
                src="/img/default-carrusel/sala.jpeg"
                alt="Barbería gestionada con Turnate"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="relative h-full flex flex-col justify-end p-8">
                <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <LuCalendar className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Gestión completa de citas</h3>
                <p className="text-white/80 text-sm max-w-sm">
                  Filtros avanzados, cancelaciones y confirmaciones automáticas para que nada se te escape.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <div className="rounded-2xl bg-accent p-8 h-full">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-background">
                <LuGlobe className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Página web personalizada</h3>
              <p className="text-muted-foreground text-sm">
                Tu propia página con galería, servicios, reseñas y agendamiento integrado.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="rounded-2xl bg-muted p-8 h-full">
              <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-background">
                <LuStar className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Reseñas automáticas</h3>
              <p className="text-muted-foreground text-sm">
                Tus clientes dejan reseñas apenas se completa la cita, sin que tengas que pedirlas.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
