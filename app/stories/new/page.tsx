'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { BookHeart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Feedback';
import { LogoWithText } from '@/components/Logo';
import ThemeToggle from '@/components/ThemeToggle';
import Credits from '@/components/Credits';

/**
 * First run: a signed-in user who belongs to no story lands here rather than
 * on an empty dashboard. Names are user-supplied - there is no generated
 * default.
 */
export default function NewStoryPage() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Could not create your story.');
        return;
      }

      // Make it active before leaving, so the dashboard has a story to read.
      await fetch(`/api/stories/${data.story.id}/switch`, { method: 'POST' });
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Could not create your story.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <div className="flex items-center justify-between p-4 sm:p-6">
        <LogoWithText size="small" showTagline={false} />
        <ThemeToggle />
      </div>

      <main
        id="main"
        className="flex flex-1 items-center justify-center p-6 pb-16"
      >
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-6 flex justify-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
              <BookHeart className="h-8 w-8" />
            </span>
          </div>

          <h1 className="text-center text-2xl font-bold tracking-tight text-fg">
            Create your story
          </h1>
          <p className="mt-1.5 text-center text-sm text-muted">
            A story is your private space. You can invite your partner into it
            once it exists.
          </p>

          <Card className="mt-7 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}

              <Field
                label="Story name"
                required
                htmlFor="story-name"
                hint="You can rename it later."
              >
                <Input
                  id="story-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ana &amp; Ben"
                  maxLength={120}
                  autoFocus
                  required
                />
              </Field>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={saving}
                disabled={saving || !name.trim()}
              >
                {saving ? 'Creating…' : 'Create story'}
              </Button>
            </form>
          </Card>
        </div>
      </main>

      {/* This page renders neither AppShell nor AuthShell, so it needs the
          credits directly - adding them to the shells alone would skip it. */}
      <Credits />
    </div>
  );
}
