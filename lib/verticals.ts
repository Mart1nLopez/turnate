export interface Vertical {
  singular: string;
  plural: string;
}

/**
 * Fuente única de los rubros que Turnate promueve en la landing.
 * Usada tanto por el typing animation del Hero (singular) como por
 * las píldoras de Verticals (plural), para evitar listas duplicadas
 * y desalineadas entre sí.
 */
export const VERTICALS: Vertical[] = [
  { singular: 'Barbería', plural: 'Barberías' },
  { singular: 'Peluquería', plural: 'Peluquerías' },
  { singular: 'Spa', plural: 'Spas' },
  { singular: 'Clínica estética', plural: 'Clínicas estéticas' },
  { singular: 'Centro médico', plural: 'Centros médicos' },
  { singular: 'Taller mecánico', plural: 'Talleres mecánicos' },
  { singular: 'Consultorio', plural: 'Consultorios' },
  { singular: 'Veterinaria', plural: 'Veterinarias' },
];

export const VERTICALS_SINGULAR = VERTICALS.map((v) => v.singular);
export const VERTICALS_PLURAL = VERTICALS.map((v) => v.plural);
