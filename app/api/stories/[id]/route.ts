import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
import {
  ACTIVE_STORY_COOKIE,
  isMember,
  membersOf,
  requireOwner,
  requireUser,
  StoryAccessError,
} from '@/lib/story';

function parseId(raw: string) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Story detail plus its members (any member). */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUser();
    const storyId = parseId(params.id);
    if (!storyId) {
      return NextResponse.json({ error: 'Unknown story' }, { status: 400 });
    }
    if (!(await isMember(userId, storyId))) {
      return NextResponse.json(
        { error: 'You are not a member of that story' },
        { status: 403 }
      );
    }

    const [rows] = await pool.execute<any[]>(
      'SELECT id, name, created_by FROM stories WHERE id = ?',
      [storyId]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Unknown story' }, { status: 404 });
    }

    return NextResponse.json({
      story: {
        id: rows[0].id,
        name: rows[0].name,
        isOwner: rows[0].created_by === userId,
        members: await membersOf(storyId),
      },
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error loading story:', error);
    return NextResponse.json(
      { error: 'Failed to load story' },
      { status: 500 }
    );
  }
}

/** Rename (owner only). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUser();
    const storyId = parseId(params.id);
    if (!storyId) {
      return NextResponse.json({ error: 'Unknown story' }, { status: 400 });
    }
    await requireOwner(userId, storyId);

    const { name } = await request.json();
    const trimmed = typeof name === 'string' ? name.trim() : '';
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Give your story a name' },
        { status: 400 }
      );
    }
    if (trimmed.length > 120) {
      return NextResponse.json(
        { error: 'That name is too long (120 characters max)' },
        { status: 400 }
      );
    }

    await pool.execute('UPDATE stories SET name = ? WHERE id = ?', [
      trimmed,
      storyId,
    ]);

    return NextResponse.json({ story: { id: storyId, name: trimmed } });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error renaming story:', error);
    return NextResponse.json(
      { error: 'Failed to rename story' },
      { status: 500 }
    );
  }
}

/**
 * Delete a story and everything in it (owner only).
 *
 * Every feature table cascades from stories, so this removes the content too -
 * which is why the UI puts it behind a confirmation.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUser();
    const storyId = parseId(params.id);
    if (!storyId) {
      return NextResponse.json({ error: 'Unknown story' }, { status: 400 });
    }
    await requireOwner(userId, storyId);

    await pool.execute('DELETE FROM stories WHERE id = ?', [storyId]);

    // Do not leave the cookie pointing at a story that no longer exists.
    const cookieStore = await cookies();
    if (cookieStore.get(ACTIVE_STORY_COOKIE)?.value === String(storyId)) {
      cookieStore.delete(ACTIVE_STORY_COOKIE);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting story:', error);
    return NextResponse.json(
      { error: 'Failed to delete story' },
      { status: 500 }
    );
  }
}
