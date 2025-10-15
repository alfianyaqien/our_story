'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { LogoWithText } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const hasVerified = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email for the correct link.');
      return;
    }

    // Prevent double verification (React 18 StrictMode calls useEffect twice in development)
    if (hasVerified.current) {
      console.log('⏭️ Already verified, skipping duplicate call');
      return;
    }

    // Verify the email
    const verifyEmail = async () => {
      hasVerified.current = true;
      
      try {
        console.log('🔍 Calling verification API...');
        const response = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await response.json();

        console.log('📊 API Response:', { status: response.status, data });

        if (response.ok) {
          console.log('✅ Verification successful!');
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully!');
        } else {
          console.log('❌ Verification failed:', data.error);
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      } catch (err) {
        console.error('❌ Verification error:', err);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <LogoWithText size="large" showTagline={true} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Email Verification</h2>
        </div>

        {/* Verification Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center">
            {status === 'loading' && (
              <div>
                <Loader2 className="w-16 h-16 mx-auto mb-4 text-love-ocean dark:text-love-sky animate-spin" />
                <p className="text-gray-700 dark:text-gray-300 text-lg">Verifying your email...</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Email Verified!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <div className="space-y-3">
                  <a
                    href="/"
                    className="block w-full bg-gradient-to-r from-love-sky via-love-ocean to-love-navy text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all"
                  >
                    Continue to Login
                  </a>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  Verification Failed
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <div className="space-y-3">
                  {message.includes('already been verified') || message.includes('already been used') ? (
                    <a
                      href="/"
                      className="block w-full bg-gradient-to-r from-love-sky via-love-ocean to-love-navy text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all"
                    >
                      Go to Login
                    </a>
                  ) : (
                    <>
                      <a
                        href="/auth/signup"
                        className="block w-full bg-gradient-to-r from-love-sky via-love-ocean to-love-navy text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all"
                      >
                        Sign Up Again
                      </a>
                      <a
                        href="/"
                        className="block w-full border-2 border-love-ocean dark:border-love-sky text-love-ocean dark:text-love-sky font-semibold py-3 rounded-lg hover:bg-love-ice dark:hover:bg-gray-700 transition-all"
                      >
                        Back to Login
                      </a>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        {status === 'error' && (
          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400 px-4">
            <p>
              If you continue to experience issues, please contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-love-ice via-white to-love-lavender dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
