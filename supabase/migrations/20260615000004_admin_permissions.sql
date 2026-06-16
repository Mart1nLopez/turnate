-- ============================================================
-- MIGRACIÓN: PERMISOS Y FUNCIONES PARA ROL ADMIN
-- Archivo  : 20260615000004_admin_permissions.sql
-- Fecha    : 2026-06-15
-- Depende  : 20260615000003_add_admin_role.sql (valor 'admin' debe existir en ENUM)
--
-- Propósito:
--   1. Crea helper is_barbershop_manager() — verifica si auth.uid() es owner o admin activo.
--   2. Trigger que protege owner_id de modificaciones no autorizadas.
--   3. Actualiza políticas RLS para permitir acceso de admins.
--   4. Actualiza funciones de analíticas para aceptar owner y admin.
--
-- SEPARADA DE 20260615000003 porque:
--   PostgreSQL 55P04 impide usar un valor de ENUM recién agregado en la misma
--   transacción. Esta migración corre en su propia transacción, cuando 'admin'
--   ya está comprometido en el catálogo pg_enum.
--
-- IDEMPOTENCIA:
--   CREATE OR REPLACE, DROP POLICY IF EXISTS, DROP TRIGGER IF EXISTS.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: HELPER — is_barbershop_manager(UUID) → BOOLEAN
--
-- Centraliza la verificación: ¿es el usuario actual owner o admin activo?
-- Usada en RLS y en funciones SECURITY DEFINER.
--
-- SECURITY DEFINER: necesario para leer barbershop_members y professionals
--   desde dentro de políticas RLS sin que el usuario requiera acceso directo.
-- STABLE: PostgreSQL puede cachear el resultado por fila dentro de una consulta.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_barbershop_manager(p_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.barbershop_members bm
    JOIN   public.professionals      p ON p.id = bm.professional_id
    WHERE  bm.barbershop_id = p_barbershop_id
      AND  p.user_id        = auth.uid()
      AND  bm.status        = 'active'
      AND  bm.role          IN ('owner', 'admin')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_barbershop_manager(UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.is_barbershop_manager(UUID) TO authenticated;


-- ============================================================
-- SECCIÓN 2: TRIGGER — proteger owner_id de modificaciones no autorizadas
--
-- Al abrir barbershops UPDATE a admins, un admin podría hacer una llamada
-- directa a la API y cambiar owner_id a su propio uid.
-- Este trigger bloquea cualquier cambio en owner_id cuando el caller
-- no es el dueño actual (auth.uid() ≠ OLD.owner_id).
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_owner_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    IF OLD.owner_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'unauthorized'
        USING HINT = 'Solo el dueño puede transferir la propiedad de la barbería';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS barbershops_protect_owner_id ON public.barbershops;
CREATE TRIGGER barbershops_protect_owner_id
  BEFORE UPDATE ON public.barbershops
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_owner_id_change();


-- ============================================================
-- SECCIÓN 3: RLS — barbershops UPDATE
--
-- Admins pueden editar info y apariencia de la barbería.
-- WITH CHECK idéntico al USING: la fila resultante debe seguir siendo del mismo dueño.
-- El trigger prevent_owner_id_change garantiza que owner_id no pueda cambiar.
-- ============================================================

DROP POLICY IF EXISTS "barbershops_update" ON public.barbershops;
CREATE POLICY "barbershops_update"
  ON public.barbershops FOR UPDATE
  USING     (auth.uid() = owner_id OR public.is_barbershop_manager(id))
  WITH CHECK (auth.uid() = owner_id OR public.is_barbershop_manager(id));


-- ============================================================
-- SECCIÓN 4: RLS — barbershop_members SELECT
--
-- Admin también puede ver todos los miembros (para gestionar el equipo).
-- bm_select_public_active ya cubre miembros activos para el público;
-- esta policy añade visibilidad completa para managers (incluyendo estados futuros).
-- ============================================================

DROP POLICY IF EXISTS "bm_select_owner" ON public.barbershop_members;
CREATE POLICY "bm_select_owner"
  ON public.barbershop_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.barbershops b
      WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
    )
    OR public.is_barbershop_manager(barbershop_id)
  );


-- ============================================================
-- SECCIÓN 5: RLS — barbershop_invitations
--
-- 5A. INSERT: owner puede invitar con cualquier rol; admin solo con role='barber'.
-- 5B. SELECT: managers ven todas las invitaciones de su barbería.
-- 5C. UPDATE: managers pueden cancelar invitaciones (status = 'cancelled').
-- ============================================================

-- 5A. INSERT
DROP POLICY IF EXISTS "inv_insert_owner" ON public.barbershop_invitations;
CREATE POLICY "inv_insert_owner"
  ON public.barbershop_invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND (
      -- Dueño: puede invitar con cualquier rol (owner, admin, barber)
      EXISTS (
        SELECT 1 FROM public.barbershops b
        WHERE b.id = barbershop_id AND b.owner_id = auth.uid()
      )
      OR
      -- Admin: solo puede invitar con rol barber
      (
        role = 'barber'
        AND public.is_barbershop_manager(barbershop_id)
      )
    )
  );

-- 5B. SELECT
DROP POLICY IF EXISTS "inv_select_owner" ON public.barbershop_invitations;
CREATE POLICY "inv_select_owner"
  ON public.barbershop_invitations FOR SELECT
  USING (
    auth.uid() = invited_by
    OR public.is_barbershop_manager(barbershop_id)
  );

-- 5C. UPDATE (cancelar)
DROP POLICY IF EXISTS "inv_update" ON public.barbershop_invitations;
CREATE POLICY "inv_update"
  ON public.barbershop_invitations FOR UPDATE
  USING (
    auth.uid() = invited_by
    OR lower(email) = lower(auth.email())
    OR public.is_barbershop_manager(barbershop_id)
  );


-- ============================================================
-- SECCIÓN 6: FUNCIONES DE ANALÍTICAS
--
-- Sustituye el check manual de owner_id por is_barbershop_manager().
-- Las firmas (nombre, parámetros, RETURNS TABLE) no cambian — safe para
-- clientes existentes que llamen estas funciones por nombre.
-- ============================================================

-- 6A. get_barbershop_stats
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
  IF NOT public.is_barbershop_manager(p_barbershop_id) THEN
    RAISE EXCEPTION 'access_denied'
      USING HINT = 'Solo el dueño o un administrador pueden consultar las estadísticas de esta barbería';
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


-- 6B. get_barbershop_member_stats (versión extendida de 20260615000001)
CREATE OR REPLACE FUNCTION public.get_barbershop_member_stats(
  p_barbershop_id UUID,
  p_start_date    TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date      TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  professional_id        UUID,
  professional_name      TEXT,
  professional_slug      TEXT,
  profile_image          TEXT,
  role                   public.barbershop_member_role,
  completed_appointments BIGINT,
  cancelled_appointments BIGINT,
  avg_rating             NUMERIC,
  total_revenue          NUMERIC,
  unique_clients         BIGINT,
  avg_ticket             NUMERIC,
  booked_hours           NUMERIC,
  available_hours        NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_barbershop_manager(p_barbershop_id) THEN
    RAISE EXCEPTION 'access_denied'
      USING HINT = 'Solo el dueño o un administrador pueden consultar las estadísticas de esta barbería';
  END IF;

  RETURN QUERY
  WITH

  member_prof_ids AS (
    SELECT bm_ids.professional_id
    FROM public.barbershop_members bm_ids
    WHERE bm_ids.barbershop_id = p_barbershop_id
      AND bm_ids.status        = 'active'
  ),

  day_counts AS (
    SELECT
      EXTRACT(DOW FROM d)::INT AS dow,
      COUNT(*)                 AS cnt
    FROM generate_series(
      p_start_date::date,
      p_end_date::date,
      '1 day'::interval
    ) AS d
    GROUP BY 1
  ),

  avail_hours AS (
    SELECT
      av.professional_id AS prof_id,
      COALESCE(
        SUM(
          COALESCE((
            SELECT SUM(
              GREATEST(
                EXTRACT(EPOCH FROM (
                  ('2000-01-01 ' || (tb ->> 'end_time'))::TIMESTAMP -
                  ('2000-01-01 ' || (tb ->> 'start_time'))::TIMESTAMP
                )) / 3600.0,
                0
              )
            )
            FROM jsonb_array_elements(av.time_blocks) AS tb
            WHERE (tb ->> 'start_time') IS NOT NULL
              AND (tb ->> 'end_time')   IS NOT NULL
          ), 0)
          *
          COALESCE(dc.cnt, 0)
        ),
        0
      ) AS available_hours
    FROM public.availability av
    JOIN member_prof_ids mpi ON mpi.professional_id = av.professional_id
    LEFT JOIN day_counts dc ON dc.dow = av.day_of_week
    WHERE av.is_active = TRUE
    GROUP BY av.professional_id
  ),

  booked AS (
    SELECT
      a.professional_id AS prof_id,
      COALESCE(
        SUM(
          GREATEST(
            EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600.0,
            0
          )
        ),
        0
      ) AS booked_hours
    FROM public.appointments a
    JOIN member_prof_ids mpi ON mpi.professional_id = a.professional_id
    WHERE a.status     = 'completed'
      AND a.start_time BETWEEN p_start_date AND p_end_date
    GROUP BY a.professional_id
  )

  SELECT
    bm.professional_id,
    p.name,
    p.slug,
    p.profile_image,
    bm.role,

    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::BIGINT
      AS completed_appointments,

    COUNT(DISTINCT a.id) FILTER (
      WHERE a.status IN ('cancelled_by_pro', 'cancelled_by_client')
    )::BIGINT
      AS cancelled_appointments,

    ROUND(COALESCE(AVG(r.rating), 0)::NUMERIC, 2)
      AS avg_rating,

    COALESCE(
      SUM(s.price) FILTER (WHERE a.status = 'completed'),
      0
    )::NUMERIC
      AS total_revenue,

    COUNT(DISTINCT a.client_id) FILTER (WHERE a.status = 'completed')::BIGINT
      AS unique_clients,

    CASE
      WHEN COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') = 0 THEN 0
      ELSE ROUND(
        COALESCE(SUM(s.price) FILTER (WHERE a.status = 'completed'), 0)::NUMERIC
        / COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::NUMERIC,
        2
      )
    END
      AS avg_ticket,

    COALESCE(booked_data.booked_hours, 0)   AS booked_hours,
    COALESCE(avail_data.available_hours, 0) AS available_hours

  FROM public.barbershop_members bm
  JOIN public.professionals p ON p.id = bm.professional_id

  LEFT JOIN public.appointments a
    ON  a.professional_id = bm.professional_id
    AND a.start_time BETWEEN p_start_date AND p_end_date

  LEFT JOIN public.services s
    ON  s.id = a.service_id

  LEFT JOIN public.reviews r
    ON  r.professional_id = bm.professional_id
    AND r.created_at BETWEEN p_start_date AND p_end_date

  LEFT JOIN avail_hours avail_data
    ON  avail_data.prof_id = bm.professional_id

  LEFT JOIN booked booked_data
    ON  booked_data.prof_id = bm.professional_id

  WHERE bm.barbershop_id = p_barbershop_id
    AND bm.status        = 'active'

  GROUP BY
    bm.professional_id,
    p.name,
    p.slug,
    p.profile_image,
    bm.role,
    booked_data.booked_hours,
    avail_data.available_hours;
END;
$$;


-- 6C. get_barbershop_monthly_trend
CREATE OR REPLACE FUNCTION public.get_barbershop_monthly_trend(
  p_barbershop_id UUID,
  p_months        INT DEFAULT 12
)
RETURNS TABLE (
  period_start   DATE,
  month_label    TEXT,
  appointments   BIGINT,
  revenue        NUMERIC,
  unique_clients BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_series_start DATE;
BEGIN
  IF NOT public.is_barbershop_manager(p_barbershop_id) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  v_series_start := date_trunc('month', now() - (p_months - 1 || ' months')::INTERVAL)::DATE;

  RETURN QUERY
  WITH months AS (
    SELECT
      generate_series(
        v_series_start,
        date_trunc('month', now())::DATE,
        '1 month'::INTERVAL
      )::DATE AS month_start
  ),
  member_ids AS (
    SELECT professional_id
    FROM public.barbershop_members
    WHERE barbershop_id = p_barbershop_id
      AND status        = 'active'
  ),
  agg AS (
    SELECT
      date_trunc('month', a.start_time)::DATE AS month_start,
      COUNT(DISTINCT a.id)                     AS appointments,
      COALESCE(SUM(s.price), 0)::NUMERIC       AS revenue,
      COUNT(DISTINCT a.client_id)              AS unique_clients
    FROM public.appointments a
    JOIN public.services s ON s.id = a.service_id
    JOIN member_ids mi     ON mi.professional_id = a.professional_id
    WHERE a.status     = 'completed'
      AND a.start_time >= v_series_start
      AND a.start_time <  date_trunc('month', now()) + INTERVAL '1 month'
    GROUP BY 1
  )
  SELECT
    m.month_start                          AS period_start,
    to_char(m.month_start, 'Mon YYYY')     AS month_label,
    COALESCE(ag.appointments,   0)::BIGINT AS appointments,
    COALESCE(ag.revenue,        0)::NUMERIC AS revenue,
    COALESCE(ag.unique_clients, 0)::BIGINT AS unique_clients
  FROM months m
  LEFT JOIN agg ag ON ag.month_start = m.month_start
  ORDER BY m.month_start;
END;
$$;


-- 6D. get_barbershop_service_stats
CREATE OR REPLACE FUNCTION public.get_barbershop_service_stats(
  p_barbershop_id UUID,
  p_start_date    TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date      TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  service_id   UUID,
  service_name TEXT,
  bookings     BIGINT,
  revenue      NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_barbershop_manager(p_barbershop_id) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  SELECT
    s.id                         AS service_id,
    s.name                       AS service_name,
    COUNT(DISTINCT a.id)::BIGINT AS bookings,
    COALESCE(SUM(s.price), 0)    AS revenue
  FROM public.barbershop_members bm
  JOIN public.appointments a
    ON  a.professional_id = bm.professional_id
    AND a.status          = 'completed'
    AND a.start_time BETWEEN p_start_date AND p_end_date
  JOIN public.services s
    ON  s.id = a.service_id
  WHERE bm.barbershop_id = p_barbershop_id
    AND bm.status        = 'active'
  GROUP BY s.id, s.name
  ORDER BY bookings DESC, revenue DESC;
END;
$$;


-- 6E. get_barbershop_retention
CREATE OR REPLACE FUNCTION public.get_barbershop_retention(
  p_barbershop_id UUID,
  p_start_date    TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date      TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  unique_clients    BIGINT,
  recurring_clients BIGINT,
  return_rate       NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_barbershop_manager(p_barbershop_id) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  WITH client_visits AS (
    SELECT
      a.client_id,
      COUNT(DISTINCT a.id) AS visit_count
    FROM public.barbershop_members bm
    JOIN public.appointments a
      ON  a.professional_id = bm.professional_id
      AND a.status          = 'completed'
      AND a.start_time BETWEEN p_start_date AND p_end_date
    WHERE bm.barbershop_id = p_barbershop_id
      AND bm.status        = 'active'
      AND a.client_id      IS NOT NULL
    GROUP BY a.client_id
  )
  SELECT
    COUNT(*)::BIGINT                                         AS unique_clients,
    COUNT(*) FILTER (WHERE visit_count >= 2)::BIGINT         AS recurring_clients,
    CASE
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (WHERE visit_count >= 2)::NUMERIC
        / COUNT(*)::NUMERIC * 100,
        1
      )
    END                                                      AS return_rate
  FROM client_visits;
END;
$$;


-- 6F. get_barbershop_top_clients
CREATE OR REPLACE FUNCTION public.get_barbershop_top_clients(
  p_barbershop_id UUID,
  p_start_date    TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date      TIMESTAMPTZ DEFAULT now(),
  p_limit         INT         DEFAULT 10
)
RETURNS TABLE (
  client_name  TEXT,
  client_email TEXT,
  visit_count  BIGINT,
  total_spent  NUMERIC,
  last_visit   TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_barbershop_manager(p_barbershop_id) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  SELECT
    c.name                               AS client_name,
    c.email                              AS client_email,
    COUNT(DISTINCT a.id)::BIGINT         AS visit_count,
    COALESCE(SUM(s.price), 0)::NUMERIC   AS total_spent,
    MAX(a.start_time)                    AS last_visit
  FROM public.barbershop_members bm
  JOIN public.appointments a
    ON  a.professional_id = bm.professional_id
    AND a.status          = 'completed'
    AND a.start_time BETWEEN p_start_date AND p_end_date
  JOIN public.clients c
    ON  c.id = a.client_id
  LEFT JOIN public.services s
    ON  s.id = a.service_id
  WHERE bm.barbershop_id = p_barbershop_id
    AND bm.status        = 'active'
  GROUP BY c.id, c.name, c.email
  ORDER BY visit_count DESC, total_spent DESC
  LIMIT p_limit;
END;
$$;


-- ============================================================
-- SECCIÓN 7: GRANTs
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- Las demás funciones ya tienen GRANTs en 20260615000001; re-grantear es idempotente.
REVOKE EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_monthly_trend(UUID, INT)                    FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_monthly_trend(UUID, INT)                    TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ)   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ)   TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;

-- prevent_owner_id_change() es función de trigger; no requiere GRANT directo.
