'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';

/**
 * Where to go after authenticating. Set by the invite flow (?next=/join/CODE)
 * so someone following a link lands back on it. Read from location rather than
 * useSearchParams to avoid forcing a Suspense boundary on this route.
 *
 * Only same-origin relative paths are honoured, so the parameter cannot be
 * used to bounce someone to another site.
 */
function nextDestination(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = new URLSearchParams(window.location.search).get('next');
  if (!raw) return fallback;
  if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
  return raw;
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(nextDestination('/dashboard'));
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold tracking-tight text-fg">Welcome back</h2>
      <p className="mt-1.5 text-sm text-muted">
        Log in to your shared space.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        <Field label="Username or email" htmlFor="username">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="pl-10"
              placeholder="you@example.com"
              required
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10"
              placeholder="••••••••"
              required
            />
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isLoading}
        >
          {isLoading ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <Link
          href="/auth/forgot-password"
          className="block text-sm text-brand-600 hover:underline dark:text-brand-400"
        >
          Forgot password?
        </Link>
        <p className="text-sm text-muted">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            Sign up
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
