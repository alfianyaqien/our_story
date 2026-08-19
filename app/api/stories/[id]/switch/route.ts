import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  ACTIVE_STORY_COOKIE,
  isMember,
  requireUser,
  StoryAccessError,
} from '@/lib/story';

/**
 * Make a story active for this browser.
 *
 * Membership is checked here as well as on every subsequent request - the
 * cookie is never the authority, so setting it is not a way to gain access.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUser();
    const storyId = Number(params.id);

    if (!Number.isInteger(storyId) || storyId <= 0) {
      return NextResponse.json({ error: 'Unknown story' }, { status: 400 });
    }

    if (!(await isMember(userId, storyId))) {
      return NextResponse.json(
        { error: 'You are not a member of that story' },
        { status: 403 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set(ACTIVE_STORY_COOKIE, String(storyId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // matches the session cookie
    });

    return NextResponse.json({ success: true, storyId });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error switching story:', error);
    return NextResponse.json(
      { error: 'Failed to switch story' },
      { status: 500 }
    );
  }
}
