'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { AuthShell } from '@/components/AuthShell';
import { Button } from '@/components/ui/Button';
import { Alert, PageLoader, Spinner } from '@/components/ui/Feedback';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const hasVerified = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage(
        'Invalid verification link. Please check your email for the correct link.'
      );
      return;
    }

    // Prevent double verification (React 18 StrictMode calls useEffect twice in development)
    if (hasVerified.current) {
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      hasVerified.current = true;

      try {
        const response = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(
            data.message || 'Your email has been verified successfully!'
          );
        } else {
          setStatus('error');
          setMessage(
            data.error || 'Verification failed. The link may have expired.'
          );
        }
      } catch (err) {
        setStatus('error');
        setMessage(
          'An error occurred during verification. Please try again.'
        );
      }
    };

    verifyEmail();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <Spinner className="h-8 w-8" />
        <div>
          <h2 className="text-xl font-semibold text-fg">
            Verifying your email…
          </h2>
          <p className="mt-1 text-sm text-muted">This only takes a moment.</p>
        </div>
      </div>
    );
  }

  const isSuccess = status === 'success';

  return (
    <div className="text-center">
      <div
        className={
          isSuccess
            ? 'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300'
        }
      >
        {isSuccess ? (
          <CheckCircle className="h-8 w-8" />
        ) : (
          <XCircle className="h-8 w-8" />
        )}
      </div>

      <h2 className="mt-5 text-2xl font-bold tracking-tight text-fg">
        {isSuccess ? 'Email verified' : 'Verification failed'}
      </h2>

      <Alert
        variant={isSuccess ? 'success' : 'error'}
        className="mt-4 text-left"
      >
        {message}
      </Alert>

      {isSuccess ? (
        <Link href="/" className="mt-6 block">
          <Button size="lg" className="w-full">
            Continue to log in
          </Button>
        </Link>
      ) : (
        <div className="mt-6 space-y-3">
          <Link href="/auth/signup" className="block">
            <Button variant="secondary" size="lg" className="w-full">
              Sign up again
            </Button>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to log in
          </Link>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell>
      <Suspense fallback={<PageLoader label="Verifying…" />}>
        <VerifyEmailContent />
      </Suspense>
    </AuthShell>
  );
}
