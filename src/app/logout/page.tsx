import { redirect } from 'next/navigation';
import { signOut } from '@/auth';

export default async function LogoutPage() {
    await signOut({ redirectTo: '/login' });
    redirect('/login');
} 