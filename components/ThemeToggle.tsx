'use client';

import { useTheme } from './ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      // h-11/w-11 = 44px, the minimum comfortable touch target.
      className="grid h-11 w-11 place-items-center rounded-2xl border border-default bg-surface text-muted shadow-soft transition-all hover:border-brand-300 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Moon className="h-[18px] w-[18px]" />
      ) : (
        <Sun className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
