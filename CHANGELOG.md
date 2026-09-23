# Changelog

Registro de cambios de Turnate. Cada entrada agrupa los cambios por fecha y rama.
Formato de commits: ver "Convención de commits" en `.claude/CLAUDE.md`.

---

## 2026-09-22 — `feature/rediseno-ui`

### Legal
- **Nuevos Términos y Condiciones de Uso** en `/terms` (`app/terms/page.tsx`), basados en el borrador legal de Turnate.
- **Aceptación obligatoria en el registro**: checkbox requerido en `/auth/register`; el botón "Crear Cuenta" se habilita solo al aceptarlo.
- **Registro de aceptación**: se guardan `terms_version` y `terms_accepted_at` en los metadatos del usuario de Supabase Auth (`hooks/useAuth.ts`).
- **Datos legales centralizados** en `lib/legal.ts`. Los valores entre corchetes `[ ]` son placeholders pendientes de completar antes de producción. Al modificar los términos, actualizar `TERMS_VERSION` y `TERMS_UPDATED_AT`.
- Enlace del footer de la landing renombrado a "Términos y Condiciones".

### Landing
- **Rediseño de la landing** dividida en componentes: `Header`, `Hero`, `Verticals`, `Benefits`, `Features`, `Testimonials`, `FAQ`, `FinalCTA`, `Footer`.
- Animación de aparición al hacer scroll (`ScrollReveal`), respetando `prefers-reduced-motion`.
- Lista de rubros unificada en `lib/verticals.ts` (usada por el Hero y las píldoras de rubros).
- Estilos alineados al design system: tokens de color, espaciados y bordes redondeados.

### Documentación
- Se agrega este `CHANGELOG.md` y la regla de documentar cambios en `.claude/CLAUDE.md` (junto a la convención de commits).
