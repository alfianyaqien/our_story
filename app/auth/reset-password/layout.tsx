import type { Metadata } from 'next';

// Pages here are client components, so their title lives in the route layout.
export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Set a new password for your account.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
