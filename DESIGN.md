---
name: Turnate
description: Plataforma de agendamiento de citas para barberías — dashboard operativo confiable y perfiles públicos con identidad propia por negocio
colors:
  dashboard-primary: "#3b5fe2"
  dashboard-primary-dark: "#60a5fa"
  dashboard-bg: "#ffffff"
  dashboard-bg-dark: "#0f172a"
  dashboard-surface: "#ffffff"
  dashboard-surface-dark: "#1e293b"
  dashboard-muted: "#f7f7fa"
  dashboard-muted-dark: "#334155"
  dashboard-border: "#e2e8f0"
  dashboard-border-dark: "#334155"
  dashboard-foreground: "#1a1523"
  dashboard-foreground-dark: "#f8fafc"
  dashboard-muted-foreground: "#64748b"
  destructive: "#e11d48"
  destructive-dark: "#f43f5e"
  success: "#22c55e"
  warning: "#f59e0b"
  theme-luxury-gold-accent: "#D4AF37"
  theme-minimal-white-accent: "#111111"
  theme-urban-neon-accent: "#00FF87"
  theme-vintage-barber-accent: "#C8874A"
  theme-black-red-accent: "#DC2626"
typography:
  display:
    fontFamily: "var(--font-geist-sans), sans-serif, system-ui"
    fontSize: "clamp(1.875rem, 5vw, 3.75rem)"
    fontWeight: 700
    lineHeight: "1.04"
    letterSpacing: "-0.01em"
  title:
    fontFamily: "var(--font-geist-sans), sans-serif, system-ui"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: "1"
    letterSpacing: "-0.01em"
  body:
    fontFamily: "var(--font-geist-sans), sans-serif, system-ui"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5"
  label:
    fontFamily: "var(--font-geist-sans), sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.4"
rounded:
  control: "8px"
  card: "10px"
  public-card: "16px"
  pill: "9999px"
spacing:
  xs: "0.375rem"
  sm: "1rem"
  md: "1.5rem"
  lg: "2rem"
  section: "6rem"
components:
  button-primary:
    backgroundColor: "{colors.dashboard-primary}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.dashboard-primary}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.dashboard-foreground}"
    rounded: "{rounded.control}"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  card-dashboard:
    backgroundColor: "{colors.dashboard-surface}"
    rounded: "{rounded.card}"
  card-public:
    rounded: "{rounded.public-card}"
---

# Design System: Turnate

## Overview

**Creative North Star: "El Asistente de Confianza"**

El dashboard es el asistente diario del dueño y su equipo: neutral, preciso, cálido en el trato pero nunca decorativo — una herramienta en la que se confía porque no estorba. Se ve y se comporta igual todos los días: mismo azul, mismo ritmo de espaciado, mismos componentes shadcn ("new-york"). Sobre esa base estable, cada barbería elige la "personalidad" que muestra a sus clientes en su perfil público a través de uno de cinco temas (Luxury Gold, Minimal White, Urban Neon, Vintage Barber, Black Red) inyectados como variables CSS en la raíz de la página. El sistema es, a la vez, una sola herramienta confiable y cinco vestidos distintos para la cara pública de cada negocio.

Esto no es un CRUD tradicional ni un panel de administración genérico: la referencia de calidad es Stripe, Linear, Apple, Airbnb — claridad, mucho espacio en blanco, densidad baja, tipografía como jerarquía principal (no color). El rechazo explícito es a la estética "sistema de administración antiguo": tablas densas sin aire, sombras duras, exceso de bordes y colores compitiendo entre sí.

**Key Characteristics:**
- Dos capas de identidad: chrome de producto (fijo, neutral, confiable) y piel del tenant (elegida, expresiva, por barbería).
- Mobile-first en todo: el flujo de reserva del cliente final vive principalmente en el móvil.
- Plano en reposo; la profundidad aparece solo como respuesta a la interacción (hover/focus).
- Un solo acento por pantalla — nunca dos colores de marca compitiendo en la misma vista.

## Colors

Dos paletas activas y separadas: la del chrome de producto (fija) y la de los temas de perfil público (elegida por tenant, una a la vez).

### Primary (chrome de producto)
- **Azul Turnate** (`#3b5fe2` claro / `#60a5fa` oscuro): color de marca del propio Turnate — botones primarios, links activos, foco de navegación, acentos de gráficos del dashboard. Es el único acento de marca visible en el chrome de producto.

### Neutral (chrome de producto)
- **Fondo** (`#ffffff` claro / `#0f172a` oscuro): fondo base de página.
- **Superficie** (`#ffffff` claro / `#1e293b` oscuro): fondo de cards, popovers, diálogos.
- **Muted** (`#f7f7fa` claro / `#334155` oscuro): fondos secundarios, estados deshabilitados.
- **Borde** (`#e2e8f0` claro / `#334155` oscuro): bordes de cards, inputs, separadores.
- **Texto principal** (`#1a1523` claro / `#f8fafc` oscuro), **texto secundario** (`#64748b`): jerarquía tipográfica, nunca color para diferenciar importancia.

