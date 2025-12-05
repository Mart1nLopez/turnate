import Link from 'next/link';
import { TbArrowLeft } from 'react-icons/tb';
import { Button } from '@/components/ui/button';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';

export default function PrivacyPage() {
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

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Última actualización:</strong> 05 de diciembre de 2025
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introducción</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                En Turnate, valoramos y respetamos su privacidad. Esta Política de Privacidad describe cómo recopilamos,
                utilizamos, almacenamos y protegemos su información personal cuando utiliza nuestro servicio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Información que Recopilamos</h2>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Información Personal</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Recopilamos la siguiente información personal cuando usted:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Se registra como profesional:</strong> nombre, RUT, email, teléfono, información profesional
                </li>
                <li>
                  <strong>Agenda una cita:</strong> nombre, email, teléfono
                </li>
                <li>
                  <strong>Deja una reseña:</strong> nombre, calificación, comentarios
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Información Técnica</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Dirección IP</li>
                <li>Tipo de navegador y dispositivo</li>
                <li>Páginas visitadas y tiempo de permanencia</li>
                <li>Cookies y tecnologías similares</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Datos de Google (Google User Data)</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                Si decide conectar su cuenta de Google Calendar, nuestra aplicación accederá a cierta información de su cuenta de Google.
                De acuerdo con los requisitos de la Política de Datos de Usuario de los Servicios API de Google, divulgamos lo siguiente:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Acceso:</strong> Solicitamos acceso para &quot;ver, editar, compartir y eliminar permanentemente todos los calendarios a los que puede acceder a través de Google Calendar&quot;.
                  Específicamente, creamos un calendario específico y creamos eventos en el calendario para sincronizar sus citas.
                </li>
                <li>
                  <strong>Uso:</strong> Utilizamos esta información <strong>únicamente</strong> para:
                  <ul className="list-disc pl-6">
                    <li>Añadir y eliminar automáticamente las citas agendadas a través de Turnate a su Google Calendar.</li>
                  </ul>
                  No utilizamos sus datos de Google para fines publicitarios ni para entrenar modelos de inteligencia artificial.
                </li>
                <li>
                  <strong>Almacenamiento:</strong> Almacenamos de forma segura los tokens de acceso y actualización necesarios para mantener la conexión.
                  No almacenamos el contenido de sus eventos personales de Google Calendar en nuestros servidores, salvo la información necesaria para la sincronización de citas creadas por Turnate.
                </li>
                <li>
                  <strong>Compartir:</strong> No compartimos, transferimos ni divulgamos sus datos de usuario de Google a terceros, excepto cuando sea necesario para proporcionar o mejorar la funcionalidad de la aplicación (como se describe en la sección &quot;Compartir Información&quot;) o según lo requiera la ley.
                  No vendemos sus datos de usuario de Google.
                </li>
              </ul>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Cumplimiento de Uso Limitado:</strong> El uso y la transferencia a cualquier otra aplicación de la información recibida de las API de Google cumplirán con la{' '}
                  <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                    Política de Datos de Usuario de los Servicios API de Google
                  </a>
                  , incluidos los requisitos de Uso Limitado.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Cómo Utilizamos su Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Utilizamos su información personal para:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Proporcionar y mantener nuestro servicio</li>
                <li>Gestionar citas y comunicaciones entre profesionales y clientes</li>
                <li>Enviar confirmaciones, recordatorios y notificaciones</li>
                <li>Mejorar la experiencia del usuario</li>
                <li>Cumplir con obligaciones legales</li>
                <li>Prevenir fraudes y actividades maliciosas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Compartir Información</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                No vendemos ni alquilamos su información personal. Podemos compartir información en las siguientes
                circunstancias:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Entre usuarios:</strong> información necesaria para coordinar citas
                </li>
                <li>
                  <strong>Proveedores de servicios:</strong> para procesamiento de pagos, envío de emails
                </li>
                <li>
                  <strong>Requerimientos legales:</strong> cuando sea requerido por ley
                </li>
                <li>
                  <strong>Protección de derechos:</strong> para proteger nuestros derechos o los de otros usuarios
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Seguridad de Datos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Implementamos medidas de seguridad técnicas y organizacionales para proteger su información:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encriptación de datos en tránsito y en reposo</li>
                <li>Autenticación segura</li>
                <li>Acceso restringido a datos personales</li>
                <li>Monitoreo regular de seguridad</li>
                <li>Respaldos seguros de datos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Retención de Datos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Conservamos su información personal durante el tiempo necesario para cumplir con los propósitos
                descritos en esta política:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Cuentas activas:</strong> mientras mantenga su cuenta
                </li>
                <li>
                  <strong>Historial de citas:</strong> 3 años para fines de servicio al cliente
                </li>
                <li>
                  <strong>Datos financieros:</strong> según requerimientos legales (hasta 7 años)
                </li>
                <li>
                  <strong>Datos de marketing:</strong> hasta que retire su consentimiento
                </li>
                <li>
                  <strong>Datos de Google Calendar:</strong> Si desconecta su cuenta de Google Calendar, eliminaremos los tokens de acceso asociados de nuestros sistemas.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Sus Derechos</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Usted tiene los siguientes derechos respecto a su información personal:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>
                  <strong>Acceso:</strong> solicitar una copia de su información personal
                </li>
                <li>
                  <strong>Corrección:</strong> corregir información inexacta o incompleta
                </li>
                <li>
                  <strong>Eliminación:</strong> solicitar la eliminación de su información
                </li>
                <li>
                  <strong>Portabilidad:</strong> recibir su información en formato estructurado
                </li>
                <li>
                  <strong>Oposición:</strong> oponerse al procesamiento de su información
                </li>
                <li>
                  <strong>Limitación:</strong> restringir el procesamiento de su información
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies y Tecnologías Similares</h2>
              <p className="text-gray-700 leading-relaxed mb-4">Utilizamos cookies y tecnologías similares para:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Mantener su sesión iniciada</li>
                <li>Recordar sus preferencias</li>
                <li>Analizar el uso del sitio</li>
                <li>Mejorar la funcionalidad</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mb-4">
                Puede gestionar las cookies a través de la configuración de su navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Transferencias Internacionales</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Sus datos pueden ser procesados en servidores ubicados fuera de Chile. Garantizamos que estas
                transferencias cumplen con estándares de protección adecuados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Menores de Edad</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nuestro servicio no está dirigido a menores de 18 años. No recopilamos conscientemente información
                personal de menores sin el consentimiento de los padres.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Cambios en esta Política</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Podemos actualizar esta política ocasionalmente. Los cambios significativos serán notificados a través
                de email o mediante avisos en nuestro sitio web.
              </p>
            </section>
          </div>
        </div>
      </main>

      <BasicFooter />
    </div>
  );
}
