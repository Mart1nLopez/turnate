import { notFound } from 'next/navigation';
import { getBarbershopPageData } from '@/services/barbershopPublicService';
import BarbershopHero from '@/components/barbershopPage/BarbershopHero';
import BarbershopInfo from '@/components/barbershopPage/BarbershopInfo';
import TeamGrid from '@/components/barbershopPage/TeamGrid';
import Footer from '@/components/professionalPage/Footer';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BarbershopPublicPage({ params }: Props) {
  const { slug } = await params;
  const data = await getBarbershopPageData(slug);

  if (!data) notFound();

  const { barbershop, team } = data;

  return (
    <div className="min-h-screen">
      <BarbershopHero barbershop={barbershop} />
      <TeamGrid team={team} />
      <BarbershopInfo barbershop={barbershop} />
      <Footer />
    </div>
  );
}
