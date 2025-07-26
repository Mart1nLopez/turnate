import { Metadata } from 'next';
import { getProfessionalBySlug } from '@/services/professionalPublicService';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const professional = await getProfessionalBySlug(slug);
    return {
      title: `Agenda con ${professional.name} - Turnate`,
      icons: {
        icon: professional.profile_image || '/logo.svg',
        apple: professional.profile_image || '/logo.svg',
      },
    };
  } catch {
    return {
      title: 'Agenda con Turnate',
      icons: {
        icon: '/logo.svg',
      },
    };
  }
}

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
