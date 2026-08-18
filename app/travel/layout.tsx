import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Travel Planner',
  description: 'Plan the next adventure together.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
