import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PhotoRow extends RowDataPacket {
  id: number;
  user_id: number;
  title: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  album: string;
  uploaded_at: string;
  created_at: string;
}

// GET - Fetch all photos
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const album = searchParams.get('album');

    let query = 'SELECT * FROM photos ORDER BY uploaded_at DESC';
    let params: any[] = [];

    if (album && album !== 'all') {
      query = 'SELECT * FROM photos WHERE album = ? ORDER BY uploaded_at DESC';
      params = [album];
    }

    const [rows] = await pool.execute<PhotoRow[]>(query, params);

    const photos = rows.map(photo => ({
      id: photo.id,
      userId: photo.user_id,
      title: photo.title,
      description: photo.description,
      fileName: photo.file_name,
      filePath: photo.file_path,
      fileSize: photo.file_size,
      mimeType: photo.mime_type,
      width: photo.width,
      height: photo.height,
      album: photo.album,
      uploadedAt: photo.uploaded_at,
      createdAt: photo.created_at
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// DELETE - Delete a photo
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Get photo details before deleting
    const [rows] = await pool.execute<PhotoRow[]>(
      'SELECT * FROM photos WHERE id = ?',
      [photoId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = rows[0];

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), 'public', 'uploads', 'photos', photo.file_name);
      await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Delete from database
    await pool.execute<ResultSetHeader>(
      'DELETE FROM photos WHERE id = ?',
      [photoId]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}

// PUT - Update photo metadata
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, title, description, album } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    await pool.execute<ResultSetHeader>(
      'UPDATE photos SET title = ?, description = ?, album = ? WHERE id = ?',
      [title || null, description || null, album || 'general', id]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Photo updated successfully' 
    });
  } catch (error) {
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }
}
