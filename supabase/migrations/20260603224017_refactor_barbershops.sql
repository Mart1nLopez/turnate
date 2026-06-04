-- ============================================================
-- MIGRACIÓN: FASE 1 — BARBERSHOPS (MULTI-TENANT ORGANIZACIONAL)
-- Archivo : 20260603224017_refactor_barbershops.sql
-- Fecha   : 2026-06-03
-- Autor   : Mart1nLopez
-- Revisión: Seguridad y compatibilidad verificadas
-- ============================================================
--
-- ALCANCE
--   Crea las entidades barbershops, barbershop_members y
--   barbershop_invitations como capa organizacional y analítica.
--   NO modifica ninguna tabla existente.
--   El flujo de reservas (appointments.professional_id) queda intacto.
--
-- PREREQUISITOS VERIFICADOS
--   ✓ PostgreSQL 17           (config.toml: major_version = 17)
--   ✓ pg_cron >= 1.6          (20260529221251: extension pg_cron; PG17 → v1.6+)
--   ✓ token generado sin pgcrypto  (sha256 + uuid_send, built-in desde PG 13)
--   ✓ set_updated_at()        no existe aún — CREATE OR REPLACE es seguro
--   ✓ Sin triggers previos    verificado en 20260529221251
--   ✓ Sin conflictos RLS      nuevas tablas son independientes
--   ✓ auto_expose_new_tables  = false (default post 2026-05-30) — GRANTs explícitos
--
-- CORRECCIONES DE SEGURIDAD APLICADAS (vs. borrador anterior)
--   1. GRANTs: eliminados TRIGGER, TRUNCATE y REFERENCES de anon/authenticated.
--      TRUNCATE bypasa RLS — no debe otorgarse a roles de API.
--   2. inv_select_public USING (true): reemplazada por dos policies específicas
--      + función get_invitation_preview() SECURITY DEFINER.
--      La tabla de invitaciones ya no es públicamente legible.
--   3. REVOKE FROM PUBLIC: corregido de "FROM anon, authenticated" a "FROM PUBLIC".
--      PostgreSQL otorga EXECUTE a PUBLIC al crear funciones; revocar solo de roles
--      específicos no tiene efecto si PUBLIC sigue teniendo el privilegio.
--   4. pg_cron: compatibilidad verificada. PG17 trae pg_cron 1.6+.
--      DO block existente ya maneja idempotencia correctamente.
--
-- ROLLBACK
--   Ver sección final. Impacto en datos existentes: CERO.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: TIPOS ENUMERADOS
-- ============================================================

CREATE TYPE public.barbershop_member_role AS ENUM (
  'owner',  -- Dueño operacional de la barbería
  'barber'  -- Barbero miembro del equipo
);

CREATE TYPE public.barbershop_member_status AS ENUM (
  'active',   -- Membresía vigente
  'inactive', -- Membresía desactivada (historial)
  'pending'   -- Reservado para uso futuro
);

CREATE TYPE public.invitation_status AS ENUM (
  'pending',   -- Invitación enviada, esperando respuesta
  'accepted',  -- Invitación aceptada
  'expired',   -- Vencida por pg_cron
  'cancelled'  -- Cancelada por el dueño
);


-- ============================================================
-- SECCIÓN 2: TABLA PRINCIPAL — barbershops
-- ============================================================

CREATE TABLE public.barbershops (
  id            UUID        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dueño legal del registro. Fuente de verdad para permisos de administración.
  -- ON DELETE RESTRICT: no se puede eliminar un usuario con barbería activa.
  -- Distinto a barbershop_members.role='owner' (rol operacional de membresía).
  owner_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Identidad del negocio
  name          TEXT        NOT NULL,
  slug          TEXT        NOT NULL,

  -- Descripción y branding
  description   TEXT,
  logo_url      TEXT,
  phone         TEXT,
  social_links  JSONB       NOT NULL DEFAULT '{}',

  -- Identidad legal (Chile)
  -- UNIQUE estándar en PG: múltiples NULLs son permitidos (campo opcional)
  company_rut   TEXT,

  -- Ubicación estructurada (Chile)
  address       TEXT,         -- Calle y número (ej: "Av. Providencia 1234")
  city          TEXT,         -- Ciudad (ej: "Santiago")
  region        TEXT,         -- Región (ej: "Región Metropolitana")
  location      TEXT,         -- Campo libre para display en UI y mapas
                              -- Consistente con professionals.location
  map_embed_url TEXT,

  -- Estado de la barbería en la plataforma
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  is_approved   BOOLEAN     NOT NULL DEFAULT false,

  -- Timestamps
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT barbershops_slug_key        UNIQUE (slug),
  CONSTRAINT barbershops_company_rut_key UNIQUE (company_rut)
);

