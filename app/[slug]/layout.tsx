import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Esperar los parámetros antes de usarlos
  const { slug } = await params;

  // Cargar datos del profesional
  const { data: professional } = await supabase
    .from('professionals')
    .select('name, profile_image')
    .eq('slug', slug)
    .single();

  if (!professional) {
    // Si por alguna razón no se encuentra el profesional
    return {
      title: 'Agenda con Turnate',
      icons: {
        icon: '/logo.svg',
      },
    };
  }

  return {
    title: `Agenda con ${professional.name} - Turnate`,
    icons: {
      icon: professional.profile_image || '/logo.svg',
      apple: professional.profile_image || '/logo.svg',
    },
  };
}

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
