import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { ResultSetHeader } from 'mysql2';
import {
  requireUser,
  storiesForUser,
  StoryAccessError,
} from '@/lib/story';

/** Stories the signed-in user belongs to. */
export async function GET() {
  try {
    const userId = await requireUser();
    return NextResponse.json({ stories: await storiesForUser(userId) });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error listing stories:', error);
    return NextResponse.json(
      { error: 'Failed to load stories' },
      { status: 500 }
    );
  }
}

/** Create a story. The creator becomes its owner. */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser();
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

    // Creating the story and its owner row must not half-succeed, or the
    // creator would own a story they are not a member of.
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.execute<ResultSetHeader>(
        'INSERT INTO stories (name, created_by) VALUES (?, ?)',
        [trimmed, userId]
      );
      const storyId = result.insertId;

      await connection.execute(
        "INSERT INTO story_members (story_id, user_id, role) VALUES (?, ?, 'owner')",
        [storyId, userId]
      );

      // Every story needs its own General album: photo uploads default into
      // it, and deleting an album re-homes its photos there. It used to be a
      // single global row, so without this a new story cannot upload or
      // delete albums.
      await connection.execute(
        'INSERT INTO albums (story_id, user_id, name, description) VALUES (?, ?, ?, ?)',
        [storyId, userId, 'General', 'Uncategorised photos']
      );

      await connection.commit();

      return NextResponse.json(
        { story: { id: storyId, name: trimmed, role: 'owner', memberCount: 1 } },
        { status: 201 }
      );
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating story:', error);
    return NextResponse.json(
      { error: 'Failed to create story' },
      { status: 500 }
    );
  }
}
