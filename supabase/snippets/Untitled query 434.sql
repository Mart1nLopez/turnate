SELECT
  (SELECT COUNT(*) FROM public.professionals) AS professionals,
  (SELECT COUNT(*) FROM public.barbershops) AS barbershops,
  (SELECT COUNT(*) FROM public.barbershop_members) AS members;