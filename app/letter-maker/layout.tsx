import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Letter Maker',
  description: 'Start from a template, make it yours.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
