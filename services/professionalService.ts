import { supabase } from '@/lib/supabase';
import { Professional } from '@/types';

export async function getProfessionalProfile(): Promise<Professional> {
  const { professional, error } = await (await import('@/lib/supabase')).getCurrentProfessional();
  if (error || !professional) throw error || new Error('No se encontró el profesional');
  return professional;
}

export async function updateProfessionalProfile(id: string, updateData: Partial<Professional>): Promise<void> {
  const { error } = await supabase.from('professionals').update(updateData).eq('id', id);
  if (error) throw error;
}

export async function removeProfileImage(id: string): Promise<void> {
  const { error } = await supabase.from('professionals').update({ profile_image: null }).eq('id', id);
  if (error) throw error;
}

export async function checkSlugAvailability(slug: string, currentProfessionalId?: string): Promise<boolean> {
  if (!slug || slug.trim() === '') return false;
  const { data, error } = await supabase.from('professionals').select('id').eq('slug', slug).single();
  if (error && error.code === 'PGRST116') {
    // No se encontró ningún registro, el slug está disponible
    return true;
  }
  if (error) {
    console.error('Error checking slug:', error);
    return false;
  }
  // Si se encontró un registro, el slug ya existe, pero si es el mismo profesional, es válido
  if (data && currentProfessionalId && data.id === currentProfessionalId) return true;
  return false;
}

export async function checkEmailAvailability(email: string): Promise<boolean> {
  if (!email || email.trim() === '') return false;
  const { error } = await supabase.from('professionals').select('id').eq('email', email).single();
  if (error && error.code === 'PGRST116') {
    // No se encontró ningún registro, el email está disponible
    return true;
  }
  if (error) {
    console.error('Error checking email:', error);
    return false;
  }
  // Si se encontró un registro, el email ya existe
  return false;
}

export async function checkRutAvailability(rut: string): Promise<boolean> {
  if (!rut || rut.trim() === '') return false;
  const { error } = await supabase.from('professionals').select('id').eq('rut', rut).single();
  if (error && error.code === 'PGRST116') {
    // No se encontró ningún registro, el RUT está disponible
    return true;
  }
  if (error) {
    console.error('Error checking RUT:', error);
    return false;
  }
  // Si se encontró un registro, el RUT ya existe
  return false;
}

export async function connectGoogleCalendar(): Promise<void> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.events',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
      redirectTo: `${window.location.origin}/dashboard/perfil?sync=success`,
    },
  });
  if (error) throw error;
}

export async function disconnectGoogleCalendar(professionalId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('disconnect-google');
  if (error) throw error;
  // Actualizar el perfil para setear google_refresh_token a null
  await updateProfessionalProfile(professionalId, { google_refresh_token: null });
}

export async function createProfessionalProfile(
  userId: string,
  data: {
    name: string;
    slug: string;
    email: string;
    rut: string;
    phone: string;
  },
): Promise<void> {
  const { error } = await supabase.from('professionals').insert({
    user_id: userId,
    name: data.name,
    slug: data.slug,
    email: data.email,
    rut: data.rut,
    phone: data.phone,
  });

  if (error) throw error;
}

export async function saveGoogleRefreshToken(refreshToken: string): Promise<void> {
  const { error } = await supabase.functions.invoke('save-refresh-token', {
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  if (error) throw error;
}
