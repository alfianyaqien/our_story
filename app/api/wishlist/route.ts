import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
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
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [rows] = await pool.execute<WishlistRow[]>(
      `SELECT w.*, u.display_name as user_name
       FROM wishlist w
       JOIN users u ON w.user_id = u.id
       ORDER BY w.priority DESC, w.created_at DESC`
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
    console.error('Error fetching wishlist:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { title, description, category, priority, price, link, status } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO wishlist (user_id, title, description, category, priority, price, link, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.userId, title, description || '', category || '', priority || 'medium', price || null, link || '', status || 'wished']
    );

    return NextResponse.json({ 
      success: true,
      itemId: result.insertId
    });
  } catch (error) {
    console.error('Error creating wishlist item:', error);
    return NextResponse.json({ error: 'Failed to create wishlist item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, title, description, category, priority, price, link, status } = await request.json();

    if (!id || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE wishlist
       SET title = ?, description = ?, category = ?, priority = ?, price = ?, link = ?, status = ?
       WHERE id = ?`,
      [title, description || '', category || '', priority || 'medium', price || null, link || '', status || 'wished', id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    return NextResponse.json({ error: 'Failed to update wishlist item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM wishlist WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting wishlist item:', error);
    return NextResponse.json({ error: 'Failed to delete wishlist item' }, { status: 500 });
  }
}
