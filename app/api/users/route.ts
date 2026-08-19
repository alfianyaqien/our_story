import { NextResponse } from 'next/server';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import { requireStoryMember, StoryAccessError } from '@/lib/story';

interface UserOptionRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
}

/**
 * Recipients the signed-in user can address: the other members of the active
 * story.
 *
 * This originally listed every active account in the system, which was
 * tolerable while the app was a single couple but leaks the user list once
 * stories exist. Scoping it to story membership is both the privacy fix and
 * the correct recipient list for a love letter.
 *
 * Deliberately narrow: id, username and display name only. Never the password
 * hash, email, or any verification/reset token - getAllUsers() in lib/auth.ts
 * selects * and returns the hash, so it is not used here.
 */
export async function GET() {
  try {
    const { userId, storyId } = await requireStoryMember();

    const [rows] = await pool.execute<UserOptionRow[]>(
      `SELECT u.id, u.username, u.display_name
         FROM story_members sm
         JOIN users u ON u.id = sm.user_id
        WHERE sm.story_id = ?
          AND u.id <> ?
          AND u.account_status = 'active'
        ORDER BY u.display_name`,
      [storyId, userId]
    );

    return NextResponse.json({
      users: rows.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
      })),
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
