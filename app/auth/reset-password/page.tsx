'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Check, X, ArrowLeft } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Alert, PageLoader } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

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

    if (!token) {
      setError('Invalid reset link');
      return;
    }

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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/?reset=success');
        }, 2000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && error) {
    return (
      <>
        <h2 className="text-2xl font-bold tracking-tight text-fg">
          Link not valid
        </h2>
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
        <Link
          href="/auth/forgot-password"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          <ArrowLeft size={16} />
          Request a new reset link
        </Link>
      </>
    );
  }

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
    <>
      <h2 className="text-2xl font-bold tracking-tight text-fg">
        Choose a new password
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        Pick something you haven&apos;t used before.
      </p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        {error && <Alert variant="error">{error}</Alert>}

        {success && (
          <Alert variant="success">
            <span className="flex items-start gap-2">
              <Check size={18} className="mt-0.5 shrink-0" />
              <span>{success}</span>
            </span>
          </Alert>
        )}

        <Field label="New password" required htmlFor="password">
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

        <Field label="Confirm new password" required htmlFor="confirmPassword">
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
          {isLoading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to log in
      </Link>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell back={{ href: '/', label: 'Back to log in' }}>
      <Suspense fallback={<PageLoader />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
