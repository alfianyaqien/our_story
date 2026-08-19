'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Link2, Trash2, UserMinus, X } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { PageTitle } from '@/components/ui/PageTitle';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Field } from '@/components/ui/Input';
import { Alert, Badge, Spinner } from '@/components/ui/Feedback';
import { ConfirmModal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';

interface Member {
  id: number;
  username: string;
  displayName: string;
  role: 'owner' | 'member';
}

interface Story {
  id: number;
  name: string;
  isOwner: boolean;
  members: Member[];
}

export default function StorySettingsPage() {
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Member | null>(null);

  const load = useCallback(async () => {
    try {
      const listRes = await fetch('/api/stories');
      if (!listRes.ok) return;
      const { stories } = await listRes.json();
      if (!stories?.length) {
        router.push('/stories/new');
        return;
      }
      const res = await fetch(`/api/stories/${stories[0].id}`);
      if (!res.ok) return;
      const data = await res.json();
      setStory(data.story);
      setName(data.story.name);

      if (data.story.isOwner) {
        const inv = await fetch(`/api/stories/${data.story.id}/invites`);
        if (inv.ok) {
          const { invites } = await inv.json();
          if (invites?.length) setInviteCode(invites[0].code);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const inviteUrl = inviteCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`
    : '';

  const rename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!story) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/stories/${story.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not rename the story.');
        return;
      }
      setNotice('Story renamed.');
      load();
    } finally {
      setSaving(false);
    }
  };

  const createInvite = async () => {
    if (!story) return;
    setCreatingInvite(true);
    setError('');
    try {
      const res = await fetch(`/api/stories/${story.id}/invites`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not create an invite.');
        return;
      }
      setInviteCode(data.invite.code);
    } finally {
      setCreatingInvite(false);
    }
  };

  const revokeInvite = async () => {
    if (!inviteCode) return;
    await fetch(`/api/invites/${encodeURIComponent(inviteCode)}`, {
      method: 'DELETE',
    });
    setInviteCode('');
    setNotice('Invite link revoked.');
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy. Select the link and copy it manually.');
    }
  };

  const removeMember = async (member: Member) => {
    if (!story) return;
    setConfirmRemove(null);
    const res = await fetch(`/api/stories/${story.id}/members/${member.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not remove them.');
      return;
    }
    setNotice(`${member.displayName} was removed.`);
    load();
  };

  const deleteStory = async () => {
    if (!story) return;
    setConfirmDelete(false);
    const res = await fetch(`/api/stories/${story.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'Could not delete the story.');
      return;
    }
    router.push('/stories/new');
    router.refresh();
  };

  const isFull = (story?.members.length ?? 0) >= 2;

  return (
    <AppShell>
      <PageTitle
        title="Story settings"
        description="Rename your story, invite your partner, or start over."
      />

      {loading ? (
        <Card className="flex items-center justify-center gap-3 p-10 text-muted">
          <Spinner className="h-5 w-5" />
          Loading…
        </Card>
      ) : !story ? (
        <Card className="p-6 text-sm text-muted">Story not found.</Card>
      ) : (
        <div className="max-w-2xl space-y-6">
          {error && <Alert variant="error">{error}</Alert>}
          {notice && <Alert variant="success">{notice}</Alert>}

          {/* Name */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-fg">Name</h2>
            <form onSubmit={rename} className="space-y-4">
              <Field label="Story name" htmlFor="story-name">
                <Input
                  id="story-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={120}
                  disabled={!story.isOwner}
                />
              </Field>
              {story.isOwner ? (
                <Button
                  type="submit"
                  loading={saving}
                  disabled={saving || !name.trim() || name === story.name}
                >
                  Save name
                </Button>
              ) : (
                <p className="text-sm text-muted">
                  Only the story owner can rename it.
                </p>
              )}
            </form>
          </Card>

          {/* Members */}
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-fg">
              Members{' '}
              <span className="font-normal text-muted">
                ({story.members.length} of 2)
              </span>
            </h2>
            <ul className="divide-y divide-[var(--border)]">
              {story.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={m.displayName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-fg">
                        {m.displayName}
                      </p>
                      <p className="truncate text-xs text-muted">
                        @{m.username}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={m.role === 'owner' ? 'brand' : 'default'}>
                      {m.role}
                    </Badge>
                    {story.isOwner && m.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${m.displayName}`}
                        onClick={() => setConfirmRemove(m)}
                        className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {/* Invite */}
          {story.isOwner && (
            <Card className="p-6">
              <h2 className="mb-1 text-lg font-semibold text-fg">
                Invite your partner
              </h2>
              <p className="mb-4 text-sm text-muted">
                Share this link however you like. It works once and expires
                after 7 days.
              </p>

              {isFull ? (
                <Alert variant="info">
                  This story already has a partner. Remove them first if you
                  need to invite someone else.
                </Alert>
              ) : inviteCode ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      readOnly
                      value={inviteUrl}
                      onFocus={(e) => e.currentTarget.select()}
                      className="min-w-0 flex-1 font-mono text-xs"
                    />
                    <Button variant="secondary" onClick={copy}>
                      {copied ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={revokeInvite}>
                    <X className="h-4 w-4" />
                    Revoke this link
                  </Button>
                </div>
              ) : (
                <Button onClick={createInvite} loading={creatingInvite}>
                  <Link2 className="h-4 w-4" />
                  Create invite link
                </Button>
              )}
            </Card>
          )}

          {/* Danger zone */}
          {story.isOwner && (
            <Card className="border-red-200 p-6 dark:border-red-900/50">
              <h2 className="mb-1 text-lg font-semibold text-fg">
                Delete this story
              </h2>
              <p className="mb-4 text-sm text-muted">
                Everything in it — notes, photos, letters, plans — is deleted
                too. This cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" />
                Delete story
              </Button>
            </Card>
          )}
        </div>
      )}

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteStory}
        title={`Delete "${story?.name}"?`}
        description="Every note, photo, letter and plan in this story is deleted with it. This cannot be undone."
        confirmText="Delete story"
        danger
      />

      <ConfirmModal
        open={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        onConfirm={() => confirmRemove && removeMember(confirmRemove)}
        title={`Remove ${confirmRemove?.displayName}?`}
        description="They lose access to this story. Anything they added stays."
        confirmText="Remove"
        danger
      />
    </AppShell>
  );
}
