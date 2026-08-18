'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
}

export default function PageHeader({ title, showBackButton = true }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Link 
            href="/dashboard" 
            className="grid h-11 w-11 place-items-center rounded-2xl border border-default bg-surface text-muted shadow-soft transition-all hover:border-brand-300 hover:text-fg"
          >
            <ArrowLeft size={20} />
          </Link>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-fg">
          {title}
        </h1>
      </div>
      <ThemeToggle />
    </div>
  );
}
