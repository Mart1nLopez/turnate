import { supabase } from '@/lib/supabase';
import { BarbershopPublicProfile, TeamMember } from '@/types';

// Retorna el perfil público de una barbería activa por slug.
// Devuelve null si el slug no existe o is_active = false (RLS lo filtraría igual,
// pero maybeSingle() es más predecible que single() para 404s controlados).
export async function getBarbershopPublicProfile(
  slug: string,
): Promise<BarbershopPublicProfile | null> {
  const { data, error } = await supabase
    .from('barbershops')
    .select(
      'id, name, slug, description, logo_url, phone, social_links, address, city, region, location, map_embed_url, cover_image_url, primary_color, secondary_color, gallery_images',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Retorna el equipo activo de una barbería ordenado: owners primero, luego por antigüedad.
// Funciona con anon (RLS bm_select_public_active + barbershops_select_public).
export async function getTeamByBarbershopId(barbershopId: string): Promise<TeamMember[]> {
  const { data, error } = await supabase
    .from('barbershop_members')
    .select(`
      id,
      role,
      joined_at,
      professionals (
        id,
        name,
        slug,
        profile_image,
        bio
      )
    `)
    .eq('barbershop_id', barbershopId)
    .eq('status', 'active')
    .order('role', { ascending: true })
    .order('joined_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    // PostgREST devuelve el join como objeto singular (FK en barbershop_members → professionals).
    // Sin los tipos generados de Supabase, TypeScript infiere array — cast via unknown es seguro.
    const pro = row.professionals as unknown as {
      id: string;
      name: string;
      slug: string;
      profile_image: string | null;
      bio: string | null;
    };
    return {
      memberId: row.id,
      role: row.role as TeamMember['role'],
      joinedAt: row.joined_at,
      professional: {
        id: pro.id,
        name: pro.name,
        slug: pro.slug,
        profileImage: pro.profile_image ?? undefined,
        bio: pro.bio ?? undefined,
      },
    };
  });
}

// Obtiene barbería + equipo en dos queries secuenciales.
// Son secuenciales por diseño: el ID de la barbería es necesario para la segunda query.
// Devuelve null si la barbería no existe o está inactiva → el page renderiza notFound().
export async function getBarbershopPageData(slug: string): Promise<{
  barbershop: BarbershopPublicProfile;
  team: TeamMember[];
} | null> {
  const barbershop = await getBarbershopPublicProfile(slug);
  if (!barbershop) return null;
  const team = await getTeamByBarbershopId(barbershop.id);
  return { barbershop, team };
}
