import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper function para verificar si el usuario está autenticado
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { user, error };
};

// Helper function para el logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Helper function para obtener el profesional actual
export const getCurrentProfessional = async () => {
  const { user, error } = await getCurrentUser();

  if (error || !user) {
    return { professional: null, error };
  }

  const { data: professional, error: profError } = await supabase
    .from('professionals')
    .select('*')
    .eq('email', user.email)
    .single();

  return { professional, error: profError };
};
