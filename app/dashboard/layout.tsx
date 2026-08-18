import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Everything you share, in one place.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
