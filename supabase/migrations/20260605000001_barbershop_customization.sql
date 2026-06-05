-- ============================================================
-- MIGRACIÓN: FASE 3 — BARBERSHOP CUSTOMIZATION
-- Archivo : 20260605000001_barbershop_customization.sql
-- Fecha   : 2026-06-05
-- Autor   : Mart1nLopez
-- Requiere: 20260603224017_refactor_barbershops.sql (Fase 1)
-- ============================================================
--
-- OBJETIVO
--   Agregar columnas de personalización de la página pública a barbershops:
--     cover_image_url  → imagen de portada del hero en /barberia/[slug]
--     primary_color    → color primario de la marca (hex #RRGGBB)
--     secondary_color  → color secundario de la marca (hex #RRGGBB)
--     gallery_images   → galería de fotos (JSONB array de objetos {url, order})
--
--   Crear bucket de Storage 'barbershop-images' con políticas RLS.
--
-- DECISIÓN DE DISEÑO: columnas en barbershops (vs tabla separada)
--   description y logo_url ya residen en esta tabla. Estos campos son datos
--   de identidad pública del negocio — no preferencias de UI separables.
--   La tabla separada solo agrega valor con versioning o modo borrador,
--   que no es un requerimiento actual. Se evita el LEFT JOIN adicional.
--
-- IMPACTO EN SERVICIOS EXISTENTES
--   barbershopService.updateBarbershop        → Partial<Omit<Barbershop,...>> — OK
--   barbershopService.getBarbershopBySlug     → SELECT *                     — OK
--   barbershopService.getBarbershopByProfId   → barbershops(*)               — OK
--   barbershopPublicService.getPublicProfile  → lista explícita              — REQUIERE
--     actualización en el servicio TypeScript (ver Sprint 1)
--   createBarbershopForProfessional           → no lista nuevas columnas     — OK (defaults)
--   RLS policies en barbershops               → nuevos campos heredan todo   — OK
--   Funciones SECURITY DEFINER                → no leen nuevas columnas      — OK
--
-- DEFAULTS PARA DATOS EXISTENTES
--   cover_image_url  → NULL (sin portada por defecto)
--   primary_color    → '#3b5fe2' (color primario de Turnate — coherente si no personaliza)
--   secondary_color  → '#1a3abd' (complemento oscuro — contraste WCAG adecuado)
--   gallery_images   → '[]'::jsonb (galería vacía)
--
-- ROLLBACK: Ver sección final.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: VERIFICACIÓN DE PREREQUISITO
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'barbershops'
  ) THEN
    RAISE EXCEPTION
      'Tabla barbershops no encontrada. Ejecutar 20260603224017_refactor_barbershops.sql primero.';
  END IF;
END;
$$;


-- ============================================================
-- SECCIÓN 2: NUEVAS COLUMNAS EN barbershops
-- ============================================================

-- cover_image_url: URL de la imagen de portada del hero.
-- Nullable: la barbería puede no tener portada (el hero muestra gradiente por defecto).
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- primary_color: color primario de la marca en formato hex #RRGGBB.
-- NOT NULL con DEFAULT para garantizar que siempre haya un color válido.
-- CHECK previene CSS injection — solo acepta exactamente #RRGGBB.
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS primary_color TEXT
    NOT NULL DEFAULT '#3b5fe2'
    CONSTRAINT barbershops_primary_color_format
      CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$');

-- secondary_color: color de acento o secundario.
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS secondary_color TEXT
    NOT NULL DEFAULT '#1a3abd'
    CONSTRAINT barbershops_secondary_color_format
      CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$');

-- gallery_images: array JSONB de objetos { url: string, order: number }.
-- Estructura elegida sobre TEXT[] porque permite extender cada item con caption,
-- title o is_featured en el futuro sin migración de schema adicional.
-- NOT NULL DEFAULT '[]' garantiza que siempre sea un array tratable como lista.
-- CHECK jsonb_typeof = 'array' previene inserciones de objetos o escalares.
ALTER TABLE public.barbershops
  ADD COLUMN IF NOT EXISTS gallery_images JSONB
    NOT NULL DEFAULT '[]'::jsonb
    CONSTRAINT barbershops_gallery_is_array
      CHECK (jsonb_typeof(gallery_images) = 'array');


-- ============================================================
-- SECCIÓN 3: STORAGE BUCKET 'barbershop-images'
-- ============================================================
--
-- Bucket público para imágenes de barberías.
-- Estructura de paths (convenio — no enforced por DB):
--   {barbershop_id}/logo/{filename}    ← logo de la barbería
--   {barbershop_id}/cover/{filename}   ← imagen de portada del hero
--   {barbershop_id}/gallery/{filename} ← fotos de la galería
--
-- El barbershop_id en el path es la fuente de verdad para la verificación
-- de ownership en las políticas RLS de escritura (ver Sección 4).
--
-- Tipos MIME permitidos: formatos web comunes. El cliente comprime y convierte
-- a webp antes de subir via browser-image-compression (dependencia ya existente).
-- Tamaño máximo: 5 MB por archivo.
--

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barbershop-images',
  'barbershop-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- SECCIÓN 4: RLS POLICIES PARA storage.objects
-- ============================================================
--
-- DISEÑO DE SEGURIDAD:
--   storage.foldername(name) devuelve un TEXT[] con los segmentos del path.
--   Para el path '{barbershop_id}/logo/image.webp':
--     [1] = barbershop_id  ← lo que necesitamos para verificar ownership
--     [2] = 'logo'
--
--   La comparación b.id::text = (storage.foldername(name))[1] es segura:
--   - UUID como texto tiene formato canónico (xxxxxxxx-xxxx-...).
--   - Si el segmento no matchea ningún UUID en barbershops, la subquery
--     retorna 0 filas → auth.uid() NOT IN (...) → operación denegada.
--   - No hay riesgo de path traversal porque un segmento inválido simplemente
--     no matchea ninguna fila. No se necesita validación adicional del formato.
--

-- Lectura pública: cualquiera puede ver las imágenes (bucket ya es público,
-- pero la policy es necesaria para que RLS no bloquee las lecturas).
CREATE POLICY "barbershop_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'barbershop-images');

-- INSERT: solo el dueño registrado en barbershops puede subir imágenes.
CREATE POLICY "barbershop_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'barbershop-images'
    AND auth.uid() IN (
      SELECT b.owner_id
      FROM public.barbershops b
      WHERE b.id::text = (storage.foldername(name))[1]
    )
  );

