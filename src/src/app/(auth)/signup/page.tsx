import type { Metadata } from 'next';
import { SignupForm } from './signup-form';

export const metadata: Metadata = { title: 'Create account · Unimeds' };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <SignupForm next={next ?? ''} />;
}
