import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, Globe, Users, BarChart3 } from 'lucide-react';
import Footer from '@/components/home/Footer';
import TestimonialCard from '@/components/home/TestimonialCard';

export default function LandingPage() {
  return (
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
              <button className="text-sm sm:text-base font-medium hover:text-primary transition nav-underline">
                Iniciar sesión
              </button>
            </Link>
            <Link href="/auth/register">
              <button className="text-sm sm:text-base font-medium text-primary-foreground bg-primary px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg hover:bg-primary/90 transition">
                Registrarse
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Sección Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
            Gestiona tu negocio con facilidad
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            La plataforma que simplifica la gestión de citas para profesionales. Aumenta tus ingresos y mejora la
            experiencia de tus clientes.
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            <Link href="/auth/register">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition animate-bounce">
                Comenzar ahora
              </button>
            </Link>
            <Link href="/demo">
              <button className="border border-input px-6 py-3 rounded-lg font-medium hover:bg-muted transition">
                Ver demo
              </button>
            </Link>
          </div>
        </div>
        <div className="relative h-[400px] md:h-[400px] w-full md:flex-1 rounded-xl overflow-hidden shadow-2xl">
          <Image
            src="https://place-hold.it/800x600/blue/white?text=App+Mockup"
            alt="Aplicación Turnate en un dispositivo"
            fill
            className="object-cover"
            priority
          />
        </div>
      </section>

      {/* Sección de Beneficios */}
      <section id="beneficios" className="bg-muted py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Beneficios principales</h2>
            <p className="text-muted-foreground">
              Turnate te ofrece todas las herramientas que necesitas para gestionar tu negocio de manera eficiente
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-accent p-3 size-12 flex items-center justify-center rounded-lg mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Gestión de disponibilidad</h3>
              <p className="text-muted-foreground">
                Configura fácilmente tus horarios, descansos y días libres sin complicaciones.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-accent p-3 size-12 flex items-center justify-center rounded-lg mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Página personalizada</h3>
              <p className="text-muted-foreground">
                Crea tu página web con tu marca, servicios y precios para destacar entre la competencia.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition">
              <div className="bg-accent p-3 size-12 flex items-center justify-center rounded-lg mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Agendamiento online</h3>
              <p className="text-muted-foreground">
                Permite a tus clientes reservar citas 24/7 desde cualquier dispositivo de manera sencilla.
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Características diseñadas para mejorar tu rendimiento
              </h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Calendar className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Recordatorios automáticos</span>
                    <p className="text-muted-foreground text-sm">
                      Reduce las cancelaciones con notificaciones automáticas a tus clientes.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Historial de clientes</span>
                    <p className="text-muted-foreground text-sm">
                      Guarda detalles importantes sobre tus clientes para personalizar el servicio.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <BarChart3 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Estadísticas y reportes</span>
                    <p className="text-muted-foreground text-sm">
                      Analiza el rendimiento de tu negocio con informes detallados.
                    </p>
                  </div>
                </li>
              </ul>
            </div>
            <div className="w-full md:flex-1 relative h-[300px] md:h-[400px] rounded-xl overflow-hidden shadow-xl">
              <Image
                src="https://place-hold.it/800x600/darkblue/white?text=Dashboard+Mockup"
                alt="Dashboard de Turnate"
                fill
                className="object-cover"
              />
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Comienza a transformar tu negocio hoy mismo</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Únete a cientos de profesionales que ya confían en Turnate
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="auth/register">
              <button className="bg-primary text-primary-foreground px-8 py-4 rounded-lg font-medium text-lg hover:bg-primary/90 transition">
                Registrarse
              </button>
            </Link>
            <Link href="/contact" id="contacto">
              <button className="border border-input px-8 py-4 rounded-lg font-medium text-lg hover:bg-muted transition">
                Contactar con ventas
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
