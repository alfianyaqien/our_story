import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Request a password reset link.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
