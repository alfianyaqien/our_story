'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookHeart, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, Spinner } from '@/components/ui/Feedback';
import { LogoWithText } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';

interface InvitePreview {
  storyName: string;
  invitedBy: string;
}

/**
 * Landing page for an invite link.
 *
 * The preview is readable signed-out on purpose: someone should see what they
 * are being invited to before being asked to create an account. Accepting
 * requires a session, so a signed-out visitor is sent to sign up and returned
 * here afterwards.
 */
export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = params.code;

  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [inviteRes, sessionRes] = await Promise.all([
          fetch(`/api/invites/${encodeURIComponent(code)}`),
          fetch('/api/auth/session'),
        ]);

        setSignedIn(sessionRes.ok);

        const data = await inviteRes.json().catch(() => ({}));
        if (!inviteRes.ok) {
          setError(data.error || 'This invite link is not valid.');
        } else {
          setInvite(data.invite);
        }
      } catch {
        setError('Could not load this invite.');
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const accept = async () => {
    setAccepting(true);
    setError('');
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(code)}/accept`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not join this story.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Could not join this story.');
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <LogoWithText size="small" showTagline={false} />
        <ThemeToggle />
      </div>

      <main id="main" className="flex flex-1 items-center justify-center p-6 pb-16">
        <div className="w-full max-w-md animate-slide-up">
          {loading ? (
            <Card className="flex items-center justify-center gap-3 p-10 text-muted">
              <Spinner className="h-5 w-5" />
              Loading invite…
            </Card>
          ) : error && !invite ? (
            <Card className="p-8 text-center">
              <h1 className="text-xl font-bold tracking-tight text-fg">
                Invite not available
              </h1>
              <Alert variant="error" className="mt-4 text-left">
                {error}
              </Alert>
              <Link href="/" className="mt-6 inline-block">
                <Button variant="secondary">Go to Our Story</Button>
              </Link>
            </Card>
          ) : (
            <>
              <div className="mb-6 flex justify-center">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                  <BookHeart className="h-8 w-8" />
                </span>
              </div>

              <h1 className="text-center text-2xl font-bold tracking-tight text-fg">
                Join {invite?.storyName}
              </h1>
              <p className="mt-1.5 text-center text-sm text-muted">
                {invite?.invitedBy} invited you to share this story.
              </p>

              <Card className="mt-7 p-6">
                {error && (
                  <Alert variant="error" className="mb-4">
                    {error}
                  </Alert>
                )}

                {signedIn ? (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={accept}
                    loading={accepting}
                    disabled={accepting}
                  >
                    <Check className="h-4 w-4" />
                    {accepting ? 'Joining…' : 'Accept invitation'}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted">
                      Sign in or create an account to accept. You&apos;ll come
                      straight back here.
                    </p>
                    <Link
                      href={`/auth/signup?next=${encodeURIComponent(`/join/${code}`)}`}
                      className="block"
                    >
                      <Button size="lg" className="w-full">
                        Create an account
                      </Button>
                    </Link>
                    <Link
                      href={`/?next=${encodeURIComponent(`/join/${code}`)}`}
                      className="block"
                    >
                      <Button variant="secondary" size="lg" className="w-full">
                        I already have one
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
