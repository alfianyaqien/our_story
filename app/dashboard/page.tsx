'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  Heart, 
  Mail, 
  StickyNote, 
  Camera, 
  PenTool, 
  Plane, 
  ChefHat, 
  Gift,
  LogOut,
  RefreshCw 
} from 'lucide-react';

interface User {
  username: string;
  displayName: string;
}

interface Quote {
  text: string;
  author: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchQuote();
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
      console.error('Error fetching quote:', error);
      // Set a default quote if API fails
      setQuote({
        text: "In all the world, there is no heart for me like yours. In all the world, there is no love for you like mine.",
        author: "Maya Angelou"
      });
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Logo size="large" className="mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      title: 'Love Letters',
      description: 'Send encrypted messages',
      icon: Mail,
      href: '/love-letters',
      image: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Shared Notes',
      description: 'Collaborate together',
      icon: StickyNote,
      href: '/notes',
      image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Photo Gallery',
      description: 'Cherish memories',
      icon: Camera,
      href: '/gallery',
      image: 'https://images.unsplash.com/photo-1452457807411-4979b707c5be?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Letter Maker',
      description: 'Create beautiful letters',
      icon: PenTool,
      href: '/letter-maker',
      image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Travel Planner',
      description: 'Plan adventures',
      icon: Plane,
      href: '/travel',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Culinary Plan',
      description: 'Plan culinary adventures',
      icon: ChefHat,
      href: '/culinary',
      image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&q=80',
    },
    {
      title: 'Wishlists',
      description: 'Dream together',
      icon: Gift,
      href: '/wishlist',
      image: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=800&h=600&fit=crop&q=80',
    },
  ];

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Logo size="default" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-love-ocean to-love-navy bg-clip-text text-transparent mb-2">
                Welcome back, {user?.displayName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-300">What would you like to do today?</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <LogOut size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="hidden md:inline text-gray-700 dark:text-gray-200">Logout</span>
            </button>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer group border border-gray-100 dark:border-gray-700/50">
                <div className="relative h-40 overflow-hidden">
                  <Image 
                    src={feature.image} 
                    alt={feature.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-love-sky to-love-ocean rounded-lg">
                      <feature.icon size={20} className="text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quote of the Day */}
        <div className="mt-12 text-center">
          <div className="inline-block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-2xl border border-love-lavender dark:border-gray-700 relative">
            <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-love-sky to-love-ocean rounded-full flex items-center justify-center">
              <Heart className="text-white" size={24} fill="white" />
            </div>
            
            {quote ? (
              <div className="min-h-[120px] flex flex-col justify-center">
                <p className="text-xl italic text-gray-700 dark:text-gray-200 mb-4">
                  "{quote.text}"
                </p>
                <p className="text-gray-500 dark:text-gray-400">— {quote.author}</p>
              </div>
            ) : (
              <div className="min-h-[120px] flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500">Loading quote...</p>
              </div>
            )}

            <button
              onClick={fetchQuote}
              disabled={isLoadingQuote}
              className="mt-6 flex items-center gap-2 mx-auto px-4 py-2 bg-gradient-to-r from-love-sky to-love-ocean text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Get a new quote"
            >
              <RefreshCw 
                size={16} 
                className={isLoadingQuote ? 'animate-spin' : ''} 
              />
              <span className="text-sm font-medium">New Quote</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
