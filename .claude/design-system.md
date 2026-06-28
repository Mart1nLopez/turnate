# Turnate Design System

## Filosofía

Turnate debe transmitir una sensación premium.

Inspiraciones:

* Apple
* Linear
* Stripe
* Framer
* Raycast
* Airbnb

El diseño debe sentirse:

* Elegante
* Minimalista
* Profesional
* Moderno
* Rápido
* Con mucho espacio visual

Nunca debe parecer un sistema antiguo de administración.

---

# Mobile First

Todo componente debe diseñarse primero para celular.

Luego adaptarse a tablet.

Finalmente a escritorio.

Nunca diseñar únicamente pensando en desktop.

---

# Layout

## Contenedor principal

Utilizar:

max-w-7xl mx-auto

Padding horizontal:

px-4
sm:px-6
lg:px-8

Padding vertical entre secciones:

py-20
lg:py-28

Nunca dejar secciones demasiado juntas.

---

# Espaciado

Entre componentes pequeños:

gap-4

Entre tarjetas:

gap-6

Entre bloques importantes:

gap-8

Entre secciones:

py-24

Mucho espacio negativo.

No saturar la interfaz.

---

# Bordes

Botones

rounded-xl

Inputs

rounded-xl

Cards

rounded-2xl

Modales

rounded-3xl

Nunca usar esquinas completamente cuadradas.

---

# Sombras

Muy sutiles.

No usar sombras fuertes.

Preferir:

shadow-sm

o

shadow-lg con baja opacidad.

---

# Colores

Background principal

#0B0B0B

Surface

#121212

Border

#262626

Texto principal

#FFFFFF

Texto secundario

#A3A3A3

Color principal

#00FF88

Error

#EF4444

Advertencia

#F59E0B

Éxito

#22C55E

---

# Tipografía

Hero

text-5xl
lg:text-7xl

Título sección

text-4xl

Subtítulo

text-xl

Texto normal

text-base

Texto secundario

text-sm

Nunca abusar de textos pequeños.

---

# Botones

Botón principal

* Fondo verde
* Texto negro
* rounded-xl
* transición suave

Botón secundario

* Transparente
* Borde tenue
* Texto blanco

Nunca usar más de un botón primario por sección.

---

# Cards

Usar cards únicamente cuando agrupen información relacionada.

Ejemplos:

Servicios

Profesionales

Reseñas

Reservas

No usar cards para todo.

Si una sección puede mostrarse limpia sin cards, preferir esa opción.

---

# Formularios

Inputs grandes.

Altura mínima:

h-11

Espaciado amplio.

Labels visibles.

Mensajes de error claros.

---

# Componentes preferidos

Utilizar siempre que sea posible:

Button

Card

Badge

Avatar

Separator

Tabs

Dialog

Popover

DropdownMenu

Tooltip

Sheet

ScrollArea

Skeleton

Alert

Accordion

Todos provenientes de shadcn/ui.

Evitar crear componentes nuevos si ya existen equivalentes.

---

# Iconos

Usar únicamente Lucide React.

No mezclar librerías.

Tamaño habitual:

16
18
20
24

---

# Animaciones

Duración

duration-200

duration-300

Preferir:

transition-all

ease-in-out

Animaciones:

opacity

translate-y

scale

Nunca usar animaciones exageradas.

---

# Imágenes

Las fotografías son protagonistas.

Usar imágenes grandes.

Mantener alta calidad.

Esquinas redondeadas.

Nunca deformar imágenes.

---

# Responsive

Desktop

Hasta cuatro columnas.

Tablet

Dos columnas.

Mobile

Una columna.

Nunca generar scroll horizontal.

---

# Accesibilidad

Contraste alto.

Botones fáciles de tocar.

Estados hover.

Estados focus.

Estados disabled.

Labels descriptivos.

---

# Rendimiento

Evitar renders innecesarios.

Lazy loading para imágenes.

Skeletons durante carga.

No bloquear la interfaz.

---

# UX

Cada pantalla debe responder tres preguntas en menos de cinco segundos:

¿Dónde estoy?

¿Qué puedo hacer?

¿Cuál es la acción principal?

---

# Antes de agregar un componente

Preguntarse:

¿Realmente aporta valor?

¿Existe ya un componente reutilizable?

¿Hace la pantalla más simple?

Si la respuesta es no, no agregarlo.

---

# Objetivo final

Cada pantalla debe sentirse como un producto de nivel Apple, Linear o Stripe.

La prioridad es:

1. Claridad
2. Simplicidad
3. Velocidad
4. Conversión
5. Consistencia visual
