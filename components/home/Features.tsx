import { LuSettings, LuImage, LuUsers, LuClock, LuTrendingUp, LuMail } from 'react-icons/lu';
import ScrollReveal from '@/components/home/ScrollReveal';
import DashboardMockup from '@/components/home/DashboardMockup';

const FEATURES = [
  {
    icon: LuSettings,
    title: 'Configuraciones empresariales',
    text: 'Autoconfirmación de citas, políticas de cancelación y horas de anticipación.',
  },
  {
    icon: LuImage,
    title: 'Servicios con imágenes',
    text: 'Precios, duración, descripciones e imágenes atractivas para cada servicio.',
  },
  {
    icon: LuUsers,
    title: 'Perfil profesional completo',
    text: 'Biografía, redes sociales, galería de trabajos e información de contacto.',
  },
  {
    icon: LuClock,
    title: 'Disponibilidad flexible',
    text: 'Horarios semanales con múltiples bloques, descansos y días libres.',
  },
  {
    icon: LuTrendingUp,
    title: 'Dashboard con analíticas',
    text: 'Estadísticas de citas, ingresos, clientes y servicios más populares.',
  },
  {
    icon: LuMail,
    title: 'Notificaciones automáticas',
    text: 'Confirmaciones y recordatorios por email, totalmente personalizables.',
  },
];

export default function Features() {
  return (
    <section id="caracteristicas" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          <ScrollReveal className="w-full lg:flex-1">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance mb-10">
              Funcionalidades pensadas para profesionales
            </h2>

            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
              {FEATURES.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="text-muted-foreground text-sm mt-1">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>

          {/* Sin alto fijo bajo md: mismo motivo que en Hero.tsx — el mockup
              mobile administra su propio alto y espacio de seguridad. */}
          <ScrollReveal
            delay={0.1}
            className="relative w-full lg:flex-1 flex items-center justify-center md:h-[420px]"
          >
            <DashboardMockup
              desktopImage="/mockups/analytics.svg"
              mobileImage="/mockups/analytics-mobile.svg"
              alt="Analíticas de Turnate"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
