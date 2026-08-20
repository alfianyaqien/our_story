import type { ReactNode } from 'react';
import { Camera, StickyNote, Mail, ChefHat } from 'lucide-react';
import { LogoWithText } from './Logo';
import ThemeToggle from './ThemeToggle';
import { BackLink } from './ui/BackLink';
import Credits from './Credits';

const HIGHLIGHTS = [
  {
    icon: Mail,
    title: 'Encrypted love letters',
    desc: 'Private notes, sealed end to end.',
  },
  {
    icon: Camera,
    title: 'Shared gallery',
    desc: 'Albums and slideshows of your moments.',
  },
  {
    icon: ChefHat,
    title: 'Culinary plans',
    desc: 'Rate the meals you cook together.',
  },
  {
    icon: StickyNote,
    title: 'Notes & wishlists',
    desc: 'Plan trips and dreams side by side.',
  },
];

/** Two-column auth shell: a brand panel and the form slot. */
export function AuthShell({
  children,
  back,
}: {
  children: ReactNode;
  /**
   * Renders a back link above the form. Every auth screen except the login
   * root should pass this: the app runs standalone as a PWA, so there is no
   * browser back button to fall back on.
   */
  back?: { href: string; label: string };
}) {
  return (
    <div className="flex min-h-screen bg-app">
      {/* Brand panel - desktop only */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-gradient p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-300/20 blur-3xl" />

        <div className="relative [&_h1]:!bg-none [&_h1]:!bg-clip-border [&_h1]:!text-white [&_p]:!text-white/70">
          <LogoWithText size="default" showTagline={false} />
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
            Every moment you share, kept in one place.
          </h2>
          <p className="mt-4 max-w-sm text-white/80">
            A private space for the two of you — letters, photos, plans and the
            small things worth remembering.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl bg-white/10 p-4 backdrop-blur"
              >
                <h.icon className="h-5 w-5" />
                <p className="mt-2 text-sm font-semibold">{h.title}</p>
                <p className="mt-0.5 text-xs text-white/70">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} Our Story By Alfian.
        </p>
      </div>

      {/* Form column. The column is a plain div so <main> can be flex-1 and the
          credits can sit at the bottom; the outer container is a flex ROW, so a
          footer placed after it would land beside the panel rather than under
          the form. id="main" stays on <main> itself - the skip link targets it. */}
      <div className="relative flex w-full flex-col lg:w-1/2">
        <div className="absolute right-4 top-4 z-10">
          <ThemeToggle />
        </div>
        <main
          id="main"
          className="flex flex-1 flex-col items-center justify-center p-6"
        >
          <div className="w-full max-w-sm animate-slide-up">
            {/* Mobile brand lockup - the panel is hidden below lg */}
            <div className="mb-8 flex justify-center lg:hidden">
              <LogoWithText size="default" showTagline />
            </div>
            {back && (
              <div className="mb-4">
                <BackLink href={back.href}>{back.label}</BackLink>
              </div>
            )}
            {children}
          </div>
        </main>

        {/* Borderless here: the form column already reads as one surface, and a
            rule across it would cut the page in half visually. */}
        <Credits className="border-t-0 pt-0" />
      </div>
    </div>
  );
}
