import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import {
  ACTIVE_STORY_COOKIE,
  MAX_STORY_MEMBERS,
  isMember,
  requireUser,
  StoryAccessError,
} from '@/lib/story';

interface InviteRow extends RowDataPacket {
  id: number;
  story_id: number;
  created_by: number;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  story_name: string;
}

/**
 * Join a story with an invite code.
 *
 * The whole thing runs in a transaction with the invite row locked FOR
 * UPDATE: codes are single-use, and two people redeeming the same link at the
 * same moment must not both get in past MAX_STORY_MEMBERS.
 */
export async function POST(
  _request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const userId = await requireUser();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.execute<InviteRow[]>(
        `SELECT i.id, i.story_id, i.created_by, i.expires_at, i.accepted_at,
                i.revoked_at, s.name AS story_name
           FROM story_invites i
           JOIN stories s ON s.id = i.story_id
          WHERE i.code = ?
          FOR UPDATE`,
        [params.code]
      );
      const invite = rows[0];

      if (!invite) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'This invite link is not valid' },
          { status: 404 }
        );
      }
      if (invite.revoked_at) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'This invite has been revoked' },
          { status: 410 }
        );
      }
      if (invite.accepted_at) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'This invite has already been used' },
          { status: 409 }
        );
      }
      if (new Date(invite.expires_at).getTime() < Date.now()) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'This invite has expired' },
          { status: 410 }
        );
      }

      // Already in: not an error, just send them to the story.
      if (await isMember(userId, invite.story_id)) {
        await connection.rollback();
        return NextResponse.json({
          success: true,
          alreadyMember: true,
          storyId: invite.story_id,
          storyName: invite.story_name,
        });
      }

      const [countRows] = await connection.execute<RowDataPacket[]>(
        'SELECT COUNT(*) AS n FROM story_members WHERE story_id = ? FOR UPDATE',
        [invite.story_id]
      );
      if (Number(countRows[0]?.n ?? 0) >= MAX_STORY_MEMBERS) {
        await connection.rollback();
        return NextResponse.json(
          { error: 'This story already has a partner' },
          { status: 409 }
        );
      }

      await connection.execute(
        "INSERT INTO story_members (story_id, user_id, role) VALUES (?, ?, 'member')",
        [invite.story_id, userId]
      );
      await connection.execute(
        'UPDATE story_invites SET accepted_by = ?, accepted_at = NOW() WHERE id = ?',
        [userId, invite.id]
      );

      await connection.commit();

      // Land them in the story they just joined.
      const cookieStore = await cookies();
      cookieStore.set(ACTIVE_STORY_COOKIE, String(invite.story_id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
      });

      return NextResponse.json({
        success: true,
        storyId: invite.story_id,
        storyName: invite.story_name,
      });
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error accepting invite:', error);
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
