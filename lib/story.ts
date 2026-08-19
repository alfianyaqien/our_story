import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';

/**
 * Story scoping.
 *
 * Six of the seven feature APIs previously ran bare SELECTs with no ownership
 * filter at all, so every signed-in user could read everyone else's content.
 * That happened because scoping was left to each route's discretion. This
 * module exists so it is not a per-route decision any more: a route either
 * calls `requireStoryMember` and gets a story id it is allowed to use, or it
 * has no story id to write and fails on a NOT NULL column.
 *
 * The active story travels in a cookie, but the cookie is only a hint. It is
 * re-checked against `story_members` on every request, so a tampered value
 * yields 403 rather than someone else's data.
 */

export const ACTIVE_STORY_COOKIE = 'active_story';

/**
 * How many people may belong to one story. The plan calls for couples today
 * with room to grow, so the limit lives here rather than in the schema -
 * raising it is a one-line change, no migration.
 */
export const MAX_STORY_MEMBERS = 2;

export interface StoryContext {
  userId: number;
  storyId: number;
}

/** Thrown for the auth/membership failures; carries the response to return. */
export class StoryAccessError extends Error {
  response: NextResponse;
  constructor(response: NextResponse, message: string) {
    super(message);
    this.name = 'StoryAccessError';
    this.response = response;
  }
}

interface SessionShape {
  userId?: number;
}

async function readSession(): Promise<SessionShape | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('session');
  if (!raw) return null;
  try {
    return JSON.parse(raw.value) as SessionShape;
  } catch {
    return null;
  }
}

/** The signed-in user id, or throw a 401 response. */
export async function requireUser(): Promise<number> {
  const session = await readSession();
  if (!session?.userId) {
    throw new StoryAccessError(
      NextResponse.json({ error: 'Not authenticated' }, { status: 401 }),
      'not authenticated'
    );
  }
  return session.userId;
}

/** Is this user a member of this story? */
export async function isMember(
  userId: number,
  storyId: number
): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM story_members WHERE story_id = ? AND user_id = ? LIMIT 1',
    [storyId, userId]
  );
  return rows.length > 0;
}

/** Stories this user belongs to, most recently joined first. */
export async function storiesForUser(userId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT s.id, s.name, s.created_by, sm.role, s.created_at,
            (SELECT COUNT(*) FROM story_members m WHERE m.story_id = s.id) AS member_count
       FROM story_members sm
       JOIN stories s ON s.id = sm.story_id
      WHERE sm.user_id = ?
      ORDER BY sm.joined_at DESC, s.id DESC`,
    [userId]
  );
  return rows.map((r) => ({
    id: r.id as number,
    name: r.name as string,
    role: r.role as 'owner' | 'member',
    memberCount: Number(r.member_count),
    isOwner: r.created_by === userId,
  }));
}

/**
 * Resolve the story this request should act on.
 *
 * Prefers the active-story cookie, but only after confirming membership. If
 * the cookie is missing, stale, or names a story the user was removed from,
 * it falls back to any story they do belong to - so a user is never stuck
 * because of a bad cookie.
 *
 * Throws 401 when signed out, and 403 when the user belongs to no story at
 * all (the client routes that to the create-your-first-story screen).
 */
export async function requireStoryMember(): Promise<StoryContext> {
  const userId = await requireUser();

  const cookieStore = await cookies();
  const raw = cookieStore.get(ACTIVE_STORY_COOKIE)?.value;
  const requested = raw ? Number(raw) : NaN;

  if (Number.isInteger(requested) && requested > 0) {
    if (await isMember(userId, requested)) {
      return { userId, storyId: requested };
    }
    // Cookie names a story this user cannot use. Fall through to their own
    // stories rather than trusting it.
  }

  const own = await storiesForUser(userId);
  if (own.length === 0) {
    throw new StoryAccessError(
      NextResponse.json(
        { error: 'No story selected', code: 'NO_STORY' },
        { status: 403 }
      ),
      'user belongs to no story'
    );
  }

  return { userId, storyId: own[0].id };
}

/**
 * Wrap a route body so StoryAccessError becomes its response instead of an
 * unhandled 500.
 */
export async function withStory<T>(
  handler: (ctx: StoryContext) => Promise<T>
): Promise<T | NextResponse> {
  try {
    const ctx = await requireStoryMember();
    return await handler(ctx);
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    throw error;
  }
}

/** How long an invite stays valid. */
export const INVITE_TTL_DAYS = 7;

/**
 * Invite code. This is a capability - anyone holding it can join the story -
 * so it must be unguessable rather than sequential. base64url of 24 random
 * bytes gives 192 bits.
 */
export function generateInviteCode(): string {
  return randomBytes(24).toString('base64url');
}

/** Is this user the owner of this story? */
export async function isOwner(
  userId: number,
  storyId: number
): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT 1 FROM story_members WHERE story_id = ? AND user_id = ? AND role = 'owner' LIMIT 1",
    [storyId, userId]
  );
  return rows.length > 0;
}

/** Throw a 403 unless the user owns the story. */
export async function requireOwner(
  userId: number,
  storyId: number
): Promise<void> {
  if (!(await isOwner(userId, storyId))) {
    throw new StoryAccessError(
      NextResponse.json(
        { error: 'Only the story owner can do that' },
        { status: 403 }
      ),
      'not owner'
    );
  }
}

/** Current member count for a story. */
export async function memberCount(storyId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) AS n FROM story_members WHERE story_id = ?',
    [storyId]
  );
  return Number(rows[0]?.n ?? 0);
}

/** Members of a story, owner first. */
export async function membersOf(storyId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT u.id, u.username, u.display_name, sm.role, sm.joined_at
       FROM story_members sm
       JOIN users u ON u.id = sm.user_id
      WHERE sm.story_id = ?
      ORDER BY sm.role = 'owner' DESC, sm.joined_at ASC`,
    [storyId]
  );
  return rows.map((r) => ({
    id: r.id as number,
    username: r.username as string,
    displayName: r.display_name as string,
    role: r.role as 'owner' | 'member',
    joinedAt: r.joined_at as string,
  }));
}
