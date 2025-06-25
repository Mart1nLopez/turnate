import Link from 'next/link';
import { TbArrowLeft } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BasicHeader />

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          {/* Back button */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="outline" size="sm">
                <TbArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Contacto</h1>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Información de contacto */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">¿Cómo podemos ayudarte?</h2>

              <p className="text-gray-700 leading-relaxed mb-8">
                Estamos aquí para ayudarte. Si tienes preguntas sobre Turnate, necesitas soporte técnico o quieres
                conocer más sobre nuestros servicios, no dudes en contactarnos.
              </p>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">contact@turnate.cl</p>
                    <p className="text-sm text-gray-500 mt-1">Responderemos en un plazo de 24 horas</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Ubicación</h3>
                    <p className="text-gray-600">Santiago, Chile</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horario de Atención</h3>
                    <p className="text-gray-600">Lunes a Viernes: 9:00 - 18:00</p>
                    <p className="text-gray-600">Sábados: 10:00 - 14:00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de contacto */}
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Envíanos un mensaje</h2>

              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Asunto *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecciona un tema</option>
                    <option value="soporte">Soporte Técnico</option>
                    <option value="ventas">Información de Ventas</option>
                    <option value="cuenta">Problemas con mi Cuenta</option>
                    <option value="sugerencia">Sugerencia</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                    placeholder="Cuéntanos en qué podemos ayudarte..."
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    required
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                    Acepto la{' '}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                      Política de Privacidad
                    </Link>{' '}
                    *
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium">
                  Enviar Mensaje
                </button>
              </form>

              <p className="text-sm text-gray-500 mt-4">* Campos obligatorios</p>
            </div>
          </div>

          {/* Sección de preguntas frecuentes */}
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">Preguntas Frecuentes</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Cómo puedo crear mi página profesional?</h3>
                <p className="text-gray-600 text-sm">
                  Regístrate en nuestro sitio, completa tu perfil y configura tus servicios. En minutos tendrás tu
                  página lista para recibir clientes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Hay algún costo por usar Turnate?</h3>
                <p className="text-gray-600 text-sm">
                  Contáctanos para conocer nuestros planes y encontrar la opción que mejor se adapte a tu negocio.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Cómo funciona el sistema de pagos?</h3>
                <p className="text-gray-600 text-sm">
                  Los pagos se manejan directamente entre tú y tus clientes. Turnate facilita la coordinación pero no
                  procesa pagos automáticamente.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">¿Puedo cancelar mi cuenta en cualquier momento?</h3>
                <p className="text-gray-600 text-sm">
                  Sí, puedes cancelar tu cuenta desde la configuración de tu dashboard o contactándonos directamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BasicFooter />
    </div>
  );
}
