import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ConfiguracionPage({ searchParams }: Props) {
  const params = await searchParams;
  const tab = params.tab ?? 'informacion';
  redirect(`/dashboard/barberia?tab=${tab}`);
}
