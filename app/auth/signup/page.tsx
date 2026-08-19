'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, User, Lock, UserCircle, Check, X } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

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

export default function SignupPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch =
    formData.password && formData.password === formData.confirmPassword;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          data.message ||
            'Account created successfully! Please check your email to verify your account.'
        );
        setFormData({
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          displayName: '',
        });

        // Redirect to login after 3 seconds
        // Carry the invite through the verification detour, so the link is
        // still waiting after they confirm their email and sign in.
        const next = nextDestination('');
        setTimeout(() => {
          router.push(
            next
              ? `/?verified=check-email&next=${encodeURIComponent(next)}`
              : '/?verified=check-email'
          );
        }, 3000);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const strengthLabel =
    passwordStrength <= 2 ? 'Weak' : passwordStrength <= 3 ? 'Medium' : 'Strong';
  const strengthTone =
    passwordStrength <= 2
      ? 'text-red-600 dark:text-red-400'
      : passwordStrength <= 3
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400';
  const strengthBar =
    passwordStrength <= 2
      ? 'bg-red-500'
      : passwordStrength <= 3
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <AuthShell back={{ href: '/', label: 'Back to log in' }}>
      <h2 className="text-2xl font-bold tracking-tight text-fg">
        Create your account
      </h2>
      <p className="mt-1.5 text-sm text-muted">Start your journey together.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && (
          <Alert variant="error">
            <span className="flex items-start gap-2">
              <X size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </span>
          </Alert>
        )}

        {success && (
          <Alert variant="success">
            <span className="flex items-start gap-2">
              <Check size={18} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </span>
          </Alert>
        )}

        <Field label="Display name" required htmlFor="displayName">
          <div className="relative">
            <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={handleChange}
              className="pl-10"
              placeholder="e.g. Alex"
              required
            />
          </div>
        </Field>

        <Field label="Username" required htmlFor="username">
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={formData.username}
              onChange={handleChange}
              className="pl-10"
              placeholder="Choose a username"
              required
            />
          </div>
        </Field>

        <Field label="Email" required htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10"
              placeholder="your.email@example.com"
              required
            />
          </div>
        </Field>

        <Field label="Password" required htmlFor="password">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              className="pl-10"
              placeholder="Create a strong password"
              required
            />
          </div>
          {formData.password && (
            <div className="mt-2">
              <div className="mb-1 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded',
                      i < passwordStrength
                        ? strengthBar
                        : 'bg-slate-300 dark:bg-slate-600'
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-muted">
                Password strength:{' '}
                <span className={strengthTone}>{strengthLabel}</span>
              </p>
            </div>
          )}
        </Field>

        <Field label="Confirm password" required htmlFor="confirmPassword">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-10 pr-10"
              placeholder="Confirm your password"
              invalid={!!formData.confirmPassword && !passwordsMatch}
              required
            />
            {formData.confirmPassword && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {passwordsMatch ? (
                  <Check size={18} className="text-emerald-500" />
                ) : (
                  <X size={18} className="text-red-500" />
                )}
              </div>
            )}
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          loading={isLoading}
          disabled={isLoading || !passwordsMatch}
        >
          {isLoading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link
          href="/"
          className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
        >
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
