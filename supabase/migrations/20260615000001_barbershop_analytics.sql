-- ============================================================
-- MIGRACIÓN: ANALÍTICAS DE BARBERÍA (MULTI-TENANT)
-- Archivo : 20260615000001_barbershop_analytics.sql
-- Fecha   : 2026-06-15
-- Propósito:
--   1. Reemplaza get_barbershop_member_stats() con versión extendida
--      (profile_image, cancelled_appointments, avg_ticket, booked_hours, available_hours)
--   2. get_barbershop_monthly_trend()  — evolución 12 meses
--   3. get_barbershop_service_stats()  — servicios más vendidos/rentables
--   4. get_barbershop_retention()      — retención de clientes
--   5. get_barbershop_top_clients()    — top clientes por visitas y gasto
--
-- SEGURIDAD:
--   Todas las funciones son SECURITY DEFINER.
--   Verifican que auth.uid() = barbershop.owner_id antes de devolver datos.
--   GRANTs mínimos: solo authenticated.
--
-- OCUPACIÓN:
--   booked_hours  = EXTRACT EPOCH de (end_time - start_time) de citas completadas.
--   available_hours = suma de time_blocks de availability × días del período.
--   Si el barbero no tiene availability configurada → available_hours = 0.
--
-- ROLLBACK:
--   Ver sección final.
-- ============================================================


-- ============================================================
-- SECCIÓN 1: REEMPLAZAR get_barbershop_member_stats()
-- Necesitamos DROP + CREATE porque PostgreSQL no permite ALTER
-- la firma RETURNS TABLE de una función existente.
-- ============================================================

DROP FUNCTION IF EXISTS public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

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
  -- Verificar que el caller es el dueño de la barbería
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access_denied'
      USING HINT = 'Solo el dueño puede consultar las estadísticas de esta barbería';
  END IF;

  RETURN QUERY
  WITH

  -- IDs de los profesionales activos de esta barbería.
  -- FIX 42702: columnas cualificadas con alias de tabla (bm_ids) para evitar
  -- que PL/pgSQL confunda las columnas con las variables OUT de RETURNS TABLE.
  member_prof_ids AS (
    SELECT bm_ids.professional_id
    FROM public.barbershop_members bm_ids
    WHERE bm_ids.barbershop_id = p_barbershop_id
      AND bm_ids.status        = 'active'
  ),

  -- Días de cada día de la semana dentro del rango (para cálculo de ocupación)
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

  -- Horas disponibles por professional en el rango (desde tabla availability)
  -- JOIN con member_prof_ids evita escanear toda la tabla availability.
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
      )::NUMERIC AS available_hours
    FROM public.availability av
    JOIN member_prof_ids mpi ON mpi.professional_id = av.professional_id
    LEFT JOIN day_counts dc ON dc.dow = av.day_of_week
    WHERE av.is_available = true
    GROUP BY av.professional_id
  ),

  -- Horas reservadas (citas completadas) en el rango
  -- JOIN con member_prof_ids evita escanear todos los appointments del período.
  booked AS (
    SELECT
      a.professional_id AS prof_id,
      COALESCE(
        SUM(
          EXTRACT(EPOCH FROM (a.end_time - a.start_time)) / 3600.0
        ) FILTER (WHERE a.status = 'completed'),
        0
      )::NUMERIC AS booked_hours
    FROM public.appointments a
    JOIN member_prof_ids mpi ON mpi.professional_id = a.professional_id
    WHERE a.start_time BETWEEN p_start_date AND p_end_date
    GROUP BY a.professional_id
  )

  SELECT
    bm.professional_id,
    p.name                                                             AS professional_name,
    p.slug                                                             AS professional_slug,
    p.profile_image,
    bm.role,

    COUNT(DISTINCT a.id) FILTER (
      WHERE a.status = 'completed'
    )::BIGINT                                                          AS completed_appointments,

    COUNT(DISTINCT a.id) FILTER (
      WHERE a.status IN ('cancelled_by_pro', 'cancelled_by_client')
    )::BIGINT                                                          AS cancelled_appointments,

    ROUND(COALESCE(AVG(r.rating), 0)::NUMERIC, 2)                     AS avg_rating,

    COALESCE(
      SUM(s.price) FILTER (WHERE a.status = 'completed'),
      0
    )::NUMERIC                                                         AS total_revenue,

    COUNT(DISTINCT a.client_id) FILTER (
      WHERE a.status = 'completed'
    )::BIGINT                                                          AS unique_clients,

    -- Ticket promedio: ingresos / citas completadas (0 si no hay citas)
    CASE
      WHEN COUNT(a.id) FILTER (WHERE a.status = 'completed') = 0 THEN 0
      ELSE ROUND(
        COALESCE(SUM(s.price) FILTER (WHERE a.status = 'completed'), 0)::NUMERIC
        /
        COUNT(a.id) FILTER (WHERE a.status = 'completed'),
        2
      )
    END                                                                AS avg_ticket,

    COALESCE(booked_data.booked_hours, 0)                             AS booked_hours,
    COALESCE(avail_data.available_hours, 0)                           AS available_hours

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


