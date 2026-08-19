import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create a story',
  description: 'Start a new shared space.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
