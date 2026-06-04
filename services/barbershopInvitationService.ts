import { supabase } from '@/lib/supabase';
import { BarbershopInvitation, BarbershopMemberRole, InvitationPreview } from '@/types';

// Retorna las invitaciones pendientes de una barbería.
export async function getPendingInvitations(
  barbershopId: string,
): Promise<BarbershopInvitation[]> {
  const { data, error } = await supabase
    .from('barbershop_invitations')
    .select('*')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as BarbershopInvitation[];
}

// Envía una invitación a un email para unirse a la barbería con un rol específico.
// La policy inv_insert_owner requiere que invited_by = auth.uid() y que el usuario sea owner.
// Fallará con un error descriptivo si ya existe una invitación pendiente para ese email.
export async function sendInvitation(
  barbershopId: string,
  email: string,
  role: BarbershopMemberRole,
): Promise<BarbershopInvitation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('barbershop_invitations')
    .insert({
      barbershop_id: barbershopId,
      email: email.trim().toLowerCase(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // El índice parcial barbershop_invitations_unique_pending genera código 23505
    if (error.code === '23505') {
      throw new Error('Ya existe una invitación pendiente para ese email en esta barbería');
    }
    throw error;
  }

  return data as BarbershopInvitation;
}

// Cancela una invitación pendiente (soft: cambia status a 'cancelled').
// El dueño puede cancelar cualquiera de sus invitaciones (enforced por RLS inv_update).
export async function cancelInvitation(invitationId: string): Promise<void> {
  const { error } = await supabase
    .from('barbershop_invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId);

  if (error) throw error;
}

// Acepta una invitación via la función SQL SECURITY DEFINER accept_barbershop_invitation(token).
// La función valida: token válido, pendiente, no expirado, email = usuario autenticado,
// y que el usuario tenga un perfil de professional. Retorna JSONB con resultado.
export async function acceptInvitation(
  token: string,
): Promise<{ success: boolean; barbershop_id?: string; error?: string }> {
  const { data, error } = await supabase.rpc('accept_barbershop_invitation', {
    p_token: token,
  });

  if (error) throw error;
  return data as { success: boolean; barbershop_id?: string; error?: string };
}

// Obtiene la vista previa de una invitación para la página pública /invitacion/[token].
// Llamada por get_invitation_preview(token) — SECURITY DEFINER, callable por anon.
// Devuelve null si el token no existe, expiró o no está pendiente.
// No expone email, invited_by ni historial de la invitación.
export async function getInvitationPreview(
  token: string,
): Promise<InvitationPreview | null> {
  const { data, error } = await supabase.rpc('get_invitation_preview', {
    p_token: token,
  });

  if (error) throw error;

  // RETURNS TABLE devuelve un array; se espera 0 o 1 filas
  if (!data || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as InvitationPreview;
}
