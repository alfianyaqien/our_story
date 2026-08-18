import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Wishlists',
  description: 'Dream together, one item at a time.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
