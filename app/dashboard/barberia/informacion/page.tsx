import { redirect } from 'next/navigation';

export default function InformacionPage() {
  redirect('/dashboard/barberia?tab=informacion');
}
