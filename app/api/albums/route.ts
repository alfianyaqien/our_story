import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface AlbumRow extends RowDataPacket {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  cover_photo_id: number | null;
  photo_count: number;
  created_at: string;
  updated_at: string;
  cover_photo_path?: string;
}

// GET - Fetch all albums
export async function GET(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const query = `
      SELECT 
        a.*,
        p.file_path as cover_photo_path
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.story_id = ?
      ORDER BY a.created_at DESC
    `;

    const [rows] = await pool.execute<AlbumRow[]>(query, [storyId]);

    const albums = rows.map(album => ({
      id: album.id,
      userId: album.user_id,
      name: album.name,
      description: album.description,
      coverPhotoId: album.cover_photo_id,
      coverPhotoPath: album.cover_photo_path,
      photoCount: album.photo_count,
      createdAt: album.created_at,
      updatedAt: album.updated_at,
    }));

    return NextResponse.json({ albums });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching albums:', error);
    return NextResponse.json({ error: 'Failed to fetch albums' }, { status: 500 });
  }
}

// POST - Create a new album
export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const body = await request.json();
    const { name, description } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Album name is required' }, { status: 400 });
    }

    // Check if album with same name already exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM albums WHERE name = ? AND story_id = ?',
      [name.trim(), storyId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Album with this name already exists' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO albums (story_id, user_id, name, description) VALUES (?, ?, ?, ?)',
      [storyId, userId, name.trim(), description || null]
    );

    const [newAlbum] = await pool.execute<AlbumRow[]>(
      'SELECT * FROM albums WHERE id = ? AND story_id = ?',
      [result.insertId, storyId]
    );

    return NextResponse.json({
      message: 'Album created successfully',
      album: {
        id: newAlbum[0].id,
        userId: newAlbum[0].user_id,
        name: newAlbum[0].name,
        description: newAlbum[0].description,
        coverPhotoId: newAlbum[0].cover_photo_id,
        photoCount: newAlbum[0].photo_count,
        createdAt: newAlbum[0].created_at,
        updatedAt: newAlbum[0].updated_at,
      }
    }, { status: 201 });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating album:', error);
    return NextResponse.json({ error: 'Failed to create album' }, { status: 500 });
  }
}

// PUT - Update an album
export async function PUT(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const body = await request.json();
    const { id, name, description, coverPhotoId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    // Check if album exists
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM albums WHERE id = ? AND story_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    // If name is being changed, check for duplicates
    if (name) {
      const [duplicate] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM albums WHERE name = ? AND id != ?',
        [name.trim(), id]
      );

      if (duplicate.length > 0) {
        return NextResponse.json({ error: 'Album with this name already exists' }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name.trim());
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description || null);
    }

    if (coverPhotoId !== undefined) {
      updates.push('cover_photo_id = ?');
      values.push(coverPhotoId || null);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id, storyId);

    await pool.execute(
      `UPDATE albums SET ${updates.join(', ')} WHERE id = ? AND story_id = ?`,
      values
    );

    const [updatedAlbum] = await pool.execute<AlbumRow[]>(
      `SELECT 
        a.*,
        p.file_path as cover_photo_path
      FROM albums a
      LEFT JOIN photos p ON a.cover_photo_id = p.id
      WHERE a.id = ? AND a.story_id = ?`,
      [id, storyId]
    );

    return NextResponse.json({
      message: 'Album updated successfully',
      album: {
        id: updatedAlbum[0].id,
        userId: updatedAlbum[0].user_id,
        name: updatedAlbum[0].name,
        description: updatedAlbum[0].description,
        coverPhotoId: updatedAlbum[0].cover_photo_id,
        coverPhotoPath: updatedAlbum[0].cover_photo_path,
        photoCount: updatedAlbum[0].photo_count,
        createdAt: updatedAlbum[0].created_at,
        updatedAt: updatedAlbum[0].updated_at,
      }
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error updating album:', error);
    return NextResponse.json({ error: 'Failed to update album' }, { status: 500 });
  }
}

// DELETE - Delete an album
export async function DELETE(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    // Prevent deleting the General album
    const [album] = await pool.execute<RowDataPacket[]>(
      'SELECT name FROM albums WHERE id = ? AND story_id = ?',
      [id, storyId]
    );

    if (album.length === 0) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 });
    }

    if (album[0].name === 'General') {
      return NextResponse.json({ error: 'Cannot delete the General album' }, { status: 400 });
    }

    // Get the General album ID
    const [generalAlbum] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM albums WHERE name = ? AND story_id = ? LIMIT 1',
      ['General', storyId]
    );

    if (generalAlbum.length === 0) {
      return NextResponse.json({ error: 'General album not found' }, { status: 500 });
    }

    const generalAlbumId = generalAlbum[0].id;

    // Move all photos from this album to General
    await pool.execute(
      'UPDATE photos SET album_id = ? WHERE album_id = ? AND story_id = ?',
      [generalAlbumId, id, storyId]
    );

    // Update photo counts
    await pool.execute(
      'UPDATE albums SET photo_count = (SELECT COUNT(*) FROM photos WHERE album_id = albums.id) WHERE id IN (?, ?) AND story_id = ?',
      [id, generalAlbumId, storyId]
    );

    // Delete the album
    await pool.execute('DELETE FROM albums WHERE id = ? AND story_id = ?', [id, storyId]);

    return NextResponse.json({ message: 'Album deleted successfully' });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting album:', error);
    return NextResponse.json({ error: 'Failed to delete album' }, { status: 500 });
  }
}
