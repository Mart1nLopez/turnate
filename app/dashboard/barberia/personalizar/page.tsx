import { redirect } from 'next/navigation';

export default function PersonalizarPage() {
  redirect('/dashboard/barberia?tab=apariencia');
}
