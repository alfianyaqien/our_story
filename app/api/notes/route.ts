import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface NoteRow extends RowDataPacket {
  id: number;
  title: string;
  content: string;
  created_by: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

// Get all notes
export async function GET() {
  try {
    const { userId, storyId } = await requireStoryMember();

    const [rows] = await pool.execute<NoteRow[]>(
      `SELECT n.*, u.display_name as creator_name
       FROM notes n
       JOIN users u ON n.created_by = u.id
       WHERE n.story_id = ?
       ORDER BY n.updated_at DESC`,
      [storyId]
    );

    const formattedNotes = rows.map(note => ({
      id: note.id,
      title: note.title,
      content: note.content,
      createdBy: note.created_by,
      creatorName: note.creator_name,
      createdAt: note.created_at,
      updatedAt: note.updated_at
    }));

    return NextResponse.json({ notes: formattedNotes });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// Create new note
export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { title, content } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO notes (story_id, title, content, created_by)
       VALUES (?, ?, ?, ?)`,
      [storyId, title, content, userId]
    );

    return NextResponse.json({ 
      success: true,
      noteId: result.insertId
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}

// Update note
export async function PUT(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { id, title, content } = await request.json();

    if (!id || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE notes
       SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND story_id = ?`,
      [title, content, id, storyId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// Delete note
export async function DELETE(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM notes WHERE id = ? AND story_id = ?', [id, storyId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