### Feedback (chrome de producto)
- **Destructivo** (`#e11d48` claro / `#f43f5e` oscuro): errores, cancelaciones, acciones irreversibles.
- **Éxito** (`#22c55e`): confirmaciones, estados completados.
- **Advertencia** (`#f59e0b`): estados pendientes, avisos no bloqueantes.

### Temas de perfil público (uno activo por barbería, elegido por el dueño)
Cada tema define fondo, superficie, acento, texto, bordes y radio de botón vía variables `--theme-*` (`lib/barbershopThemes.ts`), aplicadas una sola vez en la raíz de la página pública y heredadas por todos sus componentes.

- **Luxury Gold** (default) — fondo casi negro (`#0A0A0A`), acento dorado (`#D4AF37`): elegante, premium, cálido.
- **Minimal White** — fondo blanco (`#FFFFFF`), acento negro (`#111111`): limpio, tipografía como protagonista.
- **Urban Neon** — fondo casi negro (`#0D0D0D`), acento verde neón (`#00FF87`): vibrante, urbano. (Nota: esta paleta es la que aparece descrita como sistema único en `.claude/design-system.md`; en el código real es solo una de cinco opciones de tema de tenant, no la identidad de Turnate.)
- **Vintage Barber** — fondo marrón oscuro (`#1C1008`), acento cobre (`#C8874A`): cálido, clásico, tonos tierra.
- **Black Red** — fondo casi negro (`#0A0A0A`), acento rojo (`#DC2626`): intenso, directo.

### Named Rules
**The One Brand Accent Rule.** El chrome de producto (dashboard, marketing de Turnate) usa un único acento de marca — el azul — y nunca lo mezcla con los acentos de los temas de tenant. Un tema de perfil público nunca se filtra al dashboard, y el azul de marca nunca aparece dentro de una página pública temeada.

**The Single Theme Rule.** Una página pública renderiza exactamente un tema a la vez, aplicado en la raíz; ningún componente hijo redefine su propio acento por fuera de las variables `--theme-*` heredadas.

## Typography

**Display/Body Font:** Geist Sans (`var(--font-geist-sans)`, con fallback `sans-serif, system-ui`) — única familia tipográfica en todo el producto, sin serif ni display alternativo.
**Mono Font:** Geist Mono (`var(--font-geist-mono)`) — reservado para datos tabulares/técnicos si aparecen.

**Character:** Una sola familia sans-serif hace todo el trabajo de jerarquía mediante peso, tamaño y espaciado — nunca mediante cambio de fuente. Encaja con el norte "asistente de confianza": nada decorativo, todo funcional.

### Hierarchy
- **Display** (700, `clamp(1.875rem, 5vw, 3.75rem)` / hasta `text-6xl` en hero de perfil público, line-height 1.04, tracking ajustado): nombre de la barbería/profesional en el hero público.
- **Title** (600, `text-2xl`, line-height 1, tracking ajustado): títulos de card (`CardTitle`), encabezados de sección de dashboard.
- **Body** (400, `text-base`/`text-sm`): contenido general, descripciones de servicio.
- **Label** (500, `text-sm`): labels de formulario, badges, metadatos (ej. "4.9★ · 3 profesionales").

### Named Rules
**The No Small-Text Overload Rule.** Nunca abusar de `text-sm`/`text-xs`; el texto secundario debe seguir siendo cómodo de leer, no reducirse solo para "caber".

## Layout

Mobile-first estricto: todo componente se diseña primero para móvil, luego tablet, luego escritorio — nunca al revés. Contenedor principal: `max-w-7xl mx-auto` con padding horizontal `px-4 sm:px-6 lg:px-8`. Ritmo entre secciones grandes: `py-20 lg:py-28` (marketing/perfiles) o `py-24` como paso de espaciado general. Grillas responsive: hasta 4 columnas en escritorio, 2 en tablet, 1 en móvil — nunca scroll horizontal.

En perfiles públicos el hero ocupa `min-h-[65vh] sm:min-h-[70vh]` con imagen de portada (parallax opcional) y overlay de gradiente definido por el tema activo (`--theme-overlay`). El dashboard no usa hero de página completa; prioriza filtros arriba, KPIs (máx. 4 por fila), un gráfico principal y tablas/cards debajo, siguiendo siempre el orden: Título → Filtros → KPIs → Gráfico principal → Gráficos secundarios → Tablas.

## Elevation & Depth

