import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Photo Gallery',
  description: 'Albums and slideshows of your moments.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
