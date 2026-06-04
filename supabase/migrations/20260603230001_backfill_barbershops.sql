-- ============================================================
-- MIGRACIÓN: FASE 2 — BACKFILL BARBERSHOPS DESDE PROFESSIONALS
-- Archivo : 20260603230001_backfill_barbershops.sql
-- Fecha   : 2026-06-03
-- Autor   : Mart1nLopez
-- Requiere: 20260603224017_refactor_barbershops.sql (Fase 1)
-- ============================================================
--
-- OBJETIVO
--   Poblar barbershops y barbershop_members a partir de los
--   professionals existentes. Crea 1 barbershop por professional,
--   con el professional como miembro role='owner'.
--
-- IDEMPOTENCIA
--   Esta migración puede ejecutarse múltiples veces sin error ni
--   efecto secundario. Implementada con ON CONFLICT DO NOTHING en
--   dos INSERTs separados (en lugar de CTE encadenada).
--
--   Por qué no CTE: RETURNING + ON CONFLICT DO NOTHING devuelve solo
--   las filas realmente insertadas, no las ignoradas. Si los barbershops
--   ya existen, la CTE devuelve 0 filas y el INSERT de members no
--   puede corregir membresías faltantes. Los dos INSERTs separados
--   resuelven este problema: el segundo JOIN encuentra barbershops
--   existentes directamente, sin depender del primer INSERT.
--
-- ATOMICIDAD
--   Supabase CLI envuelve cada migración en una transacción implícita.
--   Los dos INSERTs son atómicos entre sí: si el segundo falla,
--   el primero hace rollback completo.
--
-- TRIGGERS VERIFICADOS (Fase 1)
--   barbershops_set_updated_at        → BEFORE UPDATE, no se dispara en INSERT
--   barbershop_members_set_updated_at → BEFORE UPDATE, no se dispara en INSERT
--   Sin triggers BEFORE INSERT ni AFTER INSERT. ✓
--
-- CONFLICT TARGETS USADOS
--   barbershops:         CONSTRAINT barbershops_slug_key UNIQUE (slug)
--   barbershop_members:  CONSTRAINT barbershop_members_unique_pair UNIQUE (barbershop_id, professional_id)
--
-- COMPORTAMIENTO EN supabase db reset
--   Las migraciones corren antes del seed.sql. En ese momento,
--   professionals está vacía → 0 inserts → sin error.
--   El seed.sql deberá poblar barbershops de prueba en Fase 4.
--
-- MAPEO DE COLUMNAS
--   owner_id     ← professionals.user_id
--   name         ← professionals.name
--   slug         ← professionals.slug  (mismo valor, namespace distinto)
--   description  ← professionals.bio
--   logo_url     ← professionals.profile_image
--   phone        ← professionals.phone
--   social_links ← professionals.social_links
--   location     ← professionals.location
--   map_embed_url← professionals.map_embed_url
--   is_active    ← TRUE  (todos los professionals actuales son activos)
--   is_approved  ← professionals.is_approved
--   company_rut  ← NULL  (professionals.rut es RUT personal, no empresa)
--   address/city/region ← NULL (no existen como campos separados)
--   created_at   ← professionals.created_at  (preserva fecha original)
--   updated_at   ← professionals.updated_at
--
-- DEUDA TÉCNICA
--   logo_url apunta a 'professional-images/{professional_id}/...'.
--   Si el dueño quiere un logo propio de la barbería, debe subirlo
--   desde el panel de configuración (Fase 4).
--
-- ROLLBACK: Ver sección final.
-- ============================================================


-- ============================================================
-- PASO 0: PRE-VERIFICACIÓN
-- Abortar si Fase 1 no fue ejecutada.
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'barbershops'
  ) THEN
    RAISE EXCEPTION
      'Fase 1 no ejecutada. Correr 20260603224017_refactor_barbershops.sql primero.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'barbershop_members'
  ) THEN
    RAISE EXCEPTION
      'Tabla barbershop_members no encontrada. Verificar Fase 1.';
  END IF;
END;
$$;


-- ============================================================
-- PASO 1: BARBERSHOPS
-- Crea un barbershop por cada professional.
-- ON CONFLICT (slug) DO NOTHING: si ya existe, lo omite sin error.
-- ============================================================
INSERT INTO public.barbershops (
  owner_id,
  name,
  slug,
  description,
  logo_url,
  phone,
  social_links,
  location,
  map_embed_url,
  is_active,
  is_approved,
  created_at,
  updated_at
)
SELECT
  p.user_id                                    AS owner_id,
  p.name                                       AS name,
  p.slug                                       AS slug,
  p.bio                                        AS description,
  p.profile_image                              AS logo_url,
  p.phone                                      AS phone,
  COALESCE(p.social_links, '{}'::jsonb)        AS social_links,
  p.location                                   AS location,
  p.map_embed_url                              AS map_embed_url,
  TRUE                                         AS is_active,
  COALESCE(p.is_approved, FALSE)               AS is_approved,
  COALESCE(p.created_at, now())                AS created_at,
  COALESCE(p.updated_at, p.created_at, now())  AS updated_at
FROM public.professionals p
ORDER BY p.created_at NULLS LAST
ON CONFLICT (slug) DO NOTHING;
-- Conflict target: CONSTRAINT barbershops_slug_key UNIQUE (slug)
-- Omite filas cuyos slugs ya existen. El resto de columnas no se modifica.
-- Si el dueño actualizó su nombre/logo tras el primer backfill, se conserva
-- la versión del usuario (comportamiento intencional de DO NOTHING).


