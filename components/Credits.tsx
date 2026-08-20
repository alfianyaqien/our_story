import { Github, Instagram, Linkedin, Youtube } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Author credit and social links.
 *
 * Rendered by both shells, so it appears on the signed-out auth pages and on
 * every signed-in page without each page opting in.
 *
 * Icons come from lucide-react, which the rest of the app already uses, rather
 * than the filled brand glyphs in the reference screenshot. Mixing a filled
 * brand set into a stroke-based UI reads as pasted in from somewhere else, and
 * lucide has no TikTok icon at all - so a filled set would have meant either one
 * odd icon out or hand-drawing all five and hoping the paths were right.
 * TikTokIcon below is drawn to match lucide's conventions instead: 24x24 box,
 * currentColor stroke, width 2, round caps and joins.
 */

/**
 * ⚠️ VERIFY THESE BEFORE MERGING.
 *
 * Only the GitHub handle is confirmed - it is the account this repository lives
 * under. The other four are assumed to reuse the same handle, which is a guess:
 * if any differs, that link points at a stranger's profile from a page carrying
 * your name. Deploys are automatic on merge to main, so a wrong value here goes
 * live immediately.
 */
const AUTHOR = 'Muhammad Alfian Nurul Yaqien';

const SOCIALS = [
  { label: 'Instagram', href: 'https://instagram.com/alfianyaqien', Icon: Instagram },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/alfianyaqien', Icon: Linkedin },
  { label: 'GitHub', href: 'https://github.com/alfianyaqien', Icon: Github },
  { label: 'YouTube', href: 'https://youtube.com/@alfianyaqien', Icon: Youtube },
  { label: 'TikTok', href: 'https://tiktok.com/@alfianyaqien', Icon: TikTokIcon },
] as const;

/** lucide-react has no TikTok glyph, so this follows its drawing conventions. */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Note stem and its hook into the top-right flag. */}
      <path d="M15 3v11.5a4.5 4.5 0 1 1-4.5-4.5" />
      <path d="M15 3a5 5 0 0 0 5 5" />
    </svg>
  );
}

export default function Credits({ className }: { className?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        'border-t border-default px-4 py-8 lg:px-8',
        className
      )}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-5">
        {/* aria-label rather than a visible heading: the row is decorative
            chrome, and a heading here would clutter the page outline. */}
        <ul className="flex items-center gap-2" aria-label={`${AUTHOR} on social media`}>
          {SOCIALS.map(({ label, href, Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                // noopener is the one that matters - without it the opened tab
                // gets a window.opener handle back into this origin.
                rel="noopener noreferrer me"
                // The icon is aria-hidden, so the accessible name comes from
                // here. "(opens in a new tab)" because target="_blank" is
                // otherwise unannounced.
                aria-label={`${label} (opens in a new tab)`}
                title={label}
                className={cn(
                  'grid h-11 w-11 place-items-center rounded-2xl text-muted',
                  'transition-colors hover:bg-surface-2 hover:text-fg',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
                )}
              >
                <Icon className="h-5 w-5" />
              </a>
            </li>
          ))}
        </ul>

        {/* Two lines rather than one. On a narrow column a single line wrapped
            mid-name - "Muhammad Alfian Nurul / Yaqien · © 2026" - which reads as
            two different people. Splitting them means the name only ever wraps
            against itself. */}
        <div className="space-y-1 text-center text-sm text-muted">
          <p>
            Built by{' '}
            <span className="font-semibold text-fg">{AUTHOR}</span>
          </p>
          <p>{`© ${year}. All rights reserved.`}</p>
        </div>
      </div>
    </footer>
  );
}
