import type { Metadata } from 'next';
import { getBarbershopPublicProfile } from '@/services/barbershopPublicService';

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershopPublicProfile(slug);

  if (!barbershop) {
    return {
      title: 'Barbería no encontrada | Turnate',
    };
  }

  const description =
    barbershop.description ??
    `Conoce al equipo de ${barbershop.name} y agenda con tu profesional favorito en Turnate.`;

  return {
    title: `${barbershop.name} | Turnate`,
    description,
    openGraph: {
      title: barbershop.name,
      description,
      ...(barbershop.logo_url && { images: [barbershop.logo_url] }),
    },
  };
}

export default function BarbershopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
