import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// --- Interfaces ---

interface ClientConfirmationEmailProps {
  clientName: string;
  professionalName: string;
  service: string;
  date: string;
  time: string;
  cancelUrl: string;
  clientPhone: string;
}

interface ProfessionalNotificationEmailProps {
  professionalName: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
}

interface CancelledByProEmailProps {
  clientName: string;
  professionalName: string;
  service: string;
  date: string;
  time: string;
}

interface CancelledByClientEmailProps {
  clientName: string;
  professionalName: string;
  service: string;
  date: string;
  time: string;
}

interface ClientCancelledNotificationEmailProps {
  professionalName: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  clientEmail: string;
}

interface ReviewRequestEmailProps {
  clientName: string;
  professionalName: string;
  service: string;
  date: string;
  time: string;
  reviewUrl: string;
}

// --- Shared Styles ---

const main = {
  backgroundColor: '#f3f4f6',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '16px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  maxWidth: '600px',
};

const content = {
  padding: '0 48px',
};

const headerLogo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#111827',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const sectionBox = {
  padding: '24px',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  marginTop: '20px',
  marginBottom: '20px',
};

const paragraph = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  textAlign: 'left' as const,
};

const label = {
  color: '#64748b',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  marginBottom: '4px',
  display: 'block',
};

const value = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: '500',
  display: 'block',
};

const buttonPrimary = {
  backgroundColor: '#4f46e5', // Indigo 600
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
};

const buttonDanger = {
  ...buttonPrimary,
  backgroundColor: '#e11d48', // Rose 600
  boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.2)',
};

const footer = {
  color: '#94a3b8',
  fontSize: '12px',
  textAlign: 'center' as const,
  marginTop: '40px',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '30px 0',
};

// --- Components ---

const Logo = () => (
  <Section>
    <Text style={headerLogo}>Turnate</Text>
  </Section>
);

const InfoRow = ({ labelText, valueText }: { labelText: string; valueText: string }) => (
  <div style={{ marginBottom: '16px' }}>
    <Text style={{ ...label, marginBottom: '4px' }}>{labelText}</Text>
    <Text style={{ ...value, marginBottom: '0' }}>{valueText}</Text>
  </div>
);

