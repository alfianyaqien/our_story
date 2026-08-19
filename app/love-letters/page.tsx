'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Send, Heart, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea, Select, Field } from '@/components/ui/Input';
import { Alert, EmptyState, Spinner } from '@/components/ui/Feedback';
import { cn } from '@/lib/utils';

interface LoveLetter {
  id: number;
  fromUserId: number;
  toUserId: number;
  senderName: string;
  receiverName: string;
  subject: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  isSent: boolean;
}

const FILTERS = ['all', 'received', 'sent'] as const;

export default function LoveLettersPage() {
  const [letters, setLetters] = useState<LoveLetter[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<LoveLetter | null>(null);
  const [filter, setFilter] = useState<'all' | 'received' | 'sent'>('all');

  useEffect(() => {
    fetchLetters();
  }, []);

  const fetchLetters = async () => {
    const response = await fetch('/api/love-letters');
    if (response.ok) {
      const data = await response.json();
      setLetters(data.letters);
    }
  };

  const filteredLetters = letters.filter((letter) => {
    if (filter === 'received') return !letter.isSent;
    if (filter === 'sent') return letter.isSent;
    return true;
  });

  const listVisible = !showCompose && !selectedLetter;

  return (
    <AppShell>
      <PageTitle
        title="Love Letters"
        description="Encrypted notes, just between you two."
        action={
          listVisible && (
            <Button onClick={() => setShowCompose(true)}>
              <Send className="h-4 w-4" />
              New letter
            </Button>
          )
        }
      />

      {listVisible && (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'primary' : 'secondary'}
                size="sm"
                className="h-10 capitalize sm:h-8"
                onClick={() => setFilter(f)}
              >
                {f}
              </Button>
            ))}
          </div>

          {filteredLetters.length === 0 ? (
            <Card>
              <EmptyState
                icon={Heart}
                title="No letters yet"
                description="Write the first one."
                action={
                  <Button onClick={() => setShowCompose(true)}>
                    <Send className="h-4 w-4" />
                    New letter
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredLetters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => setSelectedLetter(letter)}
                  className={cn(
                    'rounded-2xl border border-default bg-surface p-6 text-left shadow-soft transition-all duration-200',
                    'hover:-translate-y-0.5 hover:shadow-card',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        {letter.isSent ? (
                          <Send className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
                        ) : (
                          <Inbox className="h-4 w-4 shrink-0 text-accent-coral" />
                        )}
                        <span className="truncate text-sm font-medium text-muted">
                          {letter.isSent
                            ? `To: ${letter.receiverName}`
                            : `From: ${letter.senderName}`}
                        </span>
                      </div>
                      <h3 className="mb-2 break-words text-lg font-semibold text-fg">
                        {letter.subject}
                      </h3>
                      <p className="line-clamp-2 break-words text-sm text-muted">
                        {letter.content}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs text-muted">
                      {formatDistanceToNow(new Date(letter.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {showCompose && (
        <ComposeForm
          onClose={() => {
            setShowCompose(false);
            fetchLetters();
          }}
        />
      )}
      {selectedLetter && (
        <LetterView
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </AppShell>
  );
}

interface Recipient {
  id: number;
  username: string;
  displayName: string;
}

function ComposeForm({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);
  const [error, setError] = useState('');

  // Recipients come from the database. This used to be a hardcoded
  // "Partner 1" / "Partner 2" with ids 1 and 2, which only matched if those
  // accounts happened to be the first two rows - otherwise every send failed
  // the to_user_id foreign key.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          setRecipients(data.users || []);
          if ((data.users || []).length === 1) {
            setToUserId(String(data.users[0].id));
          }
        } else {
          setError('Could not load recipients.');
        }
      } catch {
        setError('Could not load recipients.');
      } finally {
        setLoadingRecipients(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/love-letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: parseInt(toUserId), subject, content }),
      });

      if (response.ok) {
        onClose();
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || 'Could not send the letter. Please try again.');
      }
    } catch {
      setError('Could not send the letter. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-2xl font-bold tracking-tight text-fg">
        Compose a love letter
      </h2>
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {!loadingRecipients && recipients.length === 0 && (
        <Alert variant="info" className="mb-4">
          There is no one to write to yet. Once your partner creates an account
          and verifies their email, they will show up here.
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="To" required htmlFor="ll-to">
          {loadingRecipients ? (
            <div className="flex h-11 items-center gap-2 text-sm text-muted">
              <Spinner className="h-4 w-4" />
              Loading recipients…
            </div>
          ) : (
            <Select
              id="ll-to"
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              disabled={recipients.length === 0}
              required
            >
              <option value="">Select recipient</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.displayName || r.username}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Subject" required htmlFor="ll-subject">
          <Input
            id="ll-subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this letter about?"
            required
          />
        </Field>

        <Field label="Message" required htmlFor="ll-content">
          <Textarea
            id="ll-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="min-h-[14rem]"
            placeholder="Pour your heart out…"
            required
          />
        </Field>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="submit"
            size="lg"
            className="flex-1"
            loading={isSubmitting}
            disabled={isSubmitting || loadingRecipients || recipients.length === 0}
          >
            {isSubmitting ? 'Sending…' : 'Send letter'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

function LetterView({
  letter,
  onClose,
}: {
  letter: LoveLetter;
  onClose: () => void;
}) {
  return (
    <Card className="mx-auto max-w-2xl p-6 sm:p-8">
      <Button variant="ghost" size="sm" className="mb-6 h-10 sm:h-8" onClick={onClose}>
        <ArrowLeft className="h-4 w-4" />
        Back to letters
      </Button>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-2 text-sm text-muted">
          {letter.isSent ? (
            <>
              <Send className="h-4 w-4 shrink-0" />
              <span className="truncate">To: {letter.receiverName}</span>
            </>
          ) : (
            <>
              <Inbox className="h-4 w-4 shrink-0" />
              <span className="truncate">From: {letter.senderName}</span>
            </>
          )}
        </div>
        <h2 className="break-words text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {letter.subject}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {formatDistanceToNow(new Date(letter.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>

      <div className="whitespace-pre-wrap break-words rounded-xl border border-default bg-surface-2 p-6 leading-relaxed text-fg">
        {letter.content}
      </div>

      <div className="mt-6 flex justify-center">
        <Heart className="h-8 w-8 text-brand-500" fill="currentColor" />
      </div>
    </Card>
  );
}
