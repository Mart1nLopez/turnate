import { supabase } from '@/lib/supabase';
import { Barbershop } from '@/types';

// Carga la barbería activa de un professional via JOIN en barbershop_members.
// Devuelve null si el professional no tiene membresía activa en ninguna barbería.
export async function getBarbershopByProfessionalId(
  professionalId: string,
): Promise<Barbershop | null> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select('barbershop:barbershops(*)')
    .eq('professional_id', professionalId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  // PostgREST devuelve el join bajo la clave del alias ('barbershop').
  // Doble cast necesario porque el cliente no tiene tipos generados (any[] vs Barbershop).
  const row = data as unknown as { barbershop: Barbershop | null };
  return row.barbershop;
}

// Carga una barbería pública por slug. Lanza si no existe o está inactiva.
export async function getBarbershopBySlug(slug: string): Promise<Barbershop> {
  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !data) throw new Error('Barbería no encontrada');
  return data as Barbershop;
}

// Crea una barbería nueva y agrega al professional como miembro 'owner'.
// Llamada desde el flujo de registro (useAuth / useConfirmEmail) de forma best-effort.
// Si el INSERT de la membresía falla, la barbería queda huérfana temporalmente;
// se resolverá cuando el professional acceda a su panel y la reclaim.
export async function createBarbershopForProfessional(
  userId: string,
  professional: {
    id: string;
    name: string;
    slug: string;
    bio?: string;
    profile_image?: string;
    phone?: string;
    social_links?: Barbershop['social_links'];
    location?: string;
    map_embed_url?: string;
  },
): Promise<Barbershop> {
  const { data: barbershop, error: barbershopError } = await supabase
    .from('barbershops')
    .insert({
      owner_id: userId,
      name: professional.name,
      slug: professional.slug,
      description: professional.bio ?? null,
      logo_url: professional.profile_image ?? null,
      phone: professional.phone ?? null,
      social_links: professional.social_links ?? {},
      location: professional.location ?? null,
      map_embed_url: professional.map_embed_url ?? null,
      is_active: true,
      is_approved: false,
    })
    .select()
    .single();

  if (barbershopError || !barbershop) throw barbershopError ?? new Error('Error creando barbería');

  const { error: memberError } = await supabase
    .from('barbershop_members')
    .insert({
      barbershop_id: (barbershop as Barbershop).id,
      professional_id: professional.id,
      role: 'owner',
      status: 'active',
    });

  if (memberError) {
    // La barbería existe pero sin miembro. Se registra y continúa.
    console.error('[barbershopService] Membresía no creada tras barbershop insert:', memberError);
  }

  return barbershop as Barbershop;
}

// Actualiza campos de la barbería. Solo el dueño puede hacerlo (enforced por RLS).
export async function updateBarbershop(
  id: string,
  data: Partial<Omit<Barbershop, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>,
): Promise<void> {
  const { error } = await supabase.from('barbershops').update(data).eq('id', id);
  if (error) throw error;
}

// Verifica si un slug de barbería está disponible.
// Namespace independiente de professionals — no hay validación cruzada.
export async function checkBarbershopSlugAvailability(
  slug: string,
  currentBarbershopId?: string,
): Promise<boolean> {
  if (!slug || slug.trim() === '') return false;

  const { data, error } = await supabase
    .from('barbershops')
    .select('id')
    .eq('slug', slug);

  if (error) {
    console.error('[barbershopService] Error verificando slug:', error);
    return false;
  }

  if (!data || data.length === 0) return true;
  if (currentBarbershopId && (data[0] as { id: string }).id === currentBarbershopId) return true;
  return false;
}