Plano por defecto, con sombra o glow como respuesta a la interacción — no como estado de reposo. Las cards del dashboard usan `shadow-sm` en reposo (shadcn `Card`); las cards de perfil público van sin sombra en reposo y añaden un glow de acento del tema (`shadow-[0_8px_32px_-8px_var(--theme-accent-ring)]`) solo en `hover`, junto con un leve `-translate-y-0.5`. Ningún componente usa sombras duras u opacas.

### Shadow Vocabulary
- **Reposo (dashboard)** (`shadow-sm`): cards, popovers — apenas perceptible.
- **Hover (perfil público)** (`shadow-[0_8px_32px_-8px_var(--theme-accent-ring)]`): glow del color de acento del tema activo, difuso, solo en interacción.

### Named Rules
**The Rest-Is-Flat Rule.** En reposo, ninguna superficie compite visualmente por elevación; la sombra es siempre una señal de "esto es interactivo", nunca decoración ambiental.

## Shapes

Esquinas siempre redondeadas — nunca completamente cuadradas. Controles (botones, inputs): `rounded-md` (~8px). Cards del dashboard: `rounded-lg` (~10px, ligado a `--radius: 0.625rem`). Cards de perfil público: `rounded-2xl` (16px), más suave que el dashboard para sentirse editorial/premium. El botón CTA del hero público usa el `buttonRadius` del tema activo (varía de `6px` en Minimal White a `9999px`/píldora en Urban Neon), la única excepción donde el radio es parte de la personalidad del tenant en vez de un token fijo.

## Components

### Buttons
- **Shape:** `rounded-md` (~8px) en dashboard/chrome; radio variable por tema (`--theme-radius`) en CTAs de perfil público.
- **Primary:** fondo `--color-primary` (azul), texto blanco, `h-10 px-4 py-2` por defecto; único botón primario por sección.
- **Secondary/Outline/Ghost:** transparente o `bg-secondary`, borde tenue, texto del color base — usados para acciones no destacadas.
- **Destructive:** fondo `--color-destructive`, texto blanco — reservado a acciones irreversibles (cancelar, eliminar).
- **Hover/Focus:** transición de color (`transition-colors`), anillo de foco visible (`focus-visible:ring-2 focus-visible:ring-ring`); nunca solo `outline: none` sin reemplazo.

### Cards
- **Dashboard:** `rounded-lg border bg-card shadow-sm`, padding interno `p-6`.
- **Perfil público:** `rounded-2xl border` con color de borde del tema (`--theme-border`), sin sombra en reposo, glow de acento + elevación sutil en hover.
- Usar cards solo cuando agrupan información relacionada (servicios, profesionales, reseñas, reservas); si una sección se lee limpia sin card, preferir esa opción.

### Inputs / Fields
- **Style:** `h-10` (mínimo `h-11` en formularios de agendamiento), `rounded-md`, borde `border-input`, fondo `bg-background`.
- **Focus:** anillo de foco (`focus-visible:ring-2`), nunca solo cambio de borde.
- **Disabled:** `opacity-50`, `cursor-not-allowed`.
- Labels siempre visibles (no solo placeholder); mensajes de error claros y no técnicos.

### Navigation
- Subrayado animado en hover (`.nav-underline`, transición de ancho `duration-300`) para links de navegación pública.
- El usuario nunca debe perderse: cada pantalla del dashboard muestra título, subtítulo cuando aplica, y una acción principal clara.

### Tenant Theme Root (componente de sistema)
Cada página pública de barbería/profesional inyecta las 14 variables `--theme-*` de `getThemeCssVars()` una sola vez en su elemento raíz; todo componente descendiente (hero, cards de servicio, equipo, contacto, footer) las consume por variable CSS, nunca por prop redundante. Esto es lo que permite que un mismo árbol de componentes se re-vista con 5 identidades distintas sin duplicar código.

## Do's and Don'ts

### Do:
- **Do** mantener el dashboard en su única paleta azul/neutral fija — es la base de confianza sobre la que los temas de tenant se apoyan.
- **Do** aplicar el tema de tenant una sola vez en la raíz de la página pública y dejar que los hijos hereden vía `--theme-*`.
- **Do** usar sombra/glow solo como respuesta a hover/focus, nunca en reposo.
- **Do** usar un único botón primario por sección/pantalla.
- **Do** priorizar Skeleton sobre pantallas vacías durante carga (patrón ya establecido en `.claude/.claude/ui-patterns.md`).

### Don't:
- **Don't** introducir un segundo acento de marca en el chrome del dashboard — el azul es el único.
- **Don't** mezclar el acento de un tema de tenant con el azul de Turnate en la misma vista.
- **Don't** usar sombras duras u opacas en reposo; toda profundidad es sutil y contextual a la interacción.
- **Don't** tratar `.claude/design-system.md` como si describiera un único sistema oscuro/neón global: esa paleta corresponde al preset "Urban Neon" del sistema de temas de tenant, no a la identidad fija de Turnate.
- **Don't** usar tablas en móvil; usar cards (patrón ya establecido).
