import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
import { encrypt, decrypt } from '@/lib/encryption';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface LetterRow extends RowDataPacket {
  id: number;
  from_user_id: number;
  to_user_id: number;
  sender_name: string;
  receiver_name: string;
  subject: string;
  encrypted_content: string;
  created_at: string;
  is_read: boolean;
}

// Get all love letters for current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    
    const [rows] = await pool.execute<LetterRow[]>(
      `SELECT l.*, 
              sender.display_name as sender_name,
              receiver.display_name as receiver_name
       FROM love_letters l
       JOIN users sender ON l.from_user_id = sender.id
       JOIN users receiver ON l.to_user_id = receiver.id
       WHERE l.from_user_id = ? OR l.to_user_id = ?
       ORDER BY l.created_at DESC`,
      [session.userId, session.userId]
    );

    const decryptedLetters = rows.map(letter => ({
      id: letter.id,
      fromUserId: letter.from_user_id,
      toUserId: letter.to_user_id,
      senderName: letter.sender_name,
      receiverName: letter.receiver_name,
      subject: letter.subject,
      content: decrypt(letter.encrypted_content),
      createdAt: letter.created_at,
      isRead: letter.is_read,
      isSent: letter.from_user_id === session.userId
    }));

    return NextResponse.json({ letters: decryptedLetters });
  } catch (error) {
    console.error('Error fetching letters:', error);
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 });
  }
}

// Create new love letter
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { toUserId, subject, content } = await request.json();

    if (!toUserId || !subject || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // to_user_id has a foreign key to users(id); an id that does not exist
    // used to surface as an opaque 500. Check first and say what is wrong.
    const [recipient] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM users WHERE id = ?',
      [toUserId]
    );
    if (recipient.length === 0) {
      return NextResponse.json(
        { error: 'That recipient does not exist' },
        { status: 400 }
      );
    }

    const encryptedContent = encrypt(content);

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO love_letters (from_user_id, to_user_id, subject, encrypted_content)
       VALUES (?, ?, ?, ?)`,
      [session.userId, toUserId, subject, encryptedContent]
    );

    return NextResponse.json({ 
      success: true,
      letterId: result.insertId
    });
  } catch (error) {
    console.error('Error creating letter:', error);
    return NextResponse.json({ error: 'Failed to create letter' }, { status: 500 });
  }
}
