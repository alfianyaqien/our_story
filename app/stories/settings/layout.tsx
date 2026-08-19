import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Story settings',
  description: 'Rename, invite, and manage members.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
