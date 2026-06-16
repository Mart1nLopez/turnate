-- ============================================================
-- MIGRACIÓN: AGREGAR VALOR 'admin' AL ENUM barbershop_member_role
-- Archivo  : 20260615000003_add_admin_role.sql
-- Fecha    : 2026-06-15
--
-- POR QUÉ ESTA MIGRACIÓN ESTÁ SOLA:
--   PostgreSQL 12+ prohíbe usar un valor de ENUM recién agregado (ADD VALUE)
--   en la misma transacción que lo creó (SQLSTATE 55P04).
--   Supabase ejecuta cada archivo de migración dentro de una transacción única.
--   Por lo tanto, cualquier uso de 'admin' en funciones, políticas o triggers
--   debe ir en una migración separada (20260615000004) que se ejecute en una
--   transacción posterior, cuando 'admin' ya esté comprometido en el catálogo.
--
-- IDEMPOTENCIA:
--   IF NOT EXISTS garantiza que re-ejecuciones no fallen.
-- ============================================================

ALTER TYPE public.barbershop_member_role ADD VALUE IF NOT EXISTS 'admin' AFTER 'owner';
