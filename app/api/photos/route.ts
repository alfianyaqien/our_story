import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { resolveStoredFile } from '@/lib/uploads';
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
  album_id: number | null;
  album_name?: string;
  uploaded_at: string;
  created_at: string;
}

// GET - Fetch all photos
export async function GET(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get('albumId');

    let query = `
      SELECT 
        p.*,
        a.name as album_name
      FROM photos p
      LEFT JOIN albums a ON p.album_id = a.id
      WHERE p.story_id = ?
      ORDER BY p.uploaded_at DESC
    `;
    let params: any[] = [storyId];

    if (albumId && albumId !== 'all') {
      query = `
        SELECT 
          p.*,
          a.name as album_name
        FROM photos p
        LEFT JOIN albums a ON p.album_id = a.id
        WHERE p.story_id = ? AND p.album_id = ?
        ORDER BY p.uploaded_at DESC
      `;
      params = [storyId, albumId];
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
      album: photo.album_name || 'General',
      albumId: photo.album_id,
      uploadedAt: photo.uploaded_at,
      createdAt: photo.created_at
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// DELETE - Delete a photo
export async function DELETE(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Get photo details before deleting
    const [rows] = await pool.execute<PhotoRow[]>(
      'SELECT * FROM photos WHERE id = ? AND story_id = ?',
      [photoId, storyId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = rows[0];

    // Delete file from disk
    try {
      const filePath = resolveStoredFile('photos', photo.file_name);
      if (filePath) await unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue even if file deletion fails
    }

    // Delete from database
    await pool.execute<ResultSetHeader>(
      'DELETE FROM photos WHERE id = ? AND story_id = ?',
      [photoId, storyId]
    );

    // Update album photo count
    if (photo.album_id) {
      await pool.execute(
        'UPDATE albums SET photo_count = (SELECT COUNT(*) FROM photos WHERE album_id = ?) WHERE id = ? AND story_id = ?',
        [photo.album_id, photo.album_id, storyId]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting photo:', error);
    return NextResponse.json({ error: 'Failed to delete photo' }, { status: 500 });
  }
}

// PUT - Update photo metadata
export async function PUT(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { id, title, description, albumId } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Photo ID required' }, { status: 400 });
    }

    // Get current album_id before update
    const [currentPhoto] = await pool.execute<PhotoRow[]>(
      'SELECT album_id FROM photos WHERE id = ? AND story_id = ?',
      [id, storyId]
    );

    if (currentPhoto.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const oldAlbumId = currentPhoto[0].album_id;

    await pool.execute<ResultSetHeader>(
      'UPDATE photos SET title = ?, description = ?, album_id = ? WHERE id = ? AND story_id = ?',
      [title || null, description || null, albumId || null, id, storyId]
    );

    // Update photo counts for both old and new albums
    if (oldAlbumId) {
      await pool.execute(
        'UPDATE albums SET photo_count = (SELECT COUNT(*) FROM photos WHERE album_id = ?) WHERE id = ? AND story_id = ?',
        [oldAlbumId, oldAlbumId, storyId]
      );
    }

    if (albumId && albumId !== oldAlbumId) {
      await pool.execute(
        'UPDATE albums SET photo_count = (SELECT COUNT(*) FROM photos WHERE album_id = ?) WHERE id = ? AND story_id = ?',
        [albumId, albumId, storyId]
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Photo updated successfully' 
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error updating photo:', error);
    return NextResponse.json({ error: 'Failed to update photo' }, { status: 500 });
  }
}
