-- ============================================================
-- MIGRACIÓN PATCH: FIX RLS POLICIES — barbershop_invitations
-- Archivo : 20260604000001_fix_invitations_rls.sql
-- Fecha   : 2026-06-04
-- Autor   : Mart1nLopez
-- ============================================================
--
-- PROBLEMA CORREGIDO
--   Las policies inv_select_invited_email e inv_update contenían
--   subselects a auth.users:
--     (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
--
--   El rol 'authenticated' (con el que corren los queries de PostgREST)
--   no tiene permiso de SELECT sobre auth.users → error 42501.
--   Las policies RLS se evalúan bajo el rol del usuario que hace la
--   query, no bajo postgres, por lo que SECURITY DEFINER no aplica aquí.
--
-- SOLUCIÓN
--   Reemplazar el subselect por auth.email(), función que lee el email
--   directamente del JWT del usuario sin acceder a auth.users.
--
-- COMPATIBILIDAD
--   ✓ Supabase Cloud     — auth.email() es una función provista por Supabase Auth
--   ✓ PostgreSQL 17      — sin dependencias de versión
--   ✓ RLS                — funciona en contexto de policy (no requiere permisos extra)
--   ✓ auth.uid()         — no modificado
--   ✓ auth.email()       — lee del JWT claim 'email', sin tocar auth.users
--
-- IMPACTO EN DATOS
--   Ninguno. Solo se redefinen dos policies. Las filas existentes en
--   barbershop_invitations no se tocan.
--
-- IDEMPOTENCIA
--   DROP POLICY IF EXISTS garantiza que la migración no falla si se
--   ejecuta dos veces (por ejemplo, en un db reset).
--
-- ROLLBACK
--   Ver sección final.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: ELIMINAR LAS POLICIES CON EL PATRÓN ROTO
-- ============================================================

DROP POLICY IF EXISTS "inv_select_invited_email" ON public.barbershop_invitations;
DROP POLICY IF EXISTS "inv_update"               ON public.barbershop_invitations;


-- ============================================================
-- SECCIÓN 2: RECREAR CON auth.email()
-- ============================================================

-- El usuario invitado ve SU invitación (para aceptarla desde el dashboard).
-- auth.email() lee el email del JWT — sin acceso a auth.users.
CREATE POLICY "inv_select_invited_email"
  ON public.barbershop_invitations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND lower(email) = lower(auth.email())
  );

-- Actualización: el dueño cancela; el invitado actualiza vía función SECURITY DEFINER.
-- auth.email() en lugar de subselect a auth.users.
CREATE POLICY "inv_update"
  ON public.barbershop_invitations FOR UPDATE
  USING (
    auth.uid() = invited_by
    OR lower(email) = lower(auth.email())
  );


-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar en Supabase Studio tras aplicar.
-- ============================================================
--
-- 1. Confirmar que las policies existen con la definición correcta:
--
--    SELECT policyname, qual
--    FROM pg_policies
--    WHERE tablename = 'barbershop_invitations'
--      AND policyname IN ('inv_select_invited_email', 'inv_update');
--
--    Esperado: las dos filas deben mostrar 'auth.email()' en 'qual',
--    sin ninguna referencia a 'auth.users'.
--
-- 2. Confirmar que las otras policies no fueron tocadas:
--
--    SELECT policyname, cmd
--    FROM pg_policies
--    WHERE tablename = 'barbershop_invitations'
--    ORDER BY policyname;
--
--    Esperado: 5 policies — inv_delete_owner, inv_insert_owner,
--    inv_select_invited_email, inv_select_owner, inv_update.
--
-- 3. Smoke test desde SQL Editor como usuario autenticado:
--    (Requiere estar conectado con JWT de un usuario existente)
--    SELECT COUNT(*) FROM public.barbershop_invitations;
--    Esperado: número ≥ 0 sin error 42501.


-- ============================================================
-- ROLLBACK
-- Restaurar el patrón anterior (con el bug, solo para referencia).
-- En producción NO usar — restauraría el error 42501.
-- ============================================================
--
-- DROP POLICY IF EXISTS "inv_select_invited_email" ON public.barbershop_invitations;
-- DROP POLICY IF EXISTS "inv_update"               ON public.barbershop_invitations;
--
-- CREATE POLICY "inv_select_invited_email"
--   ON public.barbershop_invitations FOR SELECT
--   USING (
--     auth.uid() IS NOT NULL
--     AND lower(email) = lower(
--       (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
--     )
--   );
--
-- CREATE POLICY "inv_update"
--   ON public.barbershop_invitations FOR UPDATE
--   USING (
--     auth.uid() = invited_by
--     OR lower(email) = lower(
--       (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
--     )
--   );
-- ============================================================
