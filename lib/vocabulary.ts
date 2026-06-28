export const PUBLIC_TEXT = {
  hero: {
    bookNow: 'Reservar ahora',
    viewServices: 'Ver servicios',
    viewProfessionals: 'Ver profesionales',
    contact: 'Contactar',
    viewMap: 'Ver mapa',
    microcopy: {
      professional: 'Agenda online en menos de 1 minuto',
      barbershop: 'Reserva con tu barbero favorito',
    },
  },
  units: {
    review:       { one: 'reseña',       other: 'reseñas' },
    service:      { one: 'servicio',     other: 'servicios' },
    professional: { one: 'profesional',  other: 'profesionales' },
  },
} as const;

export function pluralize(
  count: number,
  forms: { one: string; other: string },
): string {
  return count === 1 ? forms.one : forms.other;
}