COMMENT ON TABLE  public.barbershops IS
  'Entidad organizacional y analítica. NO participa en el flujo de reservas. '
  'Las citas usan appointments.professional_id directamente.';
COMMENT ON COLUMN public.barbershops.owner_id IS
  'Dueño legal del registro. Fuente de verdad para permisos de admin. '
  'barbershop_members.role=owner es el reflejo operacional del mismo hecho.';
COMMENT ON COLUMN public.barbershops.company_rut IS
  'RUT de empresa chilena (ej: 76.123.456-7). Opcional.';
COMMENT ON COLUMN public.barbershops.location IS
  'Campo libre para display. Puede derivarse de address + city + region.';


-- ============================================================
-- SECCIÓN 3: TABLA DE MEMBRESÍAS — barbershop_members
-- ============================================================

CREATE TABLE public.barbershop_members (
  id              UUID                            NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id   UUID                            NOT NULL
    REFERENCES public.barbershops(id)   ON DELETE CASCADE,
  professional_id UUID                            NOT NULL
    REFERENCES public.professionals(id) ON DELETE CASCADE,
  role            public.barbershop_member_role   NOT NULL DEFAULT 'barber',
  status          public.barbershop_member_status NOT NULL DEFAULT 'active',
  joined_at       TIMESTAMPTZ                     NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ                     NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ                     NOT NULL DEFAULT now(),

  CONSTRAINT barbershop_members_unique_pair UNIQUE (barbershop_id, professional_id)
);

COMMENT ON TABLE public.barbershop_members IS
  'Relación entre profesionales y barberías. '
  'Un profesional puede tener solo UNA membresía activa simultánea '
  '(enforced por índice parcial). Los registros inactivos se conservan como historial.';

-- Un profesional puede tener múltiples membresías inactivas (historial),
-- pero solo UNA activa simultánea.
CREATE UNIQUE INDEX barbershop_members_one_active_per_professional
  ON public.barbershop_members (professional_id)
  WHERE (status = 'active');


-- ============================================================
-- SECCIÓN 4: TABLA DE INVITACIONES — barbershop_invitations
-- ============================================================

CREATE TABLE public.barbershop_invitations (
  id            UUID                          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  barbershop_id UUID                          NOT NULL
    REFERENCES public.barbershops(id)  ON DELETE CASCADE,
  email         TEXT                          NOT NULL,
  -- Token de 64 caracteres hex (32 bytes = 256 bits de SHA256).
  -- sha256(uuid_send || uuid_send): built-in desde PG 13, sin dependencias de extensión.
  -- Entropía efectiva: 244 bits (dos UUID v4 × 122 bits c/u). Imposible de enumerar.
  token         TEXT                          NOT NULL UNIQUE
    DEFAULT encode(sha256(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid())), 'hex'),
  role          public.barbershop_member_role NOT NULL DEFAULT 'barber',
  status        public.invitation_status      NOT NULL DEFAULT 'pending',
  -- ON DELETE CASCADE: si el dueño es eliminado, sus invitaciones también.
  -- En práctica, barbershops.owner_id RESTRICT previene llegar a este caso.
  invited_by    UUID                          NOT NULL
    REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at    TIMESTAMPTZ                   NOT NULL DEFAULT now() + INTERVAL '7 days',
  created_at    TIMESTAMPTZ                   NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.barbershop_invitations IS
  'Invitaciones para unirse a una barbería. '
  'La tabla NO es públicamente legible. El acceso anon se gestiona '
  'exclusivamente a través de get_invitation_preview(token).';

-- Solo puede existir UNA invitación pending por (barbería, email).
-- lower(email) normaliza capitalización.
-- Permite múltiples registros históricos (aceptados, expirados, cancelados).
-- El índice parcial es lo que permite reinvitar tras expiración o cancelación.
CREATE UNIQUE INDEX barbershop_invitations_unique_pending
  ON public.barbershop_invitations (barbershop_id, lower(email))
  WHERE (status = 'pending');


