/**
 * Valida un número de teléfono según su formato y país
 */

// Tipos para la configuración de la validación
export interface PhoneValidationConfig {
  requiredLength: number;
  countryCode: string;
}

// Configuraciones por país
export const PHONE_CONFIGS: Record<string, PhoneValidationConfig> = {
  CL: {
    requiredLength: 8,
    countryCode: '+56',
  },
  // Aquí se pueden agregar más países en el futuro
};

// Información por país (para mostrar)
export interface CountryInfo {
  code: string;
  flag: string;
  name: string;
  dialCode: string;
  format: string;
}

export const COUNTRIES: Record<string, CountryInfo> = {
  CL: {
    code: 'CL',
    flag: '🇨🇱',
    name: 'Chile',
    dialCode: '+56',
    format: '+56 9 XXXXXXXX',
  },
  // Aquí se pueden agregar más países dps
};

/**
 * Valida un número de teléfono móvil chileno (8 dígitos)
 * @param phone - Número de teléfono (solo la parte numérica sin prefijo)
 * @param countryCode - Código de país (por defecto CL para Chile)
 * @returns Un objeto con el estado de validación y mensaje si hay error
 */
export function validatePhone(phone: string, countryCode: string = 'CL'): { isValid: boolean; message?: string } {
  const config = PHONE_CONFIGS[countryCode];

  if (!config) {
    return { isValid: false, message: 'País no soportado' };
  }

  // Eliminar espacios y verificar que solo contenga dígitos
  const cleanPhone = phone.trim().replace(/\s/g, '');

  if (!/^\d+$/.test(cleanPhone)) {
    return { isValid: false, message: 'Solo se permiten números' };
  }

  if (cleanPhone.length !== config.requiredLength) {
    return {
      isValid: false,
      message: `Debe contener exactamente ${config.requiredLength} dígitos`,
    };
  }

  return { isValid: true };
}

/**
 * Formatea un número de teléfono para Chile, añadiendo el prefijo
 * @param phone - Número de teléfono (solo la parte numérica sin prefijo)
 * @param countryCode - Código de país (por defecto CL para Chile)
 * @returns El número formateado completo con prefijo
 */
export function formatPhone(phone: string, countryCode: string = 'CL'): string {
  const config = PHONE_CONFIGS[countryCode];
  if (!config) return phone;

  const cleanPhone = phone.trim().replace(/\s/g, '');

  // Para Chile, añadir +56 9 al número de 8 dígitos
  if (countryCode === 'CL') {
    return `${config.countryCode}9 ${cleanPhone}`;
  }

  // Formato genérico para otros países
  return `${config.countryCode} ${cleanPhone}`;
}

/**
 * Restringe la entrada a solo dígitos y longitud máxima
 * @param value - Valor a validar
 * @param maxLength - Longitud máxima permitida
 * @returns Valor limpio (solo dígitos) con la longitud restringida
 */
export function sanitizePhoneInput(value: string, maxLength: number = 8): string {
  // Eliminar todos los caracteres que no sean dígitos
  const digitsOnly = value.replace(/\D/g, '');

  // Limitar a la longitud máxima
  return digitsOnly.slice(0, maxLength);
}
