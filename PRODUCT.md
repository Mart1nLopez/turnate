# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dos audiencias:

- **Barbería con equipo (usuario primario del dashboard):** dueño/admin que gestiona su barbería a diario — servicios, disponibilidad, citas, miembros del equipo (con roles de admin e invitaciones), analíticas y su perfil público. Cada barbero del equipo también tiene su propio perfil profesional dentro de la barbería. Este es el foco actual del producto (confirmado por el usuario), aunque el modelo de cuenta técnicamente permite un profesional operando solo.
- **Cliente final:** agenda una cita desde el móvil sin crear cuenta ni descargar app. Entra por la página pública de una barbería o de un profesional, elige servicio, fecha y horario, y recibe confirmación por email.

## Product Purpose

Turnate es una plataforma de agendamiento de citas para negocios de servicios personales (hoy, principalmente barberías; el README y el pitch original mencionan expansión futura a clínicas/estéticas/terapistas, aún no confirmada como foco). Reemplaza la gestión manual de turnos (WhatsApp, agenda de papel, llamadas) por un dashboard completo para el negocio y una página pública de reserva para el cliente. Éxito = el profesional gestiona su agenda diaria desde el dashboard sin fricción, y el cliente completa una reserva sin abandonar el flujo.

## Positioning

Agendamiento sin fricción: el cliente reserva desde el móvil sin necesidad de registro ni de descargar una app, a diferencia de alternativas tipo Booksy, Fresha o Treatwell. Esto es lo que el usuario confirmó como diferenciador central (no precio, no mercado local, no estética — aunque la estética premium es un objetivo del producto, no la posición competitiva).

## Operating Context

- Dominio de producción: turnate.cl — mercado hispanohablante (locale `es_CL`).
- El dashboard (`app/dashboard/*`) cubre: citas, disponibilidad, servicios, barbería (equipo/config del negocio), analíticas, reseñas, perfil, configuración, horarios libres.
- Perfiles públicos en dos niveles: `/[slug]` (barbería) y `/barberia/[slug]` (visto en rutas actuales), con flujo de reserva en `/[slug]/agendar`.
- Flujos adicionales: cancelación de cita por token (`/cancel/[token]`), reseña post-cita por token (`/review/[token]`), auth completo (login, registro, recuperación, confirmación de email).
- Backend: Supabase (Postgres + Auth + Storage). Emails transaccionales vía Resend.

## Capabilities and Constraints

- Multi-tenant: una barbería puede tener múltiples miembros con roles (admin, miembro), invitaciones para sumar barberos al equipo, y cada uno con perfil público propio.
- Gestión de servicios con precio y duración, disponibilidad semanal configurable, fechas no disponibles, sistema de reseñas y calificaciones, analíticas del negocio y por profesional.
- Cliente final no requiere cuenta para reservar; sí puede dejar reseña y cancelar vía enlace con token.
- Stack fijo: Next.js 15, React 19, TypeScript, TailwindCSS v4, shadcn/ui, Supabase. (Preexistente — ver CLAUDE.md.)

## Brand Commitments

- Nombre: Turnate.
- Personalidad de marca (confirmada en `.claude/.claude/brand.md`, preexistente): transmite confianza, profesionalismo, modernidad, precisión, rapidez. Explícitamente evita lujo exagerado, excentricidad, gaming, neón y "tecnología fría". Las barberías deben sentirse humanas, elegantes, reales, cercanas, premium.
- Dirección estética pedida ahora por el usuario: confiable, cálida y profesional — no genérica.
- **Conflicto detectado (no resuelto aquí, queda para DESIGN.md/rediseño):** `.claude/design-system.md` (preexistente) describe un sistema oscuro con acento verde neón (#00FF88), que contradice tanto brand.md ("nunca neón", "nunca tecnología fría") como la dirección cálida pedida ahora. El código real (`app/globals.css`) tampoco implementa ese sistema: usa tema claro con azul (#3b5fe2) como primario. `design-system.md` parece aspiracional/desactualizado, no el estado real del código.
- Referencias de calidad ya establecidas (preexistente, `.claude/design-system.md`): Apple, Linear, Stripe, Framer, Raycast, Airbnb.
- Los perfiles públicos (barbería y profesional) soportan un sistema de 5 temas seleccionables por tenant (`lib/barbershopThemes.ts`, tipo `ThemeId`): Luxury Gold (default), Minimal White, Urban Neon, Vintage Barber, Black Red — cada uno define su propia paleta vía CSS custom properties (`--theme-*`). El acento verde neón sobre negro de `design-system.md` corresponde al preset "Urban Neon", no a la identidad única de Turnate; `design-system.md`, tal como está escrito hoy, no deja claro que describe una opción de tema entre varias, lo cual es una brecha de documentación a corregir en DESIGN.md.
- El dashboard y el chrome propio de Turnate (no los perfiles públicos de cada barbería) usan un sistema de tokens fijo (`app/globals.css`, shadcn "new-york", base color slate): tema claro con azul (#3b5fe2) como color primario, y una variante `.dark` con azul claro (#60a5fa). Este es el sistema real implementado hoy, distinto de la paleta oscura/neón descrita en `design-system.md`.
- Assets: logo (`public/logo.png`, `public/logo.svg`), imágenes de ejemplo en `public/img/default-carrusel/`, mockups en `public/mockups/`.

## Evidence on Hand

- No hay testimonios, casos de estudio ni datos de clientes reales confirmados; cualquier prueba social debe tratarse como no disponible salvo que el usuario provea datos reales. Las estadísticas de ejemplo en `.claude/.claude/ui-patterns.md` (500+, 4.9★, 8 años, +3000) son ejemplos de formato, no datos reales.
- Imágenes de stock/ejemplo disponibles en `public/img/default-carrusel/` (corte de pelo, sala) y mockups SVG en `public/mockups/`.

## Product Principles

1. El cliente final agenda sin fricción: sin registro, sin apps, confirmación clara.
2. El dashboard es la herramienta diaria del dueño/admin de la barbería y de su equipo — debe priorizar velocidad y claridad sobre exhaustividad.
3. La marca debe sentirse humana, cálida y confiable — nunca fría, genérica ni "de sistema administrativo antiguo" (preexistente en brand.md/design-system.md).
4. Consistencia visual entre dashboard y perfiles públicos, aunque cumplan roles distintos (operar vs. persuadir).

## Accessibility & Inclusion

Sin requisito de accesibilidad específico confirmado por el usuario más allá de lo ya documentado en `.claude/design-system.md` (preexistente): alto contraste, botones fáciles de tocar, estados hover/focus/disabled, labels descriptivos.
