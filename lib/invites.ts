import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';

export interface InviteRow extends RowDataPacket {
  id: number;
  story_id: number;
  created_by: number;
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  story_name: string;
  inviter_name: string;
  member_count: number;
}

/**
 * Look an invite up by code, with the story and inviter joined in.
 *
 * Lives here rather than in the route: Next only allows route handlers to be
 * exported from a route.ts, and re-exporting a helper from one fails the
 * build with "Property 'loadInvite' is incompatible with index signature".
 */
export async function loadInvite(code: string): Promise<InviteRow | null> {
  const [rows] = await pool.execute<InviteRow[]>(
    `SELECT i.id, i.story_id, i.created_by, i.expires_at, i.accepted_at,
            i.revoked_at,
            s.name AS story_name,
            u.display_name AS inviter_name,
            (SELECT COUNT(*) FROM story_members m WHERE m.story_id = i.story_id) AS member_count
       FROM story_invites i
       JOIN stories s ON s.id = i.story_id
       JOIN users u ON u.id = i.created_by
      WHERE i.code = ?`,
    [code]
  );
  return rows[0] ?? null;
}
