-- ============================================================
-- FIX: get_barbershop_member_stats — columna professional_id ambigua
-- Archivo : 20260615000002_fix_member_stats_ambiguous_col.sql
-- Error   : 42702 — "column reference professional_id is ambiguous"
-- Causa   : RETURNS TABLE declara una variable OUT llamada professional_id.
--           El CTE member_prof_ids hacía SELECT professional_id (sin alias de tabla)
--           desde barbershop_members, lo que PL/pgSQL no puede distinguir de la
--           variable de salida. Fix: cualificar todas las columnas con alias de tabla.
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
  IF NOT EXISTS (
    SELECT 1 FROM public.barbershops bs
    WHERE bs.id = p_barbershop_id AND bs.owner_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'access_denied'
      USING HINT = 'Solo el dueño puede consultar las estadísticas de esta barbería';
  END IF;

  RETURN QUERY
  WITH

  -- FIX: todas las columnas cualificadas con alias de tabla (bm_ids) para evitar
  -- que PL/pgSQL confunda las columnas con las variables OUT del RETURNS TABLE.
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
      av.professional_id                                              AS prof_id,
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
    LEFT JOIN day_counts dc  ON dc.dow = av.day_of_week
    WHERE av.is_available = true
    GROUP BY av.professional_id
  ),

  booked AS (
    SELECT
      a.professional_id                                               AS prof_id,
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

    CASE
      WHEN COUNT(a.id) FILTER (WHERE a.status = 'completed') = 0 THEN 0
      ELSE ROUND(
        COALESCE(SUM(s.price) FILTER (WHERE a.status = 'completed'), 0)::NUMERIC
        / COUNT(a.id) FILTER (WHERE a.status = 'completed'),
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

-- GRANTs (mismos que la migración original)
REVOKE EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_barbershop_member_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
