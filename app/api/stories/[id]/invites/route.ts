import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import {
  INVITE_TTL_DAYS,
  MAX_STORY_MEMBERS,
  generateInviteCode,
  memberCount,
  requireOwner,
  requireUser,
  StoryAccessError,
} from '@/lib/story';

/** Outstanding invites for a story (owner only). */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUser();
    const storyId = Number(params.id);
    if (!Number.isInteger(storyId) || storyId <= 0) {
      return NextResponse.json({ error: 'Unknown story' }, { status: 400 });
    }
    await requireOwner(userId, storyId);

    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT code, expires_at, accepted_at, revoked_at, created_at
         FROM story_invites
        WHERE story_id = ?
          AND accepted_at IS NULL
          AND revoked_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC`,
      [storyId]
    );

    return NextResponse.json({
      invites: rows.map((r) => ({
        code: r.code,
        expiresAt: r.expires_at,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error listing invites:', error);
    return NextResponse.json(
      { error: 'Failed to load invites' },
      { status: 500 }
    );
  }
}

/**
 * Mint an invite code for a story.
 *
 * Refuses when the story is already full - handing out a code that cannot be
 * redeemed is worse than saying so up front.
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
    await requireOwner(userId, storyId);

    if ((await memberCount(storyId)) >= MAX_STORY_MEMBERS) {
      return NextResponse.json(
        { error: 'This story already has a partner' },
        { status: 409 }
      );
    }

    const code = generateInviteCode();

    await pool.execute(
      `INSERT INTO story_invites (story_id, code, created_by, expires_at)
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY))`,
      [storyId, code, userId, INVITE_TTL_DAYS]
    );

    return NextResponse.json({ invite: { code } }, { status: 201 });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating invite:', error);
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}
