'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Check, ArrowLeft } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          data.message ||
            'If an account exists with this email, you will receive a password reset link.'
        );
        setEmail('');
      } else {
        setError(data.error || 'Failed to process request');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold tracking-tight text-fg">
        Reset your password
      </h2>
      <p className="mt-1.5 text-sm text-muted">
        Enter your email address and we&apos;ll send you a link to reset your
        password.
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

        <Field label="Email address" htmlFor="email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10"
              placeholder="your.email@example.com"
              required
            />
          </div>
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={isLoading}>
          {isLoading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to log in
      </Link>
    </AuthShell>
  );
}