-- ============================================================
-- PASO 2: BARBERSHOP_MEMBERS
-- Crea la membresía owner para cada professional.
-- JOIN por slug (UNIQUE en ambas tablas) recupera el barbershop_id correcto
-- tanto para barbershops recién insertados como para los ya existentes.
-- ON CONFLICT (barbershop_id, professional_id) DO NOTHING: omite duplicados.
-- ============================================================
INSERT INTO public.barbershop_members (
  barbershop_id,
  professional_id,
  role,
  status,
  joined_at,
  created_at,
  updated_at
)
SELECT
  b.id                                           AS barbershop_id,
  p.id                                           AS professional_id,
  'owner'::public.barbershop_member_role         AS role,
  'active'::public.barbershop_member_status      AS status,
  COALESCE(p.created_at, now())                  AS joined_at,
  now()                                          AS created_at,
  now()                                          AS updated_at
FROM public.professionals p
JOIN public.barbershops b ON b.slug = p.slug
ON CONFLICT (barbershop_id, professional_id) DO NOTHING;
-- Conflict target: CONSTRAINT barbershop_members_unique_pair UNIQUE (barbershop_id, professional_id)
--
-- Nota sobre el índice parcial barbershop_members_one_active_per_professional:
-- El constraint UNIQUE (barbershop_id, professional_id) evalúa el conflicto
-- antes que el índice parcial en re-ejecuciones, porque el par (B, P) ya
-- existe desde la primera ejecución. DO NOTHING lo captura sin llegar al índice.


-- ============================================================
-- VERIFICACIÓN POST-BACKFILL
-- Ejecutar en Supabase Studio tras aplicar la migración.
-- ============================================================
--
-- A. Conteos — deben ser iguales entre sí:
--
--    SELECT
--      (SELECT COUNT(*) FROM public.professionals)      AS total_professionals,
--      (SELECT COUNT(*) FROM public.barbershops)        AS total_barbershops,
--      (SELECT COUNT(*) FROM public.barbershop_members) AS total_members;
--    Esperado: las tres columnas con el mismo valor.
--
-- B. Todos los miembros son owners activos:
--
--    SELECT COUNT(*) AS non_owner_active
--    FROM public.barbershop_members
--    WHERE role <> 'owner' OR status <> 'active';
--    Esperado: 0
--
-- C. Alineación slug — cada barbershop tiene su professional:
--
--    SELECT COUNT(*) AS barbershops_sin_professional
--    FROM public.barbershops b
--    WHERE NOT EXISTS (
--      SELECT 1 FROM public.professionals p WHERE p.slug = b.slug
--    );
--    Esperado: 0
--
-- D. Alineación owner_id ↔ user_id:
--
--    SELECT COUNT(*) AS desalineados
--    FROM public.barbershops b
--    JOIN public.professionals p ON p.slug = b.slug
--    WHERE b.owner_id <> p.user_id;
--    Esperado: 0
--
-- E. Sin membresías huérfanas:
--
--    SELECT COUNT(*) AS miembros_huerfanos
--    FROM public.barbershop_members bm
--    LEFT JOIN public.barbershops b ON b.id = bm.barbershop_id
--    WHERE b.id IS NULL;
--    Esperado: 0
--
-- F. El índice parcial se respeta (un active por professional):
--
--    SELECT professional_id, COUNT(*) AS activas
--    FROM public.barbershop_members
--    WHERE status = 'active'
--    GROUP BY professional_id
--    HAVING COUNT(*) > 1;
--    Esperado: 0 filas
--
-- G. Professionals sin barbershop (debe ser vacío):
--
--    SELECT p.slug, p.name
--    FROM public.professionals p
--    WHERE NOT EXISTS (
--      SELECT 1 FROM public.barbershops b WHERE b.slug = p.slug
--    );
--    Esperado: 0 filas
--
-- H. Idempotencia verificada — ejecutar el script por segunda vez:
--    El resultado de A debe ser idéntico. Sin errores.
--
-- I. Vista representativa — primeros 5 registros:
--
--    SELECT
--      b.name,
--      b.slug,
--      b.is_approved,
--      b.logo_url IS NOT NULL AS tiene_logo,
--      bm.role,
--      bm.status
--    FROM public.barbershops b
--    JOIN public.barbershop_members bm ON bm.barbershop_id = b.id
--    LIMIT 5;


-- ============================================================
-- ROLLBACK FASE 2
-- Identificación: slug de barbershop coincide con slug de professional.
-- Ventana segura: antes de que usuarios creen barbershops manualmente.
-- ============================================================
--
-- BEGIN;
--
-- DELETE FROM public.barbershop_members bm
-- USING public.barbershops b,
--       public.professionals p
-- WHERE bm.barbershop_id = b.id
--   AND b.slug = p.slug;
--
-- DELETE FROM public.barbershops b
-- USING public.professionals p
-- WHERE b.slug = p.slug;
--
-- -- Verificar:
-- -- SELECT COUNT(*) FROM public.barbershops;        -- Esperado: 0
-- -- SELECT COUNT(*) FROM public.barbershop_members; -- Esperado: 0
--
-- COMMIT;
-- ============================================================
