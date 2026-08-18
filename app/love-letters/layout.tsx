import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Love Letters',
  description: 'Encrypted notes, just between you two.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
