import Link from 'next/link';
import Image from 'next/image';
import {
  LuCalendar,
  LuClock,
  LuGlobe,
  LuUsers,
  LuTrendingUp,
  LuSettings,
  LuStar,
  LuMail,
  LuImage,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import Footer from '@/components/home/Footer';
import TestimonialCard from '@/components/home/TestimonialCard';
import HashRedirect from '@/components/professionalPage/HashRedirect';
import DashboardMockup from '@/components/home/DashboardMockup';
import TypingAnimation from '@/components/ui/typing-animation';

export default function LandingPage() {
  return (
    <>
      <HashRedirect />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 scroll-smooth">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md">
          <div className="container mx-auto flex items-center justify-between p-2 sm:p-3 md:py-6 lg:px-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Image src="/logo.svg" alt="Turnate Logo" width={32} height={32} className="mr-2 dark:invert" />
                <span className="text-xl sm:text-2xl font-bold">Turnate</span>
              </Link>
            </div>

            <nav className="nav">
              <a href="#caracteristicas" className="nav-underline">
                Características
              </a>
              <a href="#beneficios" className="nav-underline">
                Beneficios
              </a>
              <a href="#precios" className="nav-underline">
                Precios
              </a>
              <a href="#contacto" className="nav-underline">
                Contacto
              </a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="text-sm sm:text-base font-medium">
                  Iniciar sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="text-sm sm:text-base font-medium">
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Sección Hero */}
        <section className="container mx-auto px-2 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
              Gestiona tu{' '}
              <TypingAnimation
                words={[
                  'negocio',
                  'barbería',
                  'clínica',
                  'peluquería',
                  'taller mecánico',
                  'spa',
                  'kinesiología',
                  'centro médico',
                  'estética',
                  'masoterapia',
                  'odontología',
                  'psicología',
                  'nutrición',
                  'veterinaria',
                  'salón de belleza',
                  'gimnasio',
                  'yoga',
                  'pilates',
                  'terapia',
                  'consulta médica',
                  'laboratorio',
                  'radiología',
                  'quiropráctica',
                  'podología',
                  'dermatología',
                  'oftalmología',
                  'fisioterapia',
                  'acupuntura',
                  'estudio de tatuajes',
                  'manicure',
                  'pedicure',
                  'coaching',
                  'consultorio',
                  'centro estético',
                ]}
                className="text-primary"
              />{' '}
              <br/>
              con facilidad
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl">
              Plataforma completa para profesionales independientes: gestiona citas, servicios, disponibilidad y
              clientes con tu propia página web personalizada y sistema de agendamiento automático.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/auth/register">
                <Button className="p-6 text-base">Comenzar ahora</Button>
              </Link>
              {/*<Link href="/demo">
                <Button variant="outline" className="p-6 text-base">Ver demo</Button>
              </Link>*/}
            </div>
          </div>
          <div className="relative h-[400px] md:h-[400px] w-full md:flex-1 flex items-center justify-center md:my-5 my-12">
            <DashboardMockup />
          </div>
        </section>

        {/* Sección de Beneficios */}
        <section id="beneficios" className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas en una plataforma</h2>
              <p className="text-muted-foreground">
                Desde la gestión de horarios hasta tu presencia online, Turnate incluye todas las herramientas
                profesionales para hacer crecer tu negocio
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="bg-accent p-3 size-12 flex items-center justify-center rounded-lg mb-4">
                  <LuCalendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Gestión completa de citas</h3>
                <p className="text-muted-foreground">
                  Administra todas tus citas con filtros avanzados, cancelaciones y confirmaciones automáticas.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="bg-accent p-3 size-12 flex items-center justify-center rounded-lg mb-4">
                  <LuGlobe className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Página web personalizada</h3>
                <p className="text-muted-foreground">
                  Tu propia página con galería de imágenes, servicios, reseñas y sistema de agendamiento integrado.
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
                <div className="bg-accent p-3 size-12 flex items-center justify-center rounded-lg mb-4">
                  <LuStar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Sistema de reseñas</h3>
                <p className="text-muted-foreground">
                  Los clientes pueden dejar reseñas automáticamente después de cada cita completada.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Características */}
        <section id="caracteristicas" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="w-full md:flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Funcionalidades avanzadas para profesionales</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <LuSettings className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Configuraciones empresariales</span>
                      <p className="text-muted-foreground text-sm">
                        Autoconfirmación de citas, políticas de cancelación, horas de anticipación.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <LuImage className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Gestión de servicios con imágenes</span>
                      <p className="text-muted-foreground text-sm">
                        Crea servicios personalizados con precios, duración, descripciones e imágenes atractivas.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <LuUsers className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Perfil profesional completo</span>
                      <p className="text-muted-foreground text-sm">
                        Perfil personalizable con biografía, redes sociales, galería de trabajos y información de
                        contacto.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <LuClock className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Disponibilidad flexible</span>
                      <p className="text-muted-foreground text-sm">
                        Configura horarios semanales con múltiples bloques de tiempo, descansos y días libres
                        específicos.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <LuTrendingUp className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Dashboard con analíticas</span>
                      <p className="text-muted-foreground text-sm">
                        Estadísticas detalladas de citas, ingresos, clientes y servicios más populares para tomar
                        decisiones.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <LuMail className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Notificaciones automáticas</span>
                      <p className="text-muted-foreground text-sm">
                        Envío automático de confirmaciones y recordatorios por email con configuración personalizable.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="relative h-[400px] md:h-[400px] w-full md:flex-1 flex items-center justify-center md:my-5 my-12">
                <DashboardMockup />
              </div>
            </div>
          </div>
        </section>

        {/* Sección de Testimonios */}
        <section className="bg-muted py-16 md:py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Lo que dicen nuestros usuarios</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                name="Marco Toranzo"
                business="Tommy's Barber Shop, Talca"
                testimonial='"Desde que uso Turnate he reducido las cancelaciones en un 70%. Mis clientes valoran poder reservar a cualquier hora y yo puedo organizarme mejor."'
              />

              <TestimonialCard
                name="Miguel Álvarez"
                business="Torre's BarberShop, Talca"
                testimonial='"La página personalizada me permitió tener presencia online sin gastar en desarrollo web. Mis clientes pueden ver mis trabajos y servicios fácilmente."'
              />

              <TestimonialCard
                name="Santiago Aular"
                business="Klaus Barber, Santiago"
                testimonial='"Las estadísticas me ayudan a entender qué servicios son más populares y en qué momentos tengo más demanda. He podido optimizar mis horarios gracias a Turnate."'
              />
            </div>
          </div>
        </section>

        {/* Sección CTA final */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Digitaliza tu negocio profesional hoy mismo</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Únete a profesionales de toda Chile que ya transformaron su manera de trabajar con Turnate. Tu página web
              profesional, sistema de citas y dashboard administrativo te esperan.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="auth/register">
                <Button size="lg" className="text-lg py-6">
                  Registrarse
                </Button>
              </Link>
              <Link href="/contact" id="contacto">
                <Button variant="outline" size="lg" className="text-lg py-6">
                  Contactar con ventas
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
