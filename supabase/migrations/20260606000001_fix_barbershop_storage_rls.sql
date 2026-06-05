-- ============================================================
-- MIGRACIÓN CORRECTIVA: RLS POLICIES — BUCKET barbershop-images
-- Archivo : 20260606000001_fix_barbershop_storage_rls.sql
-- Fecha   : 2026-06-06
-- Autor   : Mart1nLopez
-- Requiere: 20260605000001_barbershop_customization.sql
-- ============================================================
--
-- PROBLEMA (auditado el 2026-06-06)
-- ─────────────────────────────────
-- Las tres policies de escritura creadas en 20260605000001 contienen
-- una expresión con ambigüedad de resolución de columna:
--
--   SELECT b.owner_id
--   FROM public.barbershops b
--   WHERE b.id::text = (storage.foldername(name))[1]
--
-- PostgreSQL resuelve el `name` no calificado buscando primero en el
-- FROM local de la subquery. Como public.barbershops tiene una columna
-- llamada `name` (el nombre del negocio: "Barbería El Señor"), la
-- referencia queda capturada por ese scope — en lugar de referir a
-- storage.objects.name (el path del archivo: "uuid/logo/img.webp").
--
-- Evidencia en pg_policies (compilado por PostgreSQL):
--   WHERE ((b.id)::text = (storage.foldername(b.name))[1])
--
-- Consecuencia:
--   storage.foldername("Barbería El Señor") nunca coincide con ningún
--   UUID → subquery retorna 0 filas → auth.uid() IN (∅) = FALSE →
--   INSERT / UPDATE / DELETE fallan con:
--   "new row violates row-level security policy"
--
-- CAUSA RAÍZ
-- ──────────
-- Regla de scoping de columnas en PostgreSQL:
--   Dentro de una subquery, un nombre de columna no calificado se
--   resuelve primero en las tablas del FROM local, y solo si no se
--   encuentra ahí se busca en los scopes externos. La tabla
--   barbershops introduce la columna `name`, que sombrea a
--   storage.objects.name antes de que PostgreSQL pueda buscarla
--   en el contexto externo de la policy.
--
-- CORRECCIÓN
-- ──────────
-- Mover (storage.foldername(name))[1] al scope externo de la
-- expresión de policy (WITH CHECK / USING), donde `name` es
-- inequívocamente storage.objects.name.
--
-- La subquery pasa a filtrar barbershops exclusivamente por
-- owner_id = auth.uid(), sin referenciar ninguna columna ambigua.
--
-- Patrón correcto aplicado a las tres policies:
--
--   (storage.foldername(name))[1] IN (
--     SELECT id::text
--     FROM public.barbershops
--     WHERE owner_id = auth.uid()
--   )
--
-- Aquí `name` está en el scope de storage.objects (la tabla de la
-- policy) y la subquery no menciona ninguna columna `name` — solo
-- filtra por owner_id, eliminando toda ambigüedad posible.
--
-- ALCANCE
-- ───────
-- Modifica únicamente: storage.objects (3 policies de escritura).
-- No modifica: tablas de aplicación, columnas, funciones, bucket,
--              policy de lectura, código TypeScript.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: PRE-VERIFICACIÓN
-- ============================================================

DO $$
BEGIN
  -- El bucket debe existir (creado por 20260605000001).
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'barbershop-images'
  ) THEN
    RAISE EXCEPTION
      'Bucket barbershop-images no encontrado. '
      'Ejecutar 20260605000001_barbershop_customization.sql primero.';
  END IF;

  -- La tabla barbershops debe existir (creada por 20260603224017).
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'barbershops'
  ) THEN
    RAISE EXCEPTION
      'Tabla public.barbershops no encontrada. '
      'Ejecutar 20260603224017_refactor_barbershops.sql primero.';
  END IF;

  -- Aviso si las policies defectuosas ya fueron eliminadas manualmente.
  -- No es un error: DROP IF EXISTS a continuación es idempotente.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename   = 'objects'
      AND policyname  = 'barbershop_images_owner_insert'
  ) THEN
    RAISE WARNING
      'Policy barbershop_images_owner_insert no encontrada en pg_policies. '
      'Puede haber sido eliminada manualmente. Se procede con la recreación.';
  END IF;
END;
$$;


-- ============================================================
-- SECCIÓN 2: ELIMINAR POLICIES DEFECTUOSAS
-- ============================================================
--
-- IF EXISTS garantiza idempotencia: si ya fueron eliminadas
-- manualmente, la migración no lanza error y puede re-ejecutarse.
--

DROP POLICY IF EXISTS "barbershop_images_owner_insert" ON storage.objects;
DROP POLICY IF EXISTS "barbershop_images_owner_update" ON storage.objects;
DROP POLICY IF EXISTS "barbershop_images_owner_delete" ON storage.objects;


-- ============================================================
-- SECCIÓN 3: RECREAR POLICIES CORRECTAS
-- ============================================================
--
-- DISEÑO DE LA CORRECCIÓN
-- ───────────────────────
-- (storage.foldername(name))[1] se evalúa en el scope externo de
-- la expresión de policy (WITH CHECK / USING), donde `name` es
-- inequívocamente storage.objects.name (el path del archivo).
--
-- Traza para el path "3f8a7b12-.../logo/abc.webp":
--   storage.foldername("3f8a7b12-.../logo/abc.webp")
--     → TEXT[] = {'3f8a7b12-...', 'logo'}
--   [1] = '3f8a7b12-...'   ← UUID de la barbería ✓
--
-- La subquery retorna todos los barbershop IDs del usuario autenticado:
--   SELECT id::text FROM public.barbershops WHERE owner_id = auth.uid()
--
-- Si el UUID del path está en ese conjunto → operación permitida.
-- Si el usuario no tiene barberías, o el path no corresponde a la
-- suya, la subquery retorna ∅ → operación denegada.
--
-- COMPATIBILIDAD CON CARPETAS FUTURAS
-- ────────────────────────────────────
-- El patrón funciona para cualquier sub-carpeta dentro del bucket:
--   {barbershop_id}/logo/...     ✓
--   {barbershop_id}/cover/...    ✓
--   {barbershop_id}/gallery/...  ✓ (carpeta futura)
--   {barbershop_id}/banner/...   ✓ (cualquier nombre)
--
-- El primer segmento del path [1] siempre es el barbershop_id.
-- No se requiere listar carpetas explícitamente.
--
-- PROPIETARIOS CON MÚLTIPLES BARBERÍAS
-- ──────────────────────────────────────
-- Si auth.uid() es owner de más de una barbería, la subquery retorna
-- múltiples UUIDs. El IN acepta el conjunto completo correctamente.
--

-- INSERT: el dueño sube nuevas imágenes a la carpeta de su barbería.
CREATE POLICY "barbershop_images_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'barbershop-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM public.barbershops
      WHERE owner_id = auth.uid()
    )
  );

-- UPDATE: el dueño puede sobreescribir imágenes existentes (upsert=true).
--   USING: verifica ownership sobre la fila existente antes de actualizarla.
--   Sin WITH CHECK independiente: el path (name) no cambia en un UPDATE de
--   contenido — el mismo USING es suficiente para validar la operación.
CREATE POLICY "barbershop_images_owner_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'barbershop-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM public.barbershops
      WHERE owner_id = auth.uid()
    )
  );

-- DELETE: el dueño puede eliminar imágenes de su barbería.
CREATE POLICY "barbershop_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'barbershop-images'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text
      FROM public.barbershops
      WHERE owner_id = auth.uid()
    )
  );


-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar en Supabase SQL Editor tras aplicar la migración.
-- ============================================================
--
-- 1. Las cuatro policies del bucket existen (read + 3 write):
--
--    SELECT policyname, cmd
--    FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname LIKE 'barbershop_images_%'
--    ORDER BY policyname;
--    Esperado: 4 filas
--
--
-- 2. Las policies corregidas NO contienen 'b.name':
--
--    SELECT policyname, qual, with_check
--    FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname IN (
--        'barbershop_images_owner_insert',
--        'barbershop_images_owner_update',
--        'barbershop_images_owner_delete'
--      );
--    Esperado: las columnas qual / with_check contienen 'owner_id'
--              y 'foldername', pero NO contienen 'b.name'.
--
--
-- 3. La policy de lectura sigue intacta:
--
--    SELECT policyname, cmd, qual
--    FROM pg_policies
--    WHERE schemaname = 'storage' AND tablename = 'objects'
--      AND policyname = 'barbershop_images_public_read';
--    Esperado: 1 fila con cmd = 'SELECT', qual contiene 'barbershop-images'
--
--
-- 4. Confirmar que barbershops tiene el índice de owner_id
--    (necesario para que la subquery sea eficiente):
--
--    SELECT indexname, indexdef
--    FROM pg_indexes
--    WHERE tablename = 'barbershops'
--      AND indexdef LIKE '%owner_id%';
--    Esperado: 1 fila (idx_barbershops_owner_id, creado en Fase 1)
--
--
-- 5. Prueba funcional (reemplazar UUID con datos reales):
--
--    -- Verificar que el dueño existe y tiene owner_id correcto:
--    SELECT id, name, owner_id
--    FROM public.barbershops
--    LIMIT 5;
--
--    -- Luego desde el cliente web: subir una imagen en
--    -- /dashboard/barberia/personalizar y confirmar que ya no
--    -- aparece "new row violates row-level security policy".
-- ============================================================


-- ============================================================
-- ROLLBACK COMPLETO
-- Restaura las policies defectuosas del estado anterior.
-- ADVERTENCIA: el rollback reintroduce el bug de RLS.
--              Usar solo como último recurso.
-- ============================================================
--
-- PASO 1: Eliminar las policies corregidas
-- DROP POLICY IF EXISTS "barbershop_images_owner_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "barbershop_images_owner_update" ON storage.objects;
-- DROP POLICY IF EXISTS "barbershop_images_owner_delete" ON storage.objects;
--
-- PASO 2: Recrear las policies defectuosas (estado de 20260605000001)
--
-- CREATE POLICY "barbershop_images_owner_insert"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'barbershop-images'
--     AND auth.uid() IN (
--       SELECT b.owner_id
--       FROM public.barbershops b
--       WHERE b.id::text = (storage.foldername(name))[1]
--     )
--   );
--
-- CREATE POLICY "barbershop_images_owner_update"
--   ON storage.objects FOR UPDATE
--   USING (
--     bucket_id = 'barbershop-images'
--     AND auth.uid() IN (
--       SELECT b.owner_id
--       FROM public.barbershops b
--       WHERE b.id::text = (storage.foldername(name))[1]
--     )
--   );
--
-- CREATE POLICY "barbershop_images_owner_delete"
--   ON storage.objects FOR DELETE
--   USING (
--     bucket_id = 'barbershop-images'
--     AND auth.uid() IN (
--       SELECT b.owner_id
--       FROM public.barbershops b
--       WHERE b.id::text = (storage.foldername(name))[1]
--     )
--   );
--
-- VERIFICACIÓN POST-ROLLBACK:
--   SELECT policyname FROM pg_policies
--   WHERE schemaname = 'storage' AND tablename = 'objects'
--     AND policyname LIKE 'barbershop_images_%';
--   Esperado: 4 filas (igual que antes del rollback)
-- ============================================================