// --- 1. Confirmación para el Cliente ---
export const ClientConfirmationEmail = ({
  clientName,
  professionalName,
  service,
  date,
  time,
  cancelUrl,
  clientPhone,
}: ClientConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Tu cita ha sido confirmada: {service}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Section style={content}>
          <Heading
            style={{
              color: '#4f46e5',
              fontSize: '28px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '20px 0',
            }}>
            ¡Cita Confirmada!
          </Heading>

          <Text style={paragraph}>
            Hola <strong>{clientName}</strong>,
          </Text>
          <Text style={paragraph}>
            Tu cita con <strong>{professionalName}</strong> está lista. Aquí tienes todos los detalles:
          </Text>

          <Section style={sectionBox}>
            <InfoRow labelText="Servicio" valueText={service} />
            <InfoRow labelText="Profesional" valueText={professionalName} />
            <InfoRow labelText="Fecha" valueText={date} />
            <InfoRow labelText="Hora" valueText={time} />
            <InfoRow labelText="Teléfono de contacto" valueText={clientPhone} />
          </Section>

          <Section
            style={{
              backgroundColor: '#fff7ed',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #fed7aa',
              marginBottom: '24px',
            }}>
            <Text style={{ margin: '0', fontWeight: 'bold', color: '#9a3412', fontSize: '16px' }}>
              ⚠️ Información Importante
            </Text>
            <ul style={{ margin: '12px 0 0', paddingLeft: '20px', color: '#9a3412' }}>
              <li style={{ marginBottom: '8px' }}>Por favor llega 10 minutos antes de tu cita.</li>
              <li>Trae una identificación válida o este correo.</li>
            </ul>
          </Section>

          <Text style={{ ...paragraph, textAlign: 'center', marginBottom: '16px' }}>
            ¿Necesitas cancelar o reagendar?
          </Text>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href={cancelUrl} style={buttonDanger}>
              Cancelar Cita
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Este es un mensaje automático de Turnate. Por favor no respondas a este correo.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- 2. Notificación para el Profesional (Nueva Cita) ---
export const ProfessionalNotificationEmail = ({
  professionalName,
  clientName,
  clientEmail,
  clientPhone,
  service,
  date,
  time,
}: ProfessionalNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Nueva Cita Agendada: {clientName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Section style={content}>
          <Heading
            style={{
              color: '#059669',
              fontSize: '28px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '20px 0',
            }}>
            Nueva Cita Agendada
          </Heading>

          <Text style={paragraph}>
            Hola <strong>{professionalName}</strong>,
          </Text>
          <Text style={paragraph}>¡Buenas noticias! Tienes una nueva cita agendada.</Text>

          <Section style={sectionBox}>
            <Text style={{ ...label, color: '#059669', marginBottom: '16px', fontSize: '12px' }}>
              DETALLES DE LA SESIÓN
            </Text>
            <InfoRow labelText="Servicio" valueText={service} />
            <InfoRow labelText="Fecha y Hora" valueText={`${date} a las ${time}`} />

            <Hr style={{ borderColor: '#cbd5e1', margin: '20px 0' }} />

            <Text style={{ ...label, color: '#059669', marginBottom: '16px', fontSize: '12px' }}>
              DATOS DEL CLIENTE
            </Text>
            <InfoRow labelText="Nombre" valueText={clientName} />
            <InfoRow labelText="Email" valueText={clientEmail} />
            <InfoRow labelText="Teléfono" valueText={clientPhone} />
          </Section>

          <Section
            style={{
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #bfdbfe',
              marginBottom: '24px',
            }}>
            <Text style={{ margin: '0', fontWeight: 'bold', color: '#1e40af', fontSize: '16px' }}>💡 Recordatorio</Text>
            <ul style={{ margin: '12px 0 0', paddingLeft: '20px', color: '#1e40af' }}>
              <li style={{ marginBottom: '8px' }}>Revisa tu dashboard para más detalles.</li>
              <li>Contacta al cliente si necesitas confirmar algún detalle específico.</li>
            </ul>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href="https://turnate.cl/dashboard" style={buttonPrimary}>
              Ir al Dashboard
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Turnate - Gestión de Citas</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- 3. Cancelación por Profesional (Al Cliente) ---
export const CancelledByProEmail = ({
  clientName,
  professionalName,
  service,
  date,
  time,
}: CancelledByProEmailProps) => (
  <Html>
    <Head />
    <Preview>Cita Cancelada: {service}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Section style={content}>
          <Heading
            style={{
              color: '#dc2626',
              fontSize: '28px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '20px 0',
            }}>
            Cita Cancelada
          </Heading>

          <Text style={paragraph}>
            Hola <strong>{clientName}</strong>,
          </Text>
          <Text style={paragraph}>
            Lamentamos informarte que tu cita con <strong>{professionalName}</strong> ha sido cancelada por el
            profesional.
          </Text>

          <Section style={{ ...sectionBox, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <Text style={{ ...label, color: '#b91c1c' }}>CITA AFECTADA</Text>
            <Text style={{ ...value, color: '#7f1d1d', fontSize: '18px' }}>{service}</Text>
            <Text style={{ ...value, color: '#7f1d1d' }}>
              {date} a las {time}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px',
            }}>
            <Text style={{ margin: '0', fontWeight: 'bold', color: '#111827', fontSize: '16px' }}>
              ¿Qué puedes hacer ahora?
            </Text>
            <ul style={{ margin: '12px 0 0', paddingLeft: '20px', color: '#4b5563' }}>
              <li style={{ marginBottom: '8px' }}>Reagenda tu cita en la plataforma cuando lo desees.</li>
              <li>Si tienes dudas, contáctanos o al profesional.</li>
            </ul>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href="https://turnate.cl" style={buttonPrimary}>
              Reagendar Cita
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Sentimos los inconvenientes. ¡Esperamos verte pronto!</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- 4. Cancelación por Cliente (Al Cliente - Confirmación) ---
export const CancelledByClientEmail = ({
  clientName,
  professionalName,
  service,
  date,
  time,
}: CancelledByClientEmailProps) => (
  <Html>
    <Head />
    <Preview>Cancelación Confirmada</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Section style={content}>
          <Heading
            style={{
              color: '#4b5563',
              fontSize: '28px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '20px 0',
            }}>
            Cancelación Confirmada
          </Heading>

          <Text style={paragraph}>
            Hola <strong>{clientName}</strong>,
          </Text>
          <Text style={paragraph}>Tu cita ha sido cancelada exitosamente tal como lo solicitaste.</Text>

          <Section style={sectionBox}>
            <InfoRow labelText="Servicio Cancelado" valueText={service} />
            <InfoRow labelText="Profesional" valueText={professionalName} />
            <InfoRow labelText="Fecha Original" valueText={`${date} a las ${time}`} />
          </Section>

          <Section
            style={{
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #bbf7d0',
              marginBottom: '24px',
            }}>
            <Text style={{ margin: '0', fontWeight: 'bold', color: '#15803d', fontSize: '16px' }}>
              ¿Listo para volver?
            </Text>
            <Text style={{ margin: '8px 0 0', color: '#166534' }}>
              Puedes agendar una nueva cita cuando estés listo.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href="https://turnate.cl" style={buttonPrimary}>
              Agendar Nueva Cita
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Turnate - Gestión de Citas</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- 5. Notificación de Cancelación (Al Profesional) ---
export const ClientCancelledNotificationEmail = ({
  professionalName,
  clientName,
  service,
  date,
  time,
  clientEmail,
}: ClientCancelledNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Cita Cancelada por Cliente</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Section style={content}>
          <Heading
            style={{
              color: '#dc2626',
              fontSize: '24px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '20px 0',
            }}>
            Un cliente ha cancelado
          </Heading>

          <Text style={paragraph}>
            Hola <strong>{professionalName}</strong>,
          </Text>
          <Text style={paragraph}>
            Te informamos que el cliente <strong>{clientName}</strong> ha cancelado su cita.
          </Text>

          <Section style={{ ...sectionBox, borderLeft: '4px solid #dc2626' }}>
            <InfoRow labelText="Servicio" valueText={service} />
            <InfoRow labelText="Fecha y Hora" valueText={`${date} a las ${time}`} />
            <InfoRow labelText="Cliente" valueText={clientName} />
            <InfoRow labelText="Email" valueText={clientEmail} />
          </Section>

          <Section
            style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #e2e8f0',
              marginBottom: '24px',
            }}>
            <Text style={{ margin: '0', fontWeight: 'bold', color: '#334155', fontSize: '16px' }}>
              Estado del Horario
            </Text>
            <Text style={{ margin: '8px 0 0', color: '#475569' }}>
              Este horario ha quedado liberado y está disponible para nuevas reservas.
            </Text>
          </Section>

          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button href="https://turnate.cl/dashboard" style={buttonPrimary}>
              Ver mi Agenda
            </Button>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>Turnate - Notificaciones</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

// --- 6. Solicitud de Reseña ---
export const ReviewRequestEmail = ({
  clientName,
  professionalName,
  service,
  date,
  time,
  reviewUrl,
}: ReviewRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>¿Qué tal estuvo tu cita con {professionalName}?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Logo />
        <Section style={content}>
          <Heading
            style={{
              color: '#4f46e5',
              fontSize: '28px',
              fontWeight: '800',
              textAlign: 'center',
              margin: '20px 0',
            }}>
            ¡Gracias por tu visita!
          </Heading>

          <Text style={paragraph}>
            Hola <strong>{clientName}</strong>,
          </Text>
          <Text style={paragraph}>
            Esperamos que hayas tenido una excelente experiencia con <strong>{professionalName}</strong>.
          </Text>

          <Section style={sectionBox}>
            <Text style={{ ...label, marginBottom: '16px', textAlign: 'center' }}>RESUMEN DE TU CITA</Text>
            <Text style={{ ...value, textAlign: 'center', fontSize: '18px', marginBottom: '8px' }}>{service}</Text>
            <Text style={{ ...value, textAlign: 'center', fontWeight: '400', color: '#64748b' }}>
              {date} a las {time}
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: '#eff6ff',
              borderRadius: '12px',
              padding: '32px 20px',
              border: '1px solid #bfdbfe',
              textAlign: 'center',
              marginBottom: '24px',
            }}>
            <Heading
              as="h3"
              style={{
                color: '#1e40af',
                fontSize: '20px',
                fontWeight: 'bold',
                margin: '0 0 12px',
              }}>
              ¡Tu opinión es muy importante!
            </Heading>
            <Text style={{ color: '#1e40af', marginBottom: '24px' }}>
              Ayúdanos a mejorar y comparte tu experiencia con otros clientes.
            </Text>

            <Button href={reviewUrl} style={buttonPrimary}>
              ⭐⭐⭐⭐⭐ Dejar mi Reseña
            </Button>

            <Text style={{ fontSize: '13px', color: '#60a5fa', marginTop: '16px' }}>Solo te tomará un minuto</Text>
          </Section>

          <Section style={{ textAlign: 'center' }}>
            <Text style={{ ...paragraph, textAlign: 'center', fontSize: '14px' }}>¿Necesitas otra cita?</Text>
            <Link href="https://turnate.cl" style={{ color: '#4f46e5', fontWeight: '600' }}>
              Agendar de nuevo
            </Link>
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            Gracias por confiar en nosotros.
            <br />
            Saludos, {professionalName}
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);
