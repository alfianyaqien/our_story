import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireUser, requireOwner, StoryAccessError } from '@/lib/story';
import { loadInvite } from '@/lib/invites';

/**
 * Preview an invite before accepting.
 *
 * Deliberately readable while signed out: someone following a link needs to
 * see what they are joining before being asked to sign up. It exposes only
 * the story name and the inviter's display name - nothing about the content
 * or the other members.
 */
export async function GET(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const invite = await loadInvite(params.code);

    if (!invite) {
      return NextResponse.json(
        { error: 'This invite link is not valid' },
        { status: 404 }
      );
    }
    if (invite.revoked_at) {
      return NextResponse.json(
        { error: 'This invite has been revoked' },
        { status: 410 }
      );
    }
    if (invite.accepted_at) {
      return NextResponse.json(
        { error: 'This invite has already been used' },
        { status: 409 }
      );
    }
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'This invite has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      invite: {
        storyName: invite.story_name,
        invitedBy: invite.inviter_name,
        expiresAt: invite.expires_at,
      },
    });
  } catch (error) {
    console.error('Error loading invite:', error);
    return NextResponse.json(
      { error: 'Failed to load invite' },
      { status: 500 }
    );
  }
}

/** Revoke an unused invite (owner only). */
export async function DELETE(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const userId = await requireUser();
    const invite = await loadInvite(params.code);

    if (!invite) {
      return NextResponse.json({ error: 'Unknown invite' }, { status: 404 });
    }
    await requireOwner(userId, invite.story_id);

    await pool.execute(
      'UPDATE story_invites SET revoked_at = NOW() WHERE id = ? AND accepted_at IS NULL',
      [invite.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error revoking invite:', error);
    return NextResponse.json(
      { error: 'Failed to revoke invite' },
      { status: 500 }
    );
  }
}
