'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Mail,
  StickyNote,
  Camera,
  PenTool,
  Plane,
  ChefHat,
  Gift,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import Logo from '@/components/Logo';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, MenuItem, MenuDivider } from '@/components/ui/Dropdown';

export const NAV: {
  href: string;
  label: string;
  icon: LucideIcon;
}[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/love-letters', label: 'Love Letters', icon: Mail },
  { href: '/notes', label: 'Notes', icon: StickyNote },
  { href: '/gallery', label: 'Gallery', icon: Camera },
  { href: '/letter-maker', label: 'Letter Maker', icon: PenTool },
  { href: '/travel', label: 'Travel', icon: Plane },
  { href: '/culinary', label: 'Culinary', icon: ChefHat },
  { href: '/wishlist', label: 'Wishlist', icon: Gift },
];

/** Rail row: icon only when collapsed, label appears as the rail expands. */
function RailItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="mx-3 flex h-11 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-surface-2"
    >
      <span
        className={cn(
          'grid h-9 w-9 shrink-0 place-items-center rounded-lg transition-colors',
          active
            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
            : 'text-muted'
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span
        className={cn(
          'whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100',
          active ? 'text-fg' : 'text-muted'
        )}
      >
        {label}
      </span>
    </Link>
  );
}

export interface ShellUser {
  username?: string;
  displayName?: string;
}

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  /**
   * Pass the session user when the page already fetched it (the dashboard
   * does). Omit it and the shell fetches /api/auth/session itself and
   * redirects to login on 401, so feature pages don't each repeat that.
   */
  user?: ShellUser | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [mobileNav, setMobileNav] = useState(false);
  const [ownUser, setOwnUser] = useState<ShellUser | null>(null);
  const [activeStory, setActiveStory] = useState<{ id: number; name: string } | null>(null);
  const selfFetch = user === undefined;

  useEffect(() => {
    if (!selfFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        if (!cancelled) setOwnUser(data.user);
      } catch {
        router.push('/');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selfFetch, router]);

  // A signed-in user with no story cannot load any feature data, so send them
  // to create one rather than showing an app full of empty states.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/stories');
        if (!res.ok) return;
        const data = await res.json();
        const stories = data.stories || [];
        if (cancelled) return;
        if (stories.length === 0) {
          router.push('/stories/new');
          return;
        }
        setActiveStory({ id: stories[0].id, name: stories[0].name });
      } catch {
        // leave the shell as-is; feature pages surface their own errors
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const shellUser = selfFetch ? ownUser : user;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <div className="flex min-h-screen bg-app">
      {/* Desktop rail (hover to expand) */}
      <div className="hidden w-20 shrink-0 lg:block" aria-hidden />
      <aside className="group fixed left-0 top-0 z-40 hidden h-screen w-20 flex-col overflow-hidden border-r border-default bg-surface py-5 transition-[width] duration-200 ease-out hover:w-64 hover:shadow-pop lg:flex">
        <Link
          href="/dashboard"
          className="mx-3 flex h-10 items-center gap-3 rounded-xl px-2"
          aria-label="Dashboard"
        >
          <span className="shrink-0">
            <Logo size="small" variant="minimal" />
          </span>
          <span className="min-w-0 whitespace-nowrap opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="block truncate text-lg font-bold leading-tight tracking-tight text-fg">
              {activeStory?.name || 'Our Story'}
            </span>
            {activeStory && (
              <span className="block truncate text-[11px] text-muted">
                Our Story
              </span>
            )}
          </span>
        </Link>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <RailItem
              key={item.href}
              {...item}
              active={pathname === item.href}
            />
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          className="mx-3 mt-auto flex h-11 items-center gap-3 rounded-xl px-2 transition-colors hover:bg-surface-2"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center text-muted">
            {isDark ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </span>
          <span className="whitespace-nowrap text-sm font-medium text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            {isDark ? 'Light mode' : 'Dark mode'}
          </span>
        </button>
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileNav(false)}
          />
          <aside className="relative flex h-full w-64 max-w-[80vw] flex-col overflow-y-auto scrollbar-thin bg-surface p-4 shadow-pop">
            <div className="flex items-center justify-between">
              <span className="min-w-0 truncate text-lg font-bold tracking-tight text-fg">
                {activeStory?.name || 'Our Story'}
              </span>
              <button
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2"
                onClick={() => setMobileNav(false)}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-5 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNav(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                      : 'text-muted hover:bg-surface-2 hover:text-fg'
                  )}
                >
                  <item.icon className="h-5 w-5" /> {item.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-auto flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut className="h-5 w-5" /> Log out
            </button>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[4.5rem] items-center gap-1 px-4 lg:px-8">
          <button
            className="grid h-11 w-11 place-items-center rounded-2xl text-muted lg:hidden"
            onClick={() => setMobileNav(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Back to dashboard. Only on mobile and only off the dashboard
              itself - the desktop rail already provides this, but on a phone
              the drawer is two taps and the app runs standalone as a PWA with
              no browser back button. */}
          {pathname !== '/dashboard' && (
            <Link
              href="/dashboard"
              className="grid h-11 w-11 place-items-center rounded-2xl text-muted transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 lg:hidden"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-default bg-surface text-muted shadow-soft transition-all hover:border-brand-300 hover:text-fg"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </button>

            <Dropdown
              align="right"
              trigger={
                <button className="flex h-11 items-center gap-2.5 rounded-2xl pl-1.5 pr-2.5 transition-colors hover:bg-surface-2">
                  <Avatar name={shellUser?.displayName || shellUser?.username} size="sm" />
                  <div className="hidden min-w-0 text-left sm:block">
                    <p className="max-w-[9rem] truncate text-sm font-semibold leading-tight text-fg">
                      {shellUser?.displayName || shellUser?.username || 'Account'}
                    </p>
                    {shellUser?.username && (
                      <p className="max-w-[9rem] truncate text-[11px] text-muted">
                        @{shellUser.username}
                      </p>
                    )}
                  </div>
                </button>
              }
            >
              <div className="px-2.5 py-2 sm:hidden">
                <p className="truncate text-sm font-semibold text-fg">
                  {shellUser?.displayName || shellUser?.username || 'Account'}
                </p>
              </div>
              <MenuDivider />
              <MenuItem icon={LogOut} danger onClick={handleLogout}>
                Log out
              </MenuItem>
            </Dropdown>
          </div>
        </header>

        <main id="main" className="flex-1 px-4 pb-12 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
