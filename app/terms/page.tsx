import Link from 'next/link';
import { TbArrowLeft } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';

export default function TermsPage() {
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

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Términos de Servicio</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Última actualización:</strong> 25 de junio de 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Aceptación de los Términos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Al acceder y utilizar Turnate (&ldquo;el Servicio&rdquo;), usted acepta cumplir y estar sujeto a estos
                Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestro
                servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Descripción del Servicio</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Turnate es una plataforma que permite a profesionales gestionar sus citas y a clientes agendar servicios
                de manera fácil y eficiente. El servicio incluye:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Sistema de agendamiento de citas</li>
                <li>Gestión de servicios y precios</li>
                <li>Dashboard para profesionales</li>
                <li>Páginas públicas personalizables</li>
                <li>Sistema de reseñas y calificaciones</li>
                <li>Notificaciones por email</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Registro y Cuentas de Usuario</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Para utilizar ciertos aspectos del Servicio, debe crear una cuenta. Al registrarse, se compromete a:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Proporcionar información veraz, precisa y completa</li>
                <li>Mantener actualizada su información de cuenta</li>
                <li>Proteger la confidencialidad de su contraseña</li>
                <li>Ser responsable de todas las actividades que ocurran bajo su cuenta</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Uso Aceptable</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Usted se compromete a utilizar el Servicio únicamente para fines legítimos y de acuerdo con estos
                términos. Está prohibido:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Usar el servicio para actividades ilegales o fraudulentas</li>
                <li>Interferir con el funcionamiento del servicio</li>
                <li>Intentar acceder a cuentas de otros usuarios</li>
                <li>Transmitir contenido ofensivo, difamatorio o inapropiado</li>
                <li>Violar los derechos de propiedad intelectual</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Responsabilidades del Profesional</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Los profesionales que utilizan Turnate son responsables de:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Mantener información precisa sobre sus servicios y precios</li>
                <li>Cumplir con las citas agendadas o cancelar con tiempo suficiente</li>
                <li>Proporcionar servicios de calidad según lo anunciado</li>
                <li>Responder de manera profesional a los clientes</li>
                <li>Cumplir con todas las regulaciones aplicables a su profesión</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Políticas de Cancelación</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Las políticas de cancelación son establecidas por cada profesional. Los clientes deben revisar y cumplir
                con estas políticas. Turnate no es responsable por disputas relacionadas con cancelaciones entre
                profesionales y clientes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Pagos y Facturación</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Los pagos por servicios se procesan directamente entre el profesional y el cliente. Turnate puede
                facilitar el procesamiento de pagos a través de terceros, pero no es responsable de disputas
                relacionadas con pagos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacidad y Datos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                El manejo de sus datos personales se rige por nuestra{' '}
                <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                  Política de Privacidad
                </Link>
                , que forma parte integral de estos términos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitación de Responsabilidad</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Turnate actúa como intermediario entre profesionales y clientes. No somos responsables por:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>La calidad de los servicios proporcionados por profesionales</li>
                <li>Disputas entre profesionales y clientes</li>
                <li>Pérdidas o daños derivados del uso del servicio</li>
                <li>Interrupciones temporales del servicio</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Propiedad Intelectual</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Todos los derechos de propiedad intelectual del servicio Turnate, incluyendo diseño, código, marcas y
                contenido, pertenecen a nosotros o nuestros licenciantes. Los usuarios conservan los derechos sobre el
                contenido que suben al servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modificaciones del Servicio</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nos reservamos el derecho de modificar, suspender o discontinuar el servicio en cualquier momento.
                También podemos actualizar estos términos ocasionalmente. Los cambios significativos serán notificados a
                los usuarios.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Terminación</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Podemos suspender o terminar su acceso al servicio si viola estos términos. Usted puede cancelar su
                cuenta en cualquier momento. Al terminar la cuenta, algunos datos pueden conservarse según nuestra
                política de privacidad.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Ley Aplicable</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Estos términos se rigen por las leyes de Chile. Cualquier disputa será resuelta en los tribunales
                competentes de Chile.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contacto</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Si tiene preguntas sobre estos términos, puede contactarnos a través de nuestra{' '}
                <Link href="/contact" className="text-blue-600 hover:text-blue-700 underline">
                  página de contacto
                </Link>{' '}
                o directamente en:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> contact@turnate.cl
                </p>
                <p className="text-gray-700">
                  <strong>Sitio web:</strong> www.turnate.cl
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <BasicFooter />
    </div>
  );
}
