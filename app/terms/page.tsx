import type { Metadata } from 'next';
import Link from 'next/link';
import { TbArrowLeft } from 'react-icons/tb';
import BasicHeader from '@/components/BasicHeader';
import BasicFooter from '@/components/BasicFooter';
import { LEGAL, TERMS_UPDATED_AT } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso',
  description: 'Términos y Condiciones de Uso de la plataforma Turnate para barberías, profesionales y clientes.',
};

const DEFINITIONS: [string, string][] = [
  ['Plataforma', 'El sitio web, la aplicación y los sistemas de Turnate.'],
  ['Barbería', 'Persona natural o jurídica que contrata Turnate para gestionar su negocio (agenda, clientes, personal, cobros).'],
  ['Profesional', 'Barbero o trabajador que la Barbería registra en la Plataforma.'],
  ['Cliente', 'Persona que reserva un servicio en una Barbería a través de Turnate.'],
  ['Usuario', 'Cualquier Barbería, Profesional o Cliente que usa la Plataforma.'],
  ['Reserva', 'Hora agendada por un Cliente para un servicio en una Barbería.'],
  ['Seña o abono', 'Pago anticipado, total o parcial, que una Barbería puede exigir para confirmar una Reserva.'],
  ['Suscripción', 'Plan pagado por la Barbería para usar Turnate.'],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-muted-foreground/60">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

function Clause({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <p>
      <strong className="font-medium text-foreground">
        {n} {title}.
      </strong>{' '}
      {children}
    </p>
  );
}

function Mail({ to }: { to: string }) {
  return (
    <a href={`mailto:${to}`} className="text-foreground underline underline-offset-4 hover:text-primary">
      {to}
    </a>
  );
}

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BasicHeader />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 sm:px-6 py-12 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <TbArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        <header className="mt-8 mb-12 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
            Términos y Condiciones de Uso
          </h1>
          <p className="text-sm text-muted-foreground">Última actualización: {TERMS_UPDATED_AT}</p>
        </header>

        <div className="space-y-12 text-[15px] leading-7 text-muted-foreground">
          <Section id="aceptacion" title="1. Identificación y aceptación">
            <p>
              La plataforma Turnate (en adelante, &ldquo;Turnate&rdquo; o &ldquo;la Plataforma&rdquo;) es operada por{' '}
              {LEGAL.companyName}, RUT {LEGAL.companyRut}, con domicilio en {LEGAL.address}, Chile, correo electrónico{' '}
              <Mail to={LEGAL.contactEmail} />.
            </p>
            <p>
              Al registrarse, reservar un turno o usar la Plataforma de cualquier forma, el usuario declara haber leído y
              aceptado estos Términos y Condiciones y la{' '}
              <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
                Política de Privacidad
              </Link>
              . Si no está de acuerdo, debe abstenerse de usar la Plataforma.
            </p>
            <p>
              Para usar Turnate se requiere ser mayor de 18 años. Los menores de edad solo podrán reservar turnos a
              través de su padre, madre o representante legal.
            </p>
          </Section>

          <Section id="definiciones" title="2. Definiciones">
            <dl className="divide-y divide-border rounded-2xl border border-border">
              {DEFINITIONS.map(([term, meaning]) => (
                <div key={term} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
                  <dt className="font-medium text-foreground">{term}</dt>
                  <dd>{meaning}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="servicio" title="3. Descripción del servicio">
            <p>
              Turnate es un software de gestión para barberías que permite administrar agenda, reservas online, clientes,
              profesionales, servicios, cobros y reportes.
            </p>
            <p>
              Turnate actúa solo como proveedor tecnológico e intermediario entre Barberías y Clientes. Turnate no presta
              servicios de barbería. Cada Barbería es la única responsable de los servicios que ofrece, sus precios, su
              calidad, el cumplimiento de sus horarios, sus permisos municipales y sanitarios, y sus obligaciones
              tributarias y laborales, incluyendo la emisión de boletas o facturas por sus servicios.
            </p>
          </Section>

          <Section id="registro" title="4. Registro y cuentas">
            <List
              items={[
                'El Usuario debe entregar información veraz, completa y actualizada al registrarse.',
                'La cuenta es personal. El Usuario es responsable de mantener la confidencialidad de su contraseña y de toda actividad realizada con ella.',
                'La Barbería es responsable de las cuentas que cree para sus Profesionales y de los permisos que les asigne.',
                'El Usuario debe avisar de inmediato a Turnate si detecta un uso no autorizado de su cuenta.',
                'Turnate puede rechazar o suspender registros con información falsa o incompleta.',
              ]}
            />
          </Section>

          <Section id="barberias" title="5. Condiciones para Barberías">
            <Clause n="5.1" title="Planes y precios">
              Los planes, sus funcionalidades y precios se publican en {LEGAL.pricingUrl}. Los precios se expresan en pesos
              chilenos e incluyen IVA, salvo que se indique otra cosa.
            </Clause>
            <Clause n="5.2" title="Período de prueba">
              Turnate puede ofrecer un período de prueba gratuito de {LEGAL.trialDays} días. Al terminar, la Suscripción
              se cobrará solo si la Barbería eligió un plan pagado.
            </Clause>
            <Clause n="5.3" title="Cobro y renovación">
              La Suscripción se paga por adelantado en forma {LEGAL.billingPeriod} y se renueva automáticamente por
              períodos iguales, salvo que la Barbería la cancele antes de la fecha de renovación. Turnate emitirá el
              documento tributario electrónico correspondiente.
            </Clause>
            <Clause n="5.4" title="Cambios de precio">
              Turnate avisará cualquier cambio de precio con al menos {LEGAL.priceChangeNoticeDays} días de anticipación.
              El nuevo precio se aplicará desde la siguiente renovación. Si la Barbería no está de acuerdo, puede cancelar
              antes de esa fecha.
            </Clause>
            <Clause n="5.5" title="Falta de pago">
              Si un cobro es rechazado, Turnate lo reintentará y avisará a la Barbería. Si la deuda no se paga dentro de{' '}
              {LEGAL.unpaidGraceDays} días, Turnate podrá suspender el acceso hasta regularizarla.
            </Clause>
            <Clause n="5.6" title="Cancelación">
              La Barbería puede cancelar su Suscripción en cualquier momento desde su panel. La cancelación tiene efecto al
              final del período pagado y no da derecho a reembolso proporcional, salvo que la ley disponga otra cosa.
            </Clause>
            <Clause n="5.7" title="Datos al terminar">
              Tras la cancelación, la Barbería tendrá {LEGAL.dataExportDays} días para exportar su información. Pasado ese
              plazo, Turnate podrá eliminarla, salvo la que deba conservar por obligación legal.
            </Clause>
            <Clause n="5.8" title="Obligaciones de la Barbería">
              La Barbería se obliga a:
            </Clause>
            <List
              items={[
                'Publicar precios, duración y condiciones de sus servicios de forma clara y veraz.',
                'Informar a sus Clientes, antes de reservar, su política de señas, cancelación e inasistencia.',
                'Respetar las Reservas confirmadas o avisar oportunamente al Cliente si debe cancelarlas.',
                'Tratar los datos de sus Clientes solo para gestionar sus servicios y conforme a la ley.',
              ]}
            />
          </Section>

          <Section id="clientes" title="6. Condiciones para Clientes">
            <Clause n="6.1" title="Reservas">
              Una Reserva queda confirmada cuando la Plataforma la muestra como confirmada y, si la Barbería exige seña,
              cuando esta se paga. El Cliente recibirá la confirmación por correo, WhatsApp u otro medio que indique.
            </Clause>
            <Clause n="6.2" title="Precios">
              El precio y la duración de cada servicio los fija la Barbería. El precio final puede variar si el Cliente
              pide servicios adicionales en el local.
            </Clause>
            <Clause n="6.3" title="Cancelación y reprogramación por el Cliente">
              El Cliente puede cancelar o reprogramar desde la Plataforma hasta {LEGAL.clientCancelHours} antes de la hora
              reservada, o dentro del plazo distinto que informe la Barbería antes de reservar.
            </Clause>
            <Clause n="6.4" title="Inasistencia y atrasos">
              Si el Cliente no se presenta o cancela fuera de plazo, la Barbería podrá retener la seña pagada, según la
              política que haya informado. Si el Cliente llega con más de {LEGAL.lateToleranceMinutes} minutos de atraso,
              la Barbería podrá acortar el servicio o tratarlo como inasistencia. Las inasistencias reiteradas pueden
              llevar a exigir seña en futuras Reservas o a bloquear la reserva online con esa Barbería.
            </Clause>
            <Clause n="6.5" title="Cancelación por la Barbería">
              Si la Barbería cancela una Reserva, el Cliente tendrá derecho a elegir entre reprogramarla o recibir la
              devolución total de lo pagado.
            </Clause>
            <Clause n="6.6" title="Reembolsos">
              Los reembolsos que correspondan se harán al mismo medio de pago usado, dentro de {LEGAL.refundBusinessDays}{' '}
              días hábiles. Los plazos de acreditación dependen del banco o emisor de la tarjeta.
            </Clause>
            <Clause n="6.7" title="Derecho de retracto">
              Conforme al artículo 3 bis letra b) de la Ley 19.496, se informa que no procede el derecho de retracto
              respecto de Reservas de servicios para una fecha y hora determinadas. Las cancelaciones se rigen por los
              puntos 6.3 a 6.6.
            </Clause>
            <Clause n="6.8" title="Reclamos sobre el servicio">
              Los reclamos por la calidad o el resultado del servicio de barbería deben dirigirse a la Barbería. Turnate
              colaborará facilitando la comunicación entre las partes.
            </Clause>
          </Section>

          <Section id="pagos" title="7. Pagos online">
            <List
              items={[
                `Los pagos se procesan a través de proveedores externos, como ${LEGAL.paymentProviders}. Turnate no almacena los datos completos de tarjetas.`,
                'El uso de estos medios de pago está sujeto además a los términos de cada proveedor.',
                `Los pagos de Clientes por señas o servicios se abonan a la Barbería, descontadas las comisiones del procesador y, si corresponde, la comisión de Turnate de ${LEGAL.platformFee} informada en el plan contratado.`,
                'La Barbería es responsable de emitir la boleta o factura al Cliente por el servicio prestado.',
                'Turnate no responde por rechazos, demoras o errores atribuibles al procesador de pagos o al banco emisor, sin perjuicio de colaborar en su solución.',
                'Los contracargos originados en una Reserva serán gestionados por la Barbería, que deberá aportar los antecedentes necesarios.',
              ]}
            />
          </Section>

          <Section id="usos-prohibidos" title="8. Usos prohibidos">
            <p>El Usuario no podrá:</p>
            <List
              items={[
                'Usar la Plataforma para fines ilícitos o contrarios a estos Términos.',
                'Hacer reservas falsas o masivas, o suplantar a otra persona.',
                'Publicar contenido ofensivo, discriminatorio, engañoso o que infrinja derechos de terceros.',
                'Intentar acceder sin autorización a cuentas, datos o sistemas de Turnate.',
                'Copiar, revender, descompilar o hacer ingeniería inversa del software.',
                'Extraer datos de forma automatizada o sobrecargar la Plataforma.',
                'Enviar publicidad no solicitada a los Clientes a través de la Plataforma sin su consentimiento.',
              ]}
            />
          </Section>

          <Section id="propiedad-intelectual" title="9. Propiedad intelectual">
            <p>
              El software, diseño, marca, logotipos y contenidos de Turnate son de propiedad de {LEGAL.companyName} o de
              sus licenciantes. El uso de la Plataforma no transfiere ningún derecho sobre ellos, salvo una licencia
              limitada, no exclusiva e intransferible para usarla mientras la cuenta esté vigente.
            </p>
            <p>
              La Barbería conserva la propiedad de su contenido (logo, fotos, descripciones, precios). Al subirlo,
              autoriza a Turnate a mostrarlo en la Plataforma solo para prestar el servicio. La Barbería declara tener los
              derechos necesarios sobre ese contenido.
            </p>
          </Section>

          <Section id="datos-personales" title="10. Datos personales">
            <p>
              Turnate trata los datos personales conforme a la Ley 19.628 sobre protección de la vida privada y a la Ley
              21.719, que la modifica. El detalle está en la{' '}
              <Link href="/privacy" className="text-foreground underline underline-offset-4 hover:text-primary">
                Política de Privacidad
              </Link>
              , que forma parte de estos Términos.
            </p>
            <List
              items={[
                <>
                  <strong className="font-medium text-foreground">Roles.</strong> Respecto de los datos de sus Clientes, la
                  Barbería es responsable del tratamiento y Turnate actúa como encargado, tratándolos solo por cuenta de la
                  Barbería. Respecto de los datos de cuenta de las Barberías y del uso de la Plataforma, Turnate es
                  responsable.
                </>,
                <>
                  <strong className="font-medium text-foreground">Datos tratados.</strong> Nombre, teléfono, correo,
                  historial de Reservas, servicios, pagos y preferencias informadas por el Cliente.
                </>,
                <>
                  <strong className="font-medium text-foreground">Finalidades.</strong> Gestionar Reservas, enviar
                  confirmaciones y recordatorios, procesar pagos, dar soporte y mejorar la Plataforma. El envío de
                  promociones requiere consentimiento expreso y puede revocarse en cualquier momento.
                </>,
                <>
                  <strong className="font-medium text-foreground">Terceros.</strong> Los datos se comparten solo con la
                  Barbería donde se reserva y con proveedores necesarios para operar (hosting, pagos, mensajería), que
                  pueden estar fuera de Chile y quedan obligados a protegerlos.
                </>,
                <>
                  <strong className="font-medium text-foreground">Seguridad.</strong> Turnate aplica medidas técnicas y
                  organizativas razonables, como cifrado en tránsito y control de accesos.
                </>,
                <>
                  <strong className="font-medium text-foreground">Derechos.</strong> El titular puede ejercer sus derechos
                  de acceso, rectificación, supresión, oposición, portabilidad y bloqueo escribiendo a{' '}
                  <Mail to={LEGAL.privacyEmail} />.
                </>,
              ]}
            />
          </Section>

          <Section id="responsabilidad" title="11. Disponibilidad y responsabilidad">
            <p>
              Turnate procura que la Plataforma esté disponible de forma continua, pero puede haber interrupciones por
              mantenciones, fallas de terceros o fuerza mayor. Las mantenciones programadas se avisarán con anticipación
              cuando sea posible.
            </p>
            <p>En la medida que la ley lo permita, Turnate no responde por:</p>
            <List
              items={[
                'La calidad, resultado, precio o cumplimiento de los servicios de las Barberías.',
                'Daños por uso indebido de la cuenta atribuible al Usuario.',
                'Fallas de internet, dispositivos del Usuario o servicios de terceros.',
                'Lucro cesante o daños indirectos de las Barberías.',
              ]}
            />
            <p>
              Frente a una Barbería, la responsabilidad total de Turnate se limita al monto pagado por la Suscripción en
              los {LEGAL.liabilityCapMonths} meses anteriores al hecho. Nada de lo anterior limita los derechos
              irrenunciables de los consumidores bajo la Ley 19.496.
            </p>
          </Section>

          <Section id="suspension" title="12. Suspensión y término">
            <p>
              Turnate podrá suspender o cerrar una cuenta si el Usuario infringe estos Términos, entrega información
              falsa, no paga la Suscripción o pone en riesgo la seguridad de la Plataforma o de otros Usuarios. Salvo
              casos graves o urgentes, Turnate avisará antes y dará un plazo para corregir la situación.
            </p>
            <p>
              El Usuario puede cerrar su cuenta en cualquier momento desde la configuración o escribiendo a{' '}
              <Mail to={LEGAL.supportEmail} />.
            </p>
          </Section>

          <Section id="modificaciones" title="13. Modificaciones">
            <p>
              Turnate puede modificar estos Términos. Los cambios relevantes se avisarán por correo o en la Plataforma con
              al menos {LEGAL.termsChangeNoticeDays} días de anticipación. Si el Usuario sigue usando la Plataforma
              después de esa fecha, se entenderá que acepta los cambios; si no está de acuerdo, puede cerrar su cuenta.
            </p>
          </Section>

          <Section id="ley-aplicable" title="14. Ley aplicable y conflictos">
            <p>Estos Términos se rigen por las leyes de la República de Chile.</p>
            <p>
              <strong className="font-medium text-foreground">Consumidores.</strong> Los Clientes, y las Barberías que
              sean micro o pequeñas empresas en lo que les aplique la Ley 20.416, conservan todos los derechos de la Ley
              19.496. Pueden reclamar ante el Servicio Nacional del Consumidor (SERNAC) o ante el Juzgado de Policía Local
              de su domicilio.
            </p>
            <p>
              <strong className="font-medium text-foreground">Otras controversias.</strong> Las partes intentarán primero
              resolverlas de buena fe, escribiendo a <Mail to={LEGAL.contactEmail} />. De no llegar a acuerdo en{' '}
              {LEGAL.disputeDays} días, serán competentes los tribunales ordinarios de {LEGAL.jurisdiction}.
            </p>
          </Section>

          <Section id="contacto" title="15. Contacto">
            <p>
              Soporte y consultas: <Mail to={LEGAL.supportEmail} />
            </p>
          </Section>
        </div>
      </main>

      <BasicFooter />
    </div>
  );
}
