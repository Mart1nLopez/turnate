import { notFound } from 'next/navigation';
import { getBarbershopPageData } from '@/services/barbershopPublicService';
import { getThemeById, getThemeCssVars } from '@/lib/barbershopThemes';
import BarbershopHero from '@/components/barbershopPage/BarbershopHero';
import TrustMetrics from '@/components/barbershopPage/TrustMetrics';
import TeamGrid from '@/components/barbershopPage/TeamGrid';
import BarbershopInfo from '@/components/barbershopPage/BarbershopInfo';
import BarbershopFooter from '@/components/barbershopPage/BarbershopFooter';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BarbershopPublicPage({ params }: Props) {
  const { slug } = await params;
  const data = await getBarbershopPageData(slug);

  if (!data) notFound();

  const { barbershop, team } = data;

  // Derive theme once at the page root.
  // All child components consume the resulting CSS vars — no prop drilling.
  // Falls back to 'luxury-gold' for barbershops created before the theme migration.
  const theme   = getThemeById(barbershop.theme);
  const cssVars = getThemeCssVars(theme);

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.backgroundColor, ...(cssVars as React.CSSProperties) }}
    >
      <BarbershopHero barbershop={barbershop} team={team} />
      <TrustMetrics team={team} barbershop={barbershop} />
      <TeamGrid team={team} />
      <BarbershopInfo barbershop={barbershop} />
      <BarbershopFooter />
    </div>
  );
}
