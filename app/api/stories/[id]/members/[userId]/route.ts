import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
import {
  ACTIVE_STORY_COOKIE,
  isOwner,
  requireUser,
  StoryAccessError,
} from '@/lib/story';

/**
 * Remove someone from a story.
 *
 * Two shapes, one endpoint:
 *  - the owner removing their partner
 *  - a member removing themselves (leaving)
 *
 * The owner cannot leave their own story. Ownership would be left dangling,
 * and the destructive-but-clear alternative already exists: delete the story.
 * Their content stays either way - rows belong to the story, not the member.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const actorId = await requireUser();
    const storyId = Number(params.id);
    const targetId = Number(params.userId);

    if (
      !Number.isInteger(storyId) ||
      storyId <= 0 ||
      !Number.isInteger(targetId) ||
      targetId <= 0
    ) {
      return NextResponse.json({ error: 'Unknown member' }, { status: 400 });
    }

    const actorIsOwner = await isOwner(actorId, storyId);
    const removingSelf = actorId === targetId;

    if (!actorIsOwner && !removingSelf) {
      return NextResponse.json(
        { error: 'Only the story owner can remove someone else' },
        { status: 403 }
      );
    }

    if (await isOwner(targetId, storyId)) {
      return NextResponse.json(
        {
          error: removingSelf
            ? 'You own this story, so you cannot leave it. Delete it instead.'
            : 'The story owner cannot be removed',
        },
        { status: 400 }
      );
    }

    const [result] = await pool.execute<any>(
      'DELETE FROM story_members WHERE story_id = ? AND user_id = ?',
      [storyId, targetId]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: 'That person is not in this story' },
        { status: 404 }
      );
    }

    // Someone who just left should not keep the story active.
    if (removingSelf) {
      const cookieStore = await cookies();
      if (cookieStore.get(ACTIVE_STORY_COOKIE)?.value === String(storyId)) {
        cookieStore.delete(ACTIVE_STORY_COOKIE);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