-- UPDATE: misma restricción de ownership.
CREATE POLICY "barbershop_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'barbershop-images'
    AND auth.uid() IN (
      SELECT b.owner_id
      FROM public.barbershops b
      WHERE b.id::text = (storage.foldername(name))[1]
    )
  );

-- DELETE: el dueño puede eliminar imágenes de su propia barbería.
CREATE POLICY "barbershop_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'barbershop-images'
    AND auth.uid() IN (
      SELECT b.owner_id
      FROM public.barbershops b
      WHERE b.id::text = (storage.foldername(name))[1]
    )
  );


-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar manualmente en Supabase SQL Editor tras aplicar.
-- ============================================================
--
-- 1. Cuatro nuevas columnas existentes:
--    SELECT column_name, data_type, column_default, is_nullable
--    FROM information_schema.columns
--    WHERE table_schema = 'public'
--      AND table_name   = 'barbershops'
--      AND column_name  IN ('cover_image_url','primary_color','secondary_color','gallery_images');
--    Esperado: 4 filas
--
-- 2. Ningún NULL en columnas NOT NULL con DEFAULT:
--    SELECT COUNT(*) FROM public.barbershops WHERE primary_color   IS NULL;  → 0
--    SELECT COUNT(*) FROM public.barbershops WHERE secondary_color IS NULL;  → 0
--    SELECT COUNT(*) FROM public.barbershops WHERE gallery_images  IS NULL;  → 0
--
-- 3. Defaults aplicados a datos existentes:
--    SELECT DISTINCT primary_color FROM public.barbershops;    → '#3b5fe2'
--    SELECT DISTINCT secondary_color FROM public.barbershops;  → '#1a3abd'
--    SELECT DISTINCT gallery_images FROM public.barbershops;   → '[]'
--
-- 4. Bucket de storage creado:
--    SELECT id, name, public, file_size_limit FROM storage.buckets
--    WHERE id = 'barbershop-images';
--    Esperado: 1 fila con public = true, file_size_limit = 5242880
--
-- 5. Cuatro policies de storage creadas:
--    SELECT policyname FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname LIKE 'barbershop_images_%';
--    Esperado: 4 filas
--
-- 6. Constraints de validación de colores:
--    SELECT constraint_name FROM information_schema.table_constraints
--    WHERE table_schema = 'public' AND table_name = 'barbershops'
--      AND constraint_name LIKE 'barbershops_%color%';
--    Esperado: 2 filas (primary_color_format, secondary_color_format)
--
-- 7. CHECK de galería:
--    SELECT constraint_name FROM information_schema.table_constraints
--    WHERE table_schema = 'public' AND table_name = 'barbershops'
--      AND constraint_name = 'barbershops_gallery_is_array';
--    Esperado: 1 fila
--
-- 8. Tablas existentes intactas:
--    SELECT COUNT(*) FROM professionals;   → mismo valor pre-migración
--    SELECT COUNT(*) FROM barbershops;     → mismo valor pre-migración
--    SELECT COUNT(*) FROM barbershop_members; → mismo valor pre-migración


-- ============================================================
-- ROLLBACK COMPLETO
-- Ejecutar en orden. Los datos de imágenes en storage deben
-- eliminarse manualmente antes de borrar el bucket.
-- ============================================================
--
-- PASO 1: Eliminar policies de storage
-- DROP POLICY IF EXISTS "barbershop_images_owner_delete" ON storage.objects;
-- DROP POLICY IF EXISTS "barbershop_images_owner_update" ON storage.objects;
-- DROP POLICY IF EXISTS "barbershop_images_owner_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "barbershop_images_public_read"  ON storage.objects;
--
-- PASO 2: Eliminar bucket (solo si está vacío — verificar primero)
-- SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'barbershop-images';
-- DELETE FROM storage.buckets WHERE id = 'barbershop-images';
--
-- PASO 3: Eliminar columnas de barbershops
-- (DROP COLUMN CASCADE elimina automáticamente los CHECK constraints asociados)
-- ALTER TABLE public.barbershops
--   DROP COLUMN IF EXISTS gallery_images,
--   DROP COLUMN IF EXISTS secondary_color,
--   DROP COLUMN IF EXISTS primary_color,
--   DROP COLUMN IF EXISTS cover_image_url;
-- ============================================================
