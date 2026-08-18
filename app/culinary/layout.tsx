import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Culinary Plan',
  description: 'Places to try, and the ones you loved.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
