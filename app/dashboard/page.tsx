'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mail,
  StickyNote,
  Camera,
  PenTool,
  Plane,
  ChefHat,
  Gift,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { NavCard } from '@/components/ui/NavCard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoader, Skeleton } from '@/components/ui/Feedback';

interface User {
  username: string;
  displayName: string;
}

interface Quote {
  text: string;
  author: string;
}

const FEATURES = [
  {
    title: 'Love Letters',
    description: 'Send encrypted messages',
    icon: Mail,
    href: '/love-letters',
    hero: true,
    decor: 'hero' as const,
  },
  {
    title: 'Shared Notes',
    description: 'Collaborate together',
    icon: StickyNote,
    href: '/notes',
    accent: '#bfa23a',
    decor: 'b' as const,
  },
  {
    title: 'Photo Gallery',
    description: 'Cherish memories',
    icon: Camera,
    href: '/gallery',
    accent: '#6f86c9',
    decor: 'c' as const,
  },
  {
    title: 'Letter Maker',
    description: 'Create beautiful letters',
    icon: PenTool,
    href: '/letter-maker',
    accent: '#c2706a',
    decor: 'd' as const,
  },
  {
    title: 'Travel Planner',
    description: 'Plan adventures',
    icon: Plane,
    href: '/travel',
    accent: '#7e6cc0',
    decor: 'e' as const,
  },
  {
    title: 'Culinary Plan',
    description: 'Plan culinary adventures',
    icon: ChefHat,
    href: '/culinary',
    accent: '#0c8b7c',
    decor: 'a' as const,
  },
  {
    title: 'Wishlists',
    description: 'Dream together',
    icon: Gift,
    href: '/wishlist',
    accent: '#bfa23a',
    decor: 'c' as const,
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        router.push('/');
      }
    } catch (error) {
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuote = async () => {
    setIsLoadingQuote(true);
    try {
      const response = await fetch('/api/quote');
      if (response.ok) {
        const data = await response.json();
        setQuote(data.quote);
      }
    } catch (error) {
      // Set a default quote if API fails
      setQuote({
        text: 'Indeed, with hardship comes ease.',
        author: 'Quran 94:6',
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-app">
        <PageLoader label="Loading your space…" />
      </div>
    );
  }

  return (
    <AppShell user={user}>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Welcome back, {user?.displayName}
        </h1>
        <p className="mt-1.5 text-muted">What would you like to do today?</p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((f) => (
          <NavCard
            key={f.title}
            title={f.title}
            description={f.description}
            icon={f.icon}
            href={f.href}
            hero={f.hero}
            accent={f.accent}
            decor={f.decor}
          />
        ))}
      </div>

      {/* Quote of the day */}
      <Card className="mx-auto mt-12 max-w-2xl p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <BookOpen className="h-6 w-6" />
        </div>

        {quote ? (
          <div className="mt-5 flex min-h-[120px] flex-col justify-center">
            <p className="text-lg italic leading-relaxed text-fg sm:text-xl">
              &ldquo;{quote.text}&rdquo;
            </p>
            <p className="mt-4 text-sm text-muted">— {quote.author}</p>
          </div>
        ) : (
          <div className="mt-5 flex min-h-[120px] flex-col justify-center gap-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-4/5 self-center" />
            <Skeleton className="mt-2 h-4 w-24 self-center" />
          </div>
        )}

        <Button
          variant="secondary"
          onClick={fetchQuote}
          disabled={isLoadingQuote}
          className="mx-auto mt-6"
          title="Get a new quote"
        >
          <RefreshCw
            className={isLoadingQuote ? 'h-4 w-4 animate-spin' : 'h-4 w-4'}
          />
          New quote
        </Button>
      </Card>
    </AppShell>
  );
}
