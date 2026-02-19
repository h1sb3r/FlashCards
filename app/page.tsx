import { redirect } from 'next/navigation';
import { Dashboard } from '@/components/dashboard';
import { getAuthSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getAuthSession();

  if (!session?.user?.id || !session.user.email) {
    redirect('/login');
  }

  return (
    <Dashboard
      user={{
        name: session.user.name ?? session.user.email,
        email: session.user.email,
      }}
    />
  );
}