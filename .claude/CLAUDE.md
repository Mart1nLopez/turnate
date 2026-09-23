# Turnate

Turnate es una plataforma SaaS para barberías.

## Objetivos

Construir el software más moderno para barberías.

No es un CRUD tradicional.

Debe sentirse como Stripe, Linear o Apple.

---

## Tecnologías

- Next.js 15
- React
- TypeScript
- Tailwind
- shadcn/ui
- Supabase

---

## Antes de modificar código

Siempre:

- Leer el componente completo.
- Entender la arquitectura.
- Reutilizar componentes.
- No duplicar lógica.
- No romper funcionalidades existentes.

---

## Diseño

Lee siempre:

- .claude/design-system.md
- .claude/public-profiles.md
- .claude/dashboard.md

---

## Código

Priorizar:

- código limpio
- componentes pequeños
- hooks reutilizables
- tipado estricto

Nunca agregar código innecesario.

---

## UX

Toda modificación debe mejorar:

- claridad
- velocidad
- conversión
- estética

---

## Commits

Usar Conventional Commits: `tipo(área): descripción corta en imperativo`.

Un commit = un tema. No mezclar rediseños visuales con lógica o features distintas.

Tipos:

- `feat` — funcionalidad nueva
- `fix` — corrección de un error
- `style` — cambios visuales sin lógica nueva
- `refactor` — reorganizar código sin cambiar comportamiento
- `chore` — mantenimiento, configuración, dependencias
- `docs` — solo documentación

Áreas sugeridas: `home`, `auth`, `legal`, `dashboard`, `public-profiles`, `agenda`, `design`.

Si el título no explica el cambio por sí solo, agregar debajo el qué y el porqué:

```
feat(legal): add terms checkbox on signup

- Require accepting Términos y Condiciones before creating an account
- Store terms_version and terms_accepted_at in user metadata
```

Ramas con el mismo estilo: `feature/…`, `fix/…`, `chore/…`.