-- ============================================================
-- SECCIÓN 2: get_barbershop_monthly_trend()
-- Devuelve exactamente p_months filas (usando generate_series),
-- incluso si algún mes no tiene datos (revenue=0, appointments=0).
-- ============================================================

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
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  -- Inicio de la serie: hace p_months meses desde el inicio del mes actual
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
    JOIN public.services s      ON s.id = a.service_id
    JOIN member_ids mi          ON mi.professional_id = a.professional_id
    WHERE a.status     = 'completed'
      AND a.start_time >= v_series_start
      AND a.start_time <  date_trunc('month', now()) + INTERVAL '1 month'
    GROUP BY 1
  )
  SELECT
    m.month_start                                               AS period_start,
    -- Formato: 'Ene 2026'
    to_char(m.month_start, 'Mon YYYY')                         AS month_label,
    COALESCE(ag.appointments,   0)::BIGINT                     AS appointments,
    COALESCE(ag.revenue,        0)::NUMERIC                    AS revenue,
    COALESCE(ag.unique_clients, 0)::BIGINT                     AS unique_clients
  FROM months m
  LEFT JOIN agg ag ON ag.month_start = m.month_start
  ORDER BY m.month_start;
END;
$$;


-- ============================================================
-- SECCIÓN 3: get_barbershop_service_stats()
-- Top servicios por reservas y por facturación.
-- ============================================================

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
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
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


-- ============================================================
-- SECCIÓN 4: get_barbershop_retention()
-- Clientes únicos, recurrentes (≥2 citas completadas) y tasa de retorno.
-- ============================================================

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
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
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


-- ============================================================
-- SECCIÓN 5: get_barbershop_top_clients()
-- Top N clientes ordenados por visitas y gasto total.
-- Solo accesible por el dueño (SECURITY DEFINER + owner check).
-- ============================================================

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
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops
    WHERE id = p_barbershop_id AND owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  SELECT
    c.name                                AS client_name,
    c.email                               AS client_email,
    COUNT(DISTINCT a.id)::BIGINT          AS visit_count,
    COALESCE(SUM(s.price), 0)::NUMERIC    AS total_spent,
    MAX(a.start_time)                     AS last_visit
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
-- SECCIÓN 6: GRANTs
-- Todas las funciones nuevas: solo authenticated.
-- REVOKE FROM PUBLIC primero para evitar que anon herede.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)   FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)   TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_monthly_trend(UUID, INT)                       FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_monthly_trend(UUID, INT)                       TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)  FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ)  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ)      FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ)      TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT) TO authenticated;


-- ============================================================
-- VERIFICACIÓN POST-MIGRACIÓN (ejecutar manualmente)
-- ============================================================
--
-- 1. Funciones creadas (esperado: 5 nuevas + 1 recreada = 6):
--    SELECT proname FROM pg_proc
--    WHERE proname IN (
--      'get_barbershop_member_stats',
--      'get_barbershop_monthly_trend',
--      'get_barbershop_service_stats',
--      'get_barbershop_retention',
--      'get_barbershop_top_clients'
--    );
--
-- 2. anon NO puede ejecutar las funciones (esperado: false para todas):
--    SELECT has_function_privilege('anon',
--      'public.get_barbershop_monthly_trend(uuid, int)', 'execute');
--
-- 3. authenticated SÍ puede (esperado: true):
--    SELECT has_function_privilege('authenticated',
--      'public.get_barbershop_monthly_trend(uuid, int)', 'execute');
--
-- 4. get_barbershop_member_stats devuelve profile_image (test con barbershop real):
--    SELECT profile_image FROM get_barbershop_member_stats('<barbershop_id>');


-- ============================================================
-- ROLLBACK COMPLETO
-- ============================================================
--
-- DROP FUNCTION IF EXISTS public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT);
-- DROP FUNCTION IF EXISTS public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS public.get_barbershop_monthly_trend(UUID, INT);
-- DROP FUNCTION IF EXISTS public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
--
-- Luego restaurar la versión anterior de get_barbershop_member_stats
-- desde el archivo 20260603224017_refactor_barbershops.sql.
-- ============================================================
