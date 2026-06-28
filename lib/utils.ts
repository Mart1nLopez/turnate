/**
 * Genera un slug a partir de un nombre o string
 * - Minúsculas
 * - Remueve acentos
 * - Solo letras, números, espacios y guiones
 * - Reemplaza espacios por guiones
 * - Remueve guiones duplicados y extremos
 * @param name string base
 * @param options { randomSuffix?: boolean } Si true, agrega un sufijo aleatorio
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .trim()
    .replace(/[\s_-]+/g, '-') // Reemplazar espacios y guiones bajos con guiones
    .replace(/-+/g, '-') // Remover guiones duplicados
    .replace(/^-+|-+$/g, ''); // Remover guiones al inicio y final
}

/**
 * Genera un slug a partir de un nombre y le agrega un sufijo aleatorio
 */
export function generateSlugWithRandomSuffix(name: string): string {
  const base = generateSlugFromName(name);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${randomSuffix}`;
}
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae la URL de Google Maps a partir de un iframe HTML o URL directa.
 *
 * Cuando el input es HTML de iframe (copiado desde Google Maps "Compartir → Incorporar"),
 * el atributo src puede contener entidades HTML (&#39; para ', &amp; para &, etc.).
 * El navegador las decodifica al parsear HTML, pero como nosotros extraemos con regex
 * sobre texto plano, debemos decodificarlas manualmente para que la URL sea válida.
 */
export function extractMapUrl(input: string): string {
  if (!input || typeof input !== 'string') return '';

  const trimmed = input.trim();

  if (trimmed.includes('<iframe')) {
    const match = trimmed.match(/src=["']([^"']+)["']/);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]);
    }
    return '';
  }

  if (trimmed.startsWith('http')) {
    return trimmed;
  }

  return '';
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Formatea un número como moneda chilena (CLP)
 * @param amount - El monto a formatear
 * @returns String formateado como moneda chilena
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea una fecha y hora para mostrar en formato chileno
 * @param dateString - La fecha en formato string (ISO)
 * @returns Objeto con fecha y hora formateadas
 */
export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    time: date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}
