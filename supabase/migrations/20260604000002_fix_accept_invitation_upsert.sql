-- =============================================================
-- PATCH: fix accept_barbershop_invitation — soporte re-ingreso
-- =============================================================
--
-- Problema:
--   El INSERT en accept_barbershop_invitation fallaba con HTTP 409
--   cuando un miembro previamente eliminado (status='inactive')
--   intentaba aceptar una nueva invitación a la misma barbería.
--
--   Causa: CONSTRAINT barbershop_members_unique_pair UNIQUE (barbershop_id, professional_id)
--   cubre todas las filas independientemente del status.
--   El guard existente solo filtraba status='active', dejando pasar
--   el caso inactive → INSERT → violación de unique constraint.
--
-- Solución:
--   Reemplazar el INSERT por un UPSERT con ON CONFLICT DO UPDATE.
--   Esto reactiva la membresía existente (si la hay) en lugar de
--   intentar crear una fila duplicada.
--
-- Campos actualizados en re-activación:
--   status     → 'active'
--   role       → el rol de la nueva invitación
--   joined_at  → now()  (fecha de re-ingreso al período activo actual)
--   updated_at → now()
--
-- Campos NO modificados en re-activación (invariantes):
--   created_at → preserva la fecha original de la fila (auditoría histórica)
--   id, barbershop_id, professional_id → inmutables por constraint
--
-- Sin cambios en: validaciones, RLS, SECURITY DEFINER, lógica de invitaciones.
-- =============================================================

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

  INSERT INTO public.barbershop_members (barbershop_id, professional_id, role, status, joined_at, updated_at)
  VALUES (v_invitation.barbershop_id, v_professional_id, v_invitation.role, 'active', now(), now())
  ON CONFLICT (barbershop_id, professional_id)
  DO UPDATE SET
    status     = 'active',
    role       = EXCLUDED.role,
    joined_at  = now(),
    updated_at = now();

  UPDATE public.barbershop_invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;

  RETURN jsonb_build_object('success', true, 'barbershop_id', v_invitation.barbershop_id);
END;
$$;
