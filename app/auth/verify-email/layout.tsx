import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Verify email',
  description: 'Confirm your email address.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
