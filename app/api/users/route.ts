import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';

interface UserOptionRow extends RowDataPacket {
  id: number;
  username: string;
  display_name: string;
}

/**
 * Recipients the signed-in user can address.
 *
 * The love-letter compose form used to hardcode `<option value="1">Partner 1`
 * / `value="2">Partner 2`, which only worked if the two accounts happened to
 * be rows 1 and 2. On any other database `to_user_id` violated its foreign key
 * to users(id) and every send failed.
 *
 * Deliberately narrow: id, username and display name only. Never the password
 * hash, email, or any verification/reset token - getAllUsers() in lib/auth.ts
 * selects * and returns the hash, so it is not used here.
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);

    const [rows] = await pool.execute<UserOptionRow[]>(
      `SELECT id, username, display_name
         FROM users
        WHERE id <> ? AND account_status = 'active'
        ORDER BY display_name`,
      [session.userId]
    );

    return NextResponse.json({
      users: rows.map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.display_name,
      })),
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
