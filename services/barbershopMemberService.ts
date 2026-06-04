import { supabase } from '@/lib/supabase';
import { BarbershopMember, BarbershopMemberRole, Barbershop } from '@/types';

// Retorna los miembros activos de una barbería con datos básicos del professional.
export async function getMembersByBarbershopId(
  barbershopId: string,
): Promise<BarbershopMember[]> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select('*, professional:professionals(id, name, slug, profile_image, email)')
    .eq('barbershop_id', barbershopId)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  if (error) throw error;
  return (data ?? []) as BarbershopMember[];
}

// Retorna la membresía activa de un professional, si existe.
export async function getActiveMembershipByProfessionalId(
  professionalId: string,
): Promise<BarbershopMember | null> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select('*')
    .eq('professional_id', professionalId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data as BarbershopMember | null;
}

// Carga la membresía activa junto con la barbería en un único round-trip.
// Usado por useBarbershop para evitar cascada de queries.
export async function getActiveMembershipWithBarbershop(
  professionalId: string,
): Promise<{ membership: BarbershopMember; barbershop: Barbershop } | null> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select('*, barbershop:barbershops(*)')
    .eq('professional_id', professionalId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // PostgREST incrusta el join bajo la clave del alias
  const { barbershop, ...memberData } = data as Record<string, unknown> & { barbershop: Barbershop };
  return {
    membership: memberData as unknown as BarbershopMember,
    barbershop,
  };
}

// Cambia el rol de un miembro. Solo el dueño puede hacerlo (enforced por RLS).
export async function updateMemberRole(
  memberId: string,
  role: BarbershopMemberRole,
): Promise<void> {
  const { error } = await supabase
    .from('barbershop_members')
    .update({ role })
    .eq('id', memberId);

  if (error) throw error;
}

// Desactiva la membresía de un professional (soft-delete: conserva historial).
// El professional pierde acceso a la barbería pero el registro queda como historial.
export async function deactivateMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('barbershop_members')
    .update({ status: 'inactive' })
    .eq('id', memberId);

  if (error) throw error;
}
