'use server';

import { Resend } from 'resend';
import {
  ClientConfirmationEmail,
  ProfessionalNotificationEmail,
  CancelledByProEmail,
  CancelledByClientEmail,
  ClientCancelledNotificationEmail,
  ReviewRequestEmail,
} from '@/components/emails/templates';

// Inicializar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'info@turnate.cl';

// Tipos de datos (basados en lo que enviabas a GAS)
interface EmailData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  professionalName: string;
  professionalEmail: string;
  service: string;
  date: string; // YYYY-MM-DD
  time: string;

  cancellationToken?: string;
  reviewToken?: string;
}

// Función auxiliar para formatear fecha
const formatDate = (dateString: string) => {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};

// Confirmar Cita (Cliente + Profesional)
export async function sendAppointmentConfirmation(data: EmailData) {
  const formattedDate = formatDate(data.date);
  const cancelUrl = `turnate.cl/cancel/${data.cancellationToken}`;

  try {
    console.log('Enviando correo de confirmación al cliente:', data.clientEmail);
    // Enviar al Cliente
    const clientEmailReq = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Confirmación de Cita - ${data.service}`,
      react: ClientConfirmationEmail({
        clientName: data.clientName,
        professionalName: data.professionalName,
        service: data.service,
        date: formattedDate,
        time: data.time,
        cancelUrl: cancelUrl,
        clientPhone: data.clientPhone || 'No especificado',
      }),
    });
    console.log('Resultado envío cliente:', clientEmailReq);

    console.log('Enviando notificación al profesional:', data.professionalEmail);
    // Enviar al Profesional
    const proEmailReq = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.professionalEmail],
      subject: `Nueva Cita Agendada - ${data.service}`,
      react: ProfessionalNotificationEmail({
        professionalName: data.professionalName,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone || 'No especificado',
        service: data.service,
        date: formattedDate,
        time: data.time,
      }),
    });
    console.log('Resultado envío profesional:', proEmailReq);

    if (clientEmailReq.error || proEmailReq.error) {
      console.error('Error detallado Resend cliente:', clientEmailReq.error);
      console.error('Error detallado Resend profesional:', proEmailReq.error);
      return { success: false, error: 'Error enviando emails' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error en sendAppointmentConfirmation:', error);
    return { success: false, error };
  }
}

// Cancelar por Profesional (Solo al cliente)
export async function sendCancellationByProfessional(data: EmailData) {
  const formattedDate = formatDate(data.date);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Cancelación de Cita - ${data.service}`,
      react: CancelledByProEmail({
        clientName: data.clientName,
        professionalName: data.professionalName,
        service: data.service,
        date: formattedDate,
        time: data.time,
      }),
    });

    if (error) return { success: false, error };
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Cancelar por Cliente (Cliente + Profesional)
export async function sendCancellationByClient(data: EmailData) {
  const formattedDate = formatDate(data.date);

  try {
    // Confirmar al cliente
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Haz cancelado tu cita - ${data.service}`,
      react: CancelledByClientEmail({
        clientName: data.clientName,
        professionalName: data.professionalName,
        service: data.service,
        date: formattedDate,
        time: data.time,
      }),
    });

    // Avisar al profesional
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.professionalEmail],
      subject: `Cita Cancelada por Cliente - ${data.service}`,
      react: ClientCancelledNotificationEmail({
        professionalName: data.professionalName,
        clientName: data.clientName,
        service: data.service,
        date: formattedDate,
        time: data.time,
        clientEmail: data.clientEmail,
      }),
    });

    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

// Solicitar Reseña
export async function sendReviewRequest(data: EmailData) {
  const formattedDate = formatDate(data.date);
  const reviewUrl = `turnate.cl/review/${data.reviewToken}`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.clientEmail],
      subject: `Gracias por tu visita - ${data.service}`,
      react: ReviewRequestEmail({
        clientName: data.clientName,
        professionalName: data.professionalName,
        service: data.service,
        date: formattedDate,
        time: data.time,
        reviewUrl: reviewUrl,
      }),
    });

    if (error) return { success: false, error };
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}
