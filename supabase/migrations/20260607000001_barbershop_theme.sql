-- ============================================================
-- MIGRACIÓN: FASE 4 — BARBERSHOP THEME
-- Archivo : 20260607000001_barbershop_theme.sql
-- Fecha   : 2026-06-07
-- Requiere: 20260605000001_barbershop_customization.sql (Fase 3)
-- ============================================================
--
-- OBJETIVO
--   Agregar columna `theme` a barbershops para que el owner elija
--   un tema visual prediseñado en /dashboard/barberia/personalizar.
--
-- DECISIÓN DE DISEÑO
--   - Sin CHECK constraint: la validación es responsabilidad de TypeScript
--     (ThemeId en types/index.ts). Esto permite agregar nuevos temas a la
--     aplicación sin necesidad de una nueva migración de DB.
--
--   - primary_color y secondary_color se MANTIENEN como overrides para el
--     futuro modo 'custom'. Si theme = 'custom', la aplicación usará esos
--     valores en lugar de los del tema prediseñado.
--
--   - DEFAULT 'luxury-gold': todas las barberías existentes quedan con el
--     tema Luxury Gold, que coincide con la paleta implementada en Fase 1.
--
-- IMPACTO EN SERVICIOS EXISTENTES
--   barbershopPublicService.getBarbershopPublicProfile
--     → SELECT ya actualizado en TypeScript para incluir 'theme'
--   barbershopService.updateBarbershop
--     → Partial<Omit<Barbershop,...>> — acepta { theme } sin cambios
--   useBarbershop.updateBarbershop
--     → idem — actualiza estado local via { ...prev, ...data }
--   createBarbershopForProfessional
--     → no incluye theme en el INSERT → DEFAULT 'luxury-gold' aplica
--
-- ROLLBACK
--   ALTER TABLE public.barbershops DROP COLUMN IF EXISTS theme;
-- ============================================================


-- ============================================================
-- SECCIÓN 1: VERIFICACIÓN DE PREREQUISITO
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'barbershops'
      AND column_name  = 'primary_color'
  ) THEN
    RAISE EXCEPTION
      'Columna primary_color no encontrada. Ejecutar 20260605000001_barbershop_customization.sql primero.';
  END IF;
END;
$$;


-- ============================================================
-- SECCIÓN 2: NUEVA COLUMNA theme
-- ============================================================

ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'luxury-gold';


-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN (ejecutar manualmente)
-- ============================================================
--
-- 1. Columna existe:
--    SELECT column_name, data_type, column_default
--    FROM information_schema.columns
--    WHERE table_schema = 'public'
--      AND table_name   = 'barbershops'
--      AND column_name  = 'theme';
--    Esperado: 1 fila, column_default = 'luxury-gold'
--
-- 2. Todas las filas existentes tienen el default:
--    SELECT COUNT(*) FROM public.barbershops WHERE theme != 'luxury-gold';
--    Esperado: 0
--
-- 3. Sin NULLs:
--    SELECT COUNT(*) FROM public.barbershops WHERE theme IS NULL;
--    Esperado: 0
-- ============================================================
