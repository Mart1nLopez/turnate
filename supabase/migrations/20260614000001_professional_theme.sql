-- ============================================================
-- MIGRACIÓN: PROFESSIONAL THEME
-- Archivo : 20260614000001_professional_theme.sql
-- Fecha   : 2026-06-14
-- ============================================================
--
-- OBJETIVO
--   Agregar columna `theme` a professionals para que cada profesional
--   elija un tema visual prediseñado desde /dashboard/perfil.
--
-- DECISIÓN DE DISEÑO
--   - Sin CHECK constraint: validación responsabilidad de TypeScript (ThemeId).
--     Permite agregar nuevos temas sin nueva migración.
--   - DEFAULT 'luxury-gold': alineado con el design system actual de la
--     página pública /[slug] (paleta Black & Gold ya implementada).
--   - Reutiliza exactamente los mismos temas de barbershops (BARBERSHOP_THEMES).
--
-- ROLLBACK
--   ALTER TABLE public.professionals DROP COLUMN IF EXISTS theme;
-- ============================================================

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'luxury-gold';
