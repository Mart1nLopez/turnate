/**
 * Datos legales de Turnate usados en /terms y en el registro.
 * Los valores entre corchetes son placeholders del borrador: completar antes de publicar.
 * Al cambiar los Términos, actualizar TERMS_VERSION para registrar qué versión aceptó cada usuario.
 */
export const TERMS_VERSION = '2026-09-22';
export const TERMS_UPDATED_AT = '22 de septiembre de 2026';

export const LEGAL = {
  companyName: '[Razón social]',
  companyRut: '[XX.XXX.XXX-X]',
  address: '[dirección], [comuna], Región [región]',
  contactEmail: 'contacto@turnate.cl',
  supportEmail: 'soporte@turnate.cl',
  privacyEmail: 'privacidad@turnate.cl',
  pricingUrl: 'turnate.cl/precios',
  trialDays: '[X]',
  billingPeriod: '[mensual/anual]',
  priceChangeNoticeDays: '30',
  unpaidGraceDays: '[X]',
  dataExportDays: '30',
  clientCancelHours: '[X horas]',
  lateToleranceMinutes: '[X]',
  refundBusinessDays: '[X]',
  paymentProviders: '[Webpay / Mercado Pago / Flow]',
  platformFee: '[X%]',
  liabilityCapMonths: '12',
  termsChangeNoticeDays: '15',
  disputeDays: '30',
  jurisdiction: '[Santiago]',
} as const;
