import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { getAuthSession } from '@/lib/auth';

export default async function LoginPage() {
  const session = await getAuthSession();

  if (session?.user?.id) {
    redirect('/');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <AuthForm />
    </main>
  );
}