-- ============================================================
-- SECCIÓN 5: ÍNDICES DE RENDIMIENTO
-- ============================================================

-- barbershops
-- (slug e company_rut ya tienen índice por sus constraints UNIQUE)
CREATE INDEX idx_barbershops_owner_id  ON public.barbershops (owner_id);
CREATE INDEX idx_barbershops_is_active ON public.barbershops (is_active);
CREATE INDEX idx_barbershops_city      ON public.barbershops (city)   WHERE city   IS NOT NULL;
CREATE INDEX idx_barbershops_region    ON public.barbershops (region) WHERE region IS NOT NULL;

-- barbershop_members
CREATE INDEX idx_bm_barbershop_id   ON public.barbershop_members (barbershop_id);
CREATE INDEX idx_bm_professional_id ON public.barbershop_members (professional_id);
CREATE INDEX idx_bm_status          ON public.barbershop_members (status);

-- barbershop_invitations
-- (token ya tiene índice por la constraint UNIQUE inline)
CREATE INDEX idx_inv_email      ON public.barbershop_invitations (lower(email));
CREATE INDEX idx_inv_barbershop ON public.barbershop_invitations (barbershop_id);
CREATE INDEX idx_inv_status     ON public.barbershop_invitations (status);
-- Índice parcial para el job de expiración (solo escanea filas pending)
CREATE INDEX idx_inv_expires_at ON public.barbershop_invitations (expires_at)
  WHERE (status = 'pending');


-- ============================================================
-- SECCIÓN 6: FUNCIÓN UTILITARIA Y TRIGGERS
-- ============================================================

-- Verificado: set_updated_at() NO existe en el schema actual.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER barbershops_set_updated_at
  BEFORE UPDATE ON public.barbershops
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER barbershop_members_set_updated_at
  BEFORE UPDATE ON public.barbershop_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ============================================================
-- SECCIÓN 7: FUNCIONES DE ANALÍTICA (SECURITY DEFINER)
-- ============================================================

-- 7.1 Estadísticas agregadas de la barbería en un rango de fechas
--
-- NOTAS DE DISEÑO:
--   Revenue: via JOIN a services.price (appointments NO tiene columna price).
--     Limitación conocida: precio actual, no el precio al momento de la reserva.
--     Deuda técnica heredada del sistema. Ver dashboardService.ts y analyticsService.ts.
--   status = 'completed': consistente con dashboardService.ts línea 91.
--     analyticsService.ts usa incorrectamente 'confirmed' — NO replicamos ese bug.
--   Filtro por start_time: consistente con dashboardService.ts.
--
CREATE OR REPLACE FUNCTION public.get_barbershop_stats(
  p_barbershop_id UUID,
  p_start_date    TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date      TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  total_members          BIGINT,
  completed_appointments BIGINT,
  upcoming_appointments  BIGINT,
  cancelled_appointments BIGINT,
  unique_clients         BIGINT,
  avg_rating             NUMERIC,
  total_reviews          BIGINT,
  total_revenue          NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access_denied'
      USING HINT = 'Solo el dueño puede consultar las estadísticas de esta barbería';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(DISTINCT bm.professional_id)::BIGINT
      AS total_members,

    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::BIGINT
      AS completed_appointments,

    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'confirmed')::BIGINT
      AS upcoming_appointments,

    COUNT(DISTINCT a.id) FILTER (
      WHERE a.status IN ('cancelled_by_pro', 'cancelled_by_client')
    )::BIGINT
      AS cancelled_appointments,

    COUNT(DISTINCT a.client_id) FILTER (WHERE a.status = 'completed')::BIGINT
      AS unique_clients,

    ROUND(COALESCE(AVG(r.rating), 0)::NUMERIC, 2)
      AS avg_rating,

    COUNT(DISTINCT r.id)::BIGINT
      AS total_reviews,

    COALESCE(
      SUM(s.price) FILTER (WHERE a.status = 'completed'),
      0
    )::NUMERIC
      AS total_revenue

  FROM public.barbershop_members bm

  LEFT JOIN public.appointments a
    ON  a.professional_id = bm.professional_id
    AND a.start_time BETWEEN p_start_date AND p_end_date

  LEFT JOIN public.services s
    ON  s.id = a.service_id

  LEFT JOIN public.reviews r
    ON  r.professional_id = bm.professional_id
    AND r.created_at BETWEEN p_start_date AND p_end_date

  WHERE bm.barbershop_id = p_barbershop_id
    AND bm.status = 'active';
END;
$$;


-- 7.2 Estadísticas desglosadas por miembro
CREATE OR REPLACE FUNCTION public.get_barbershop_member_stats(
  p_barbershop_id UUID,
  p_start_date    TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date      TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  professional_id        UUID,
  professional_name      TEXT,
  professional_slug      TEXT,
  role                   public.barbershop_member_role,
  completed_appointments BIGINT,
  avg_rating             NUMERIC,
  total_revenue          NUMERIC,
  unique_clients         BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  SELECT
    bm.professional_id,
    p.name,
    p.slug,
    bm.role,

    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::BIGINT
      AS completed_appointments,

    ROUND(COALESCE(AVG(r.rating), 0)::NUMERIC, 2)
      AS avg_rating,

    COALESCE(
      SUM(s.price) FILTER (WHERE a.status = 'completed'),
      0
    )::NUMERIC
      AS total_revenue,

    COUNT(DISTINCT a.client_id) FILTER (WHERE a.status = 'completed')::BIGINT
      AS unique_clients

  FROM public.barbershop_members bm
  JOIN public.professionals p ON p.id = bm.professional_id

  LEFT JOIN public.appointments a
    ON  a.professional_id = bm.professional_id
    AND a.start_time BETWEEN p_start_date AND p_end_date

  LEFT JOIN public.services s ON s.id = a.service_id

  LEFT JOIN public.reviews r
    ON  r.professional_id = bm.professional_id
    AND r.created_at BETWEEN p_start_date AND p_end_date

  WHERE bm.barbershop_id = p_barbershop_id
    AND bm.status = 'active'
  GROUP BY bm.professional_id, p.name, p.slug, bm.role;
END;
$$;


-- ============================================================
-- SECCIÓN 8: FUNCIONES OPERACIONALES (SECURITY DEFINER)
-- ============================================================

-- 8.1 Vista previa de invitación para la página pública /invitacion/[token]
--
-- DISEÑO DE SEGURIDAD:
--   Reemplaza la policy "inv_select_public USING (true)".
--   La tabla barbershop_invitations NO es públicamente legible.
--   Esta función (callable por anon) devuelve SOLO los campos necesarios
--   para mostrar la página de preview, sin exponer email, invited_by ni historial.
--   Solo devuelve datos si la invitación está pending (no expirada, no aceptada).
--
CREATE OR REPLACE FUNCTION public.get_invitation_preview(p_token TEXT)
RETURNS TABLE (
  barbershop_id   UUID,
  barbershop_name TEXT,
  barbershop_logo TEXT,
  role            public.barbershop_member_role,
  expires_at      TIMESTAMPTZ,
  is_valid        BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.name,
    b.logo_url,
    i.role,
    i.expires_at,
    (i.status = 'pending' AND i.expires_at > now())
  FROM public.barbershop_invitations i
  JOIN public.barbershops b ON b.id = i.barbershop_id
  WHERE i.token  = p_token
    AND i.status = 'pending';
  -- Si el token no existe, expiró o fue aceptado/cancelado: 0 filas devueltas.
  -- El frontend interpreta 0 filas como invitación inválida.
END;
$$;


-- 8.2 Aceptar invitación (SECURITY DEFINER para insertar en barbershop_members)
--
-- La policy bm_insert_owner requiere ser dueño de la barbería.
-- Esta función actúa como intermediario seguro para el flujo de aceptación,
-- permitiendo que el invitado se agregue sin tener INSERT directo en la tabla.
--
CREATE OR REPLACE FUNCTION public.accept_barbershop_invitation(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation      public.barbershop_invitations%ROWTYPE;
  v_professional_id UUID;
  v_user_email      TEXT;
BEGIN
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_invitation
  FROM public.barbershop_invitations
  WHERE token        = p_token
    AND status       = 'pending'
    AND expires_at   > now()
    AND lower(email) = lower(v_user_email);

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'invitation_not_found_or_expired');
  END IF;

  SELECT id INTO v_professional_id
  FROM public.professionals
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_professional_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'professional_profile_not_found');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.barbershop_members
    WHERE professional_id = v_professional_id AND status = 'active'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'already_member_of_another_barbershop');
  END IF;

  INSERT INTO public.barbershop_members (barbershop_id, professional_id, role, status)
  VALUES (v_invitation.barbershop_id, v_professional_id, v_invitation.role, 'active');

  UPDATE public.barbershop_invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'barbershop_id', v_invitation.barbershop_id);
END;
$$;


-- 8.3 Expirar invitaciones vencidas (invocada por pg_cron, no expuesta al cliente)
CREATE OR REPLACE FUNCTION public.expire_barbershop_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.barbershop_invitations
  SET status = 'expired'
  WHERE status    = 'pending'
    AND expires_at <= now();
END;
$$;


-- ============================================================
-- SECCIÓN 9: ROW LEVEL SECURITY — Habilitación
-- ============================================================

ALTER TABLE public.barbershops            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbershop_invitations ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECCIÓN 10: POLÍTICAS RLS — barbershops
-- ============================================================
-- Múltiples policies FOR SELECT son permisivas (OR lógico en PostgreSQL).

-- Lectura pública: barberías activas
CREATE POLICY "barbershops_select_public"
  ON public.barbershops FOR SELECT
  USING (is_active = true);

-- Lectura propia: el dueño ve su barbería aunque esté inactiva
CREATE POLICY "barbershops_select_own"
  ON public.barbershops FOR SELECT
  USING (auth.uid() = owner_id);

-- Creación: solo el usuario autenticado que se registra como dueño
CREATE POLICY "barbershops_insert"
  ON public.barbershops FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Actualización: solo el dueño
CREATE POLICY "barbershops_update"
  ON public.barbershops FOR UPDATE
  USING     (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Eliminación: solo el dueño
-- Nota: se recomienda soft-delete (is_active = false) en lugar de DELETE
CREATE POLICY "barbershops_delete"
  ON public.barbershops FOR DELETE
  USING (auth.uid() = owner_id);


-- ============================================================
-- SECCIÓN 11: POLÍTICAS RLS — barbershop_members
-- ============================================================

-- El dueño de la barbería ve todos sus miembros
CREATE POLICY "bm_select_owner"
  ON public.barbershop_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );

-- El profesional ve su propia membresía
CREATE POLICY "bm_select_own_professional"
  ON public.barbershop_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );

-- Lectura pública: solo miembros activos (para página pública /barberia/[slug])
CREATE POLICY "bm_select_public_active"
  ON public.barbershop_members FOR SELECT
  USING (status = 'active');

-- Inserción: solo el dueño puede agregar miembros directamente
-- (accept_barbershop_invitation usa SECURITY DEFINER y bypasa esta policy)
CREATE POLICY "bm_insert_owner"
  ON public.barbershop_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );

-- Actualización: el dueño modifica rol y estado de membresías
CREATE POLICY "bm_update_owner"
  ON public.barbershop_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );

-- Eliminación: el dueño expulsa; el profesional puede salir voluntariamente
CREATE POLICY "bm_delete"
  ON public.barbershop_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = professional_id AND p.user_id = auth.uid()
    )
  );


-- ============================================================
-- SECCIÓN 12: POLÍTICAS RLS — barbershop_invitations
-- ============================================================
--
-- DISEÑO: La tabla NO es públicamente legible.
-- anon accede SOLO a través de get_invitation_preview(token) [SECURITY DEFINER].
-- authenticated accede a sus propias invitaciones a través de las policies de abajo.
--

-- El dueño/invitador ve todas las invitaciones que ha enviado
CREATE POLICY "inv_select_owner"
  ON public.barbershop_invitations FOR SELECT
  USING (auth.uid() = invited_by);

-- El usuario invitado ve SU invitación (para aceptarla desde el dashboard)
CREATE POLICY "inv_select_invited_email"
  ON public.barbershop_invitations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND lower(email) = lower(
      (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
    )
  );

-- Inserción: solo el dueño de la barbería puede invitar
CREATE POLICY "inv_insert_owner"
  ON public.barbershop_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
  );

-- Actualización: el dueño cancela; el invitado actualiza vía función SECURITY DEFINER
-- Esta policy es fallback — el path principal de aceptación es accept_barbershop_invitation()
CREATE POLICY "inv_update"
  ON public.barbershop_invitations FOR UPDATE
  USING (
    auth.uid() = invited_by
    OR lower(email) = lower(
      (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())
    )
  );

-- Eliminación: solo el dueño puede borrar invitaciones (preferir UPDATE status='cancelled')
CREATE POLICY "inv_delete_owner"
  ON public.barbershop_invitations FOR DELETE
  USING (auth.uid() = invited_by);


-- ============================================================
-- SECCIÓN 13: GRANTs DE TABLAS
-- ============================================================
--
-- PRINCIPIO APLICADO: mínimo privilegio necesario por rol.
--   anon         → SELECT solo en tablas con datos públicos (barbershops, members).
--                  SIN acceso a barbershop_invitations (usa función SECURITY DEFINER).
--                  SIN TRUNCATE (bypasa RLS), SIN TRIGGER (DDL), SIN REFERENCES (DDL).
--   authenticated → SELECT + DML en las tres tablas. RLS controla el acceso real.
--                  SIN TRUNCATE, SIN TRIGGER, SIN REFERENCES.
--   service_role  → ALL (usado por el sistema interno y pg_cron).
--
-- NOTA: El patrón del schema existente (20260529221251) otorga TRIGGER, TRUNCATE
-- y REFERENCES a anon/authenticated. Eso es una deuda de seguridad preexistente.
-- Esta migración NO replica ese patrón.
--

-- barbershops: anon puede ver barberías activas (página pública /barberia/[slug])
GRANT SELECT
  ON public.barbershops TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.barbershops TO authenticated;
GRANT ALL
  ON public.barbershops TO service_role;

-- barbershop_members: anon puede ver miembros activos (página pública de la barbería)
GRANT SELECT
  ON public.barbershop_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.barbershop_members TO authenticated;
GRANT ALL
  ON public.barbershop_members TO service_role;

-- barbershop_invitations: anon NO tiene acceso directo a la tabla.
-- El acceso anon se gestiona exclusivamente a través de get_invitation_preview(token).
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.barbershop_invitations TO authenticated;
GRANT ALL
  ON public.barbershop_invitations TO service_role;


-- ============================================================
-- SECCIÓN 14: GRANTs DE FUNCIONES
-- ============================================================
--
-- CORRECCIÓN CRÍTICA: PostgreSQL otorga EXECUTE a PUBLIC al crear funciones.
-- "REVOKE FROM anon, authenticated" es insuficiente porque PUBLIC sigue
-- teniendo el privilegio y anon/authenticated heredan de PUBLIC.
-- La corrección es REVOCAR DE PUBLIC primero, luego GRANT a roles específicos.
--

-- set_updated_at: función de trigger, ningún rol de API la necesita directamente
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                                         FROM PUBLIC;

-- Funciones analíticas: solo usuarios autenticados (dueños verifican ownership dentro)
REVOKE EXECUTE ON FUNCTION public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)    FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)    TO authenticated;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- get_invitation_preview: callable por anon (para /invitacion/[token] sin login)
-- y por authenticated (para mostrar detalles antes de aceptar desde el dashboard)
REVOKE EXECUTE ON FUNCTION public.get_invitation_preview(TEXT)         FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_invitation_preview(TEXT)         TO anon, authenticated;

-- accept_barbershop_invitation: solo usuarios autenticados (requiere auth.uid())
REVOKE EXECUTE ON FUNCTION public.accept_barbershop_invitation(TEXT)   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.accept_barbershop_invitation(TEXT)   TO authenticated;

-- expire_barbershop_invitations: solo service_role (invocada por pg_cron)
REVOKE EXECUTE ON FUNCTION public.expire_barbershop_invitations()      FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.expire_barbershop_invitations()      TO service_role;


-- ============================================================
-- SECCIÓN 15: pg_cron — Expiración automática de invitaciones
-- ============================================================
--
-- COMPATIBILIDAD VERIFICADA:
--   pg_cron >= 1.3 requerido para cron.schedule(name, schedule, command).
--   pg_cron >= 1.3 requerido para cron.unschedule(job_name text).
--   PostgreSQL 17 en Supabase incluye pg_cron >= 1.6. ✓
--
-- IDEMPOTENCIA:
--   El DO block elimina el job si ya existe (por ejemplo, en db reset local).
--   EXCEPTION WHEN OTHERS captura el caso en que el job no existe aún.
--   También captura el caso hipotético de pg_cron < 1.3 (PERFORM falla silenciosamente).
--
-- EJECUCIÓN DEL JOB:
--   El job corre como el usuario postgres (superuser de pg_cron).
--   expire_barbershop_invitations() es SECURITY DEFINER → acceso total a la tabla. ✓
--

DO $$
BEGIN
  PERFORM cron.unschedule('expire-barbershop-invitations');
EXCEPTION WHEN OTHERS THEN
  NULL; -- El job no existía o pg_cron no soporta unschedule por nombre. Continuar.
END;
$$;

SELECT cron.schedule(
  'expire-barbershop-invitations',
  '0 * * * *',
  $$SELECT public.expire_barbershop_invitations()$$
);


-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN
-- Ejecutar manualmente en Supabase SQL Editor tras aplicar.
-- ============================================================
--
-- 1. Tablas creadas (esperado: 3 filas):
--    SELECT table_name FROM information_schema.tables
--    WHERE table_schema = 'public'
--      AND table_name IN ('barbershops','barbershop_members','barbershop_invitations');
--
-- 2. Tipos creados (esperado: 3 filas):
--    SELECT typname FROM pg_type
--    WHERE typname IN ('barbershop_member_role','barbershop_member_status','invitation_status');
--
-- 3. Job de pg_cron (esperado: 1 fila):
--    SELECT jobname, schedule, command FROM cron.job
--    WHERE jobname = 'expire-barbershop-invitations';
--
-- 4. RLS habilitado (esperado: rowsecurity = true en las 3 filas):
--    SELECT tablename, rowsecurity FROM pg_tables
--    WHERE schemaname = 'public'
--      AND tablename IN ('barbershops','barbershop_members','barbershop_invitations');
--
-- 5. GRANTs correctos (verificar que anon NO tiene TRUNCATE en nuevas tablas):
--    SELECT grantee, privilege_type FROM information_schema.role_table_grants
--    WHERE table_schema = 'public'
--      AND table_name   = 'barbershops'
--      AND grantee      = 'anon';
--    Esperado: solo SELECT
--
-- 6. REVOKE FROM PUBLIC efectivo (verificar que expire no es callable por anon):
--    SELECT has_function_privilege('anon', 'public.expire_barbershop_invitations()', 'execute');
--    Esperado: false
--
-- 7. Tablas existentes intactas (smoke test):
--    SELECT COUNT(*) FROM professionals;
--    SELECT COUNT(*) FROM appointments;
--    Esperado: mismos valores previos a la migración
--
-- 8. get_invitation_preview callable por anon (esperado: true):
--    SELECT has_function_privilege('anon', 'public.get_invitation_preview(text)', 'execute');
--    Esperado: true


-- ============================================================
-- ROLLBACK COMPLETO
-- Ejecutar en orden. Impacto en datos existentes: CERO.
-- ============================================================
--
-- PASO 1: Eliminar job de pg_cron
-- SELECT cron.unschedule('expire-barbershop-invitations');
--
-- PASO 2: Eliminar funciones
-- DROP FUNCTION IF EXISTS public.expire_barbershop_invitations();
-- DROP FUNCTION IF EXISTS public.accept_barbershop_invitation(TEXT);
-- DROP FUNCTION IF EXISTS public.get_invitation_preview(TEXT);
-- DROP FUNCTION IF EXISTS public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
--
-- PASO 3: Eliminar tablas
-- (DROP TABLE CASCADE elimina automáticamente: índices, triggers y policies)
-- DROP TABLE IF EXISTS public.barbershop_invitations;
-- DROP TABLE IF EXISTS public.barbershop_members;
-- DROP TABLE IF EXISTS public.barbershops;
--
-- PASO 4: Eliminar función de trigger
-- Verificar primero que no hay otras tablas dependientes:
--   SELECT tgname, relname FROM pg_trigger t
--   JOIN pg_class c ON c.oid = t.tgrelid
--   WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'set_updated_at');
-- Si resultado vacío (esperado tras el DROP TABLE de paso 3):
-- DROP FUNCTION IF EXISTS public.set_updated_at();
--
-- PASO 5: Eliminar tipos ENUM
-- DROP TYPE IF EXISTS public.invitation_status;
-- DROP TYPE IF EXISTS public.barbershop_member_status;
-- DROP TYPE IF EXISTS public.barbershop_member_role;
--
-- VERIFICACIÓN POST-ROLLBACK:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN ('barbershops','barbershop_members','barbershop_invitations');
-- Esperado: 0 filas
-- ============================================================
