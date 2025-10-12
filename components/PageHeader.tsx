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
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
          </Link>
        )}
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-love-ocean to-love-navy bg-clip-text text-transparent">
          {title}
        </h1>
      </div>
      <ThemeToggle />
    </div>
  );
}
