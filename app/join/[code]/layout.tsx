import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join a story',
  description: 'Accept an invitation.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
