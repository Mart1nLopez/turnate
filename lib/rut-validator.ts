/**
 * Utilidades para validación de RUT chileno
 */

/**
 * Limpia el RUT removiendo puntos, guiones y espacios
 */
export function cleanRut(rut: string): string {
  return rut.replace(/[.\-\s]/g, '').toUpperCase();
}

/**
 * Formatea el RUT en el formato estándar 12.345.678-9
 */
export function formatRut(rut: string): string {
  const cleanedRut = cleanRut(rut);

  if (cleanedRut.length < 2) {
    return cleanedRut;
  }

  const body = cleanedRut.slice(0, -1);
  const verifierDigit = cleanedRut.slice(-1);

  // Agregar puntos cada 3 dígitos desde la derecha
  let formattedBody = '';
  for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }

  return `${formattedBody}-${verifierDigit}`;
}

/**
 * Calcula el dígito verificador del RUT usando el algoritmo chileno
 */
export function calculateVerifierDigit(rutBody: string): string {
  let sum = 0;
  let multiplier = 2;

  // Recorrer de derecha a izquierda
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const digit = 11 - remainder;

  if (digit === 11) return '0';
  if (digit === 10) return 'K';
  return digit.toString();
}

/**
 * Valida el formato básico del RUT (solo formato, no dígito verificador)
 */
export function isValidRutFormat(rut: string): boolean {
  const cleanedRut = cleanRut(rut);

  // Debe tener entre 8 y 9 caracteres (7-8 dígitos + 1 dígito verificador)
  if (cleanedRut.length < 8 || cleanedRut.length > 9) {
    return false;
  }

  // Los primeros caracteres deben ser números
  const body = cleanedRut.slice(0, -1);
  const verifierDigit = cleanedRut.slice(-1);

  // El cuerpo debe ser solo números
  if (!/^\d+$/.test(body)) {
    return false;
  }

  // El dígito verificador debe ser número o K
  if (!/^[\dK]$/.test(verifierDigit)) {
    return false;
  }

  return true;
}

/**
 * Valida completamente el RUT (formato y dígito verificador)
 */
export function isValidRut(rut: string): boolean {
  if (!isValidRutFormat(rut)) {
    return false;
  }

  const cleanedRut = cleanRut(rut);
  const body = cleanedRut.slice(0, -1);
  const providedVerifierDigit = cleanedRut.slice(-1);
  const calculatedVerifierDigit = calculateVerifierDigit(body);

  return providedVerifierDigit === calculatedVerifierDigit;
}

/**
 * Valida el RUT y retorna un objeto con el resultado y mensaje de error
 */
export function validateRut(rut: string): { isValid: boolean; error?: string } {
  if (!rut || !rut.trim()) {
    return { isValid: false, error: 'El RUT es requerido' };
  }

  if (!isValidRutFormat(rut)) {
    return {
      isValid: false,
      error: 'El RUT debe tener el formato 12.345.678-9 o 12345678-9',
    };
  }

  if (!isValidRut(rut)) {
    return {
      isValid: false,
      error: 'El dígito verificador del RUT no es válido',
    };
  }

  return { isValid: true };
}

/**
 * Formatea el RUT mientras se escribe (para usar en onChange)
 */
export function formatRutOnInput(value: string): string {
  // Limpiar el valor
  const cleaned = cleanRut(value);

  // Limitar a 9 caracteres máximo
  const limited = cleaned.slice(0, 9);

  // Si tiene al menos 2 caracteres, formatear
  if (limited.length >= 2) {
    return formatRut(limited);
  }

  return limited;
}
