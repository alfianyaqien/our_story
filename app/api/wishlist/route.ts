import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface WishlistRow extends RowDataPacket {
  id: number;
  user_id: number;
  user_name: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  price: number | null;
  link: string;
  status: string;
  created_at: string;
}

export async function GET() {
  try {
    const { userId, storyId } = await requireStoryMember();

    const [rows] = await pool.execute<WishlistRow[]>(
      `SELECT w.*, u.display_name as user_name
       FROM wishlist w
       JOIN users u ON w.user_id = u.id
       WHERE w.story_id = ?
       ORDER BY w.priority DESC, w.created_at DESC`,
      [storyId]
    );

    const formattedItems = rows.map(item => ({
      id: item.id,
      userId: item.user_id,
      userName: item.user_name,
      title: item.title,
      description: item.description,
      category: item.category,
      priority: item.priority,
      price: item.price,
      link: item.link,
      status: item.status,
      createdAt: item.created_at
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { title, description, category, priority, price, link, status } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO wishlist (story_id, user_id, title, description, category, priority, price, link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [storyId, userId, title, description || '', category || '', priority || 'medium', price || null, link || '', status || 'wished']
    );

    return NextResponse.json({ 
      success: true,
      itemId: result.insertId
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating wishlist item:', error);
    return NextResponse.json({ error: 'Failed to create wishlist item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { id, title, description, category, priority, price, link, status } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE wishlist
       SET title = ?, description = ?, category = ?, priority = ?, price = ?, link = ?, status = ?
       WHERE id = ? AND story_id = ?`,
      [title, description || '', category || '', priority || 'medium', price || null, link || '', status || 'wished', id, storyId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error updating wishlist item:', error);
    return NextResponse.json({ error: 'Failed to update wishlist item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM wishlist WHERE id = ? AND story_id = ?', [id, storyId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json({ error: 'Failed to delete wishlist item' }, { status: 500 });
  }
}
