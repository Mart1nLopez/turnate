-- ============================================================
-- MIGRACIÓN: Filtro por profesional en funciones de analíticas
-- Archivo  : 20260628000002_analytics_professional_filter.sql
-- Fecha    : 2026-06-28
--
-- Agrega parámetro opcional p_professional_id UUID DEFAULT NULL
-- a las 6 funciones de analíticas de barbería.
--
-- Cuando p_professional_id IS NULL → datos de toda la barbería (comportamiento actual).
-- Cuando p_professional_id IS NOT NULL → datos filtrados al profesional indicado.
--
-- También corrige av.is_active → av.is_available en get_barbershop_member_stats
-- (bug de 20260615000004_admin_permissions.sql).
-- ============================================================


-- ── DROP funciones con firmas anteriores ──────────────────────────────────────

DROP FUNCTION IF EXISTS public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_barbershop_monthly_trend(UUID, INT);
DROP FUNCTION IF EXISTS public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT);


-- ============================================================
-- 1. get_barbershop_stats
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_barbershop_stats(
  p_barbershop_id    UUID,
  p_start_date       TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date         TIMESTAMPTZ DEFAULT now(),
  p_professional_id  UUID        DEFAULT NULL
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
    AND bm.status = 'active'
    AND (p_professional_id IS NULL OR bm.professional_id = p_professional_id);
END;
$$;


-- ============================================================
-- 2. get_barbershop_member_stats
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_barbershop_member_stats(
  p_barbershop_id    UUID,
  p_start_date       TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date         TIMESTAMPTZ DEFAULT now(),
  p_professional_id  UUID        DEFAULT NULL
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
      AND (p_professional_id IS NULL OR bm_ids.professional_id = p_professional_id)
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
    WHERE av.is_available = TRUE
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
    AND (p_professional_id IS NULL OR bm.professional_id = p_professional_id)

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
-- 3. get_barbershop_monthly_trend
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_barbershop_monthly_trend(
  p_barbershop_id    UUID,
  p_months           INT  DEFAULT 12,
  p_professional_id  UUID DEFAULT NULL
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
    SELECT mi_inner.professional_id
    FROM public.barbershop_members mi_inner
    WHERE mi_inner.barbershop_id = p_barbershop_id
      AND mi_inner.status        = 'active'
      AND (p_professional_id IS NULL OR mi_inner.professional_id = p_professional_id)
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


-- ============================================================
-- 4. get_barbershop_service_stats
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_barbershop_service_stats(
  p_barbershop_id    UUID,
  p_start_date       TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date         TIMESTAMPTZ DEFAULT now(),
  p_professional_id  UUID        DEFAULT NULL
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
    AND (p_professional_id IS NULL OR bm.professional_id = p_professional_id)
  GROUP BY s.id, s.name
  ORDER BY bookings DESC, revenue DESC;
END;
$$;


-- ============================================================
-- 5. get_barbershop_retention
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_barbershop_retention(
  p_barbershop_id    UUID,
  p_start_date       TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date         TIMESTAMPTZ DEFAULT now(),
  p_professional_id  UUID        DEFAULT NULL
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
      AND (p_professional_id IS NULL OR bm.professional_id = p_professional_id)
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
-- 6. get_barbershop_top_clients
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_barbershop_top_clients(
  p_barbershop_id    UUID,
  p_start_date       TIMESTAMPTZ DEFAULT date_trunc('month', now()),
  p_end_date         TIMESTAMPTZ DEFAULT now(),
  p_limit            INT         DEFAULT 10,
  p_professional_id  UUID        DEFAULT NULL
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
    AND (p_professional_id IS NULL OR bm.professional_id = p_professional_id)
  GROUP BY c.id, c.name, c.email
  ORDER BY visit_count DESC, total_spent DESC
  LIMIT p_limit;
END;
$$;


-- ============================================================
-- GRANTs
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_monthly_trend(UUID, INT, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_monthly_trend(UUID, INT, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_service_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_retention(UUID, TIMESTAMPTZ, TIMESTAMPTZ, UUID) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_top_clients(UUID, TIMESTAMPTZ, TIMESTAMPTZ, INT, UUID) TO authenticated;
