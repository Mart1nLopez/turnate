import ScrollReveal from '@/components/home/ScrollReveal';
import TestimonialCard from '@/components/home/TestimonialCard';

const TESTIMONIALS = [
  {
    name: 'Marco Corvalán',
    business: "Tommy's Barber Shop, Talca",
    testimonial:
      'Desde que uso Turnate reduje las cancelaciones en un 70%. Mis clientes reservan a cualquier hora y yo me organizo mejor.',
    featured: true,
  },
  {
    name: 'Miguel López',
    business: "Torre's BarberShop, Talca",
    testimonial:
      'La página personalizada me dio presencia online sin gastar en desarrollo web. Mis clientes ven mis trabajos fácilmente.',
  },
  {
    name: 'Santiago Acevedo',
    business: 'Klaus Barber, Santiago',
    testimonial:
      'Las estadísticas me muestran qué servicios son más populares y cuándo tengo más demanda. Optimicé mis horarios gracias a eso.',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonios" className="py-20 lg:py-28 bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="max-w-2xl mb-12 lg:mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
            Profesionales que ya confían en Turnate
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-12 gap-6">
          <ScrollReveal delay={0.05} className="md:col-span-5 h-full">
            <TestimonialCard {...TESTIMONIALS[0]} />
          </ScrollReveal>

          <div className="md:col-span-7 grid gap-6">
            <ScrollReveal delay={0.1}>
              <TestimonialCard {...TESTIMONIALS[1]} />
            </ScrollReveal>
            <ScrollReveal delay={0.15}>
              <TestimonialCard {...TESTIMONIALS[2]} />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
