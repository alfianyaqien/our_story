import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { bucketDir, mediaUrl, validateUpload } from '@/lib/uploads';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';
    const albumId = formData.get('albumId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Type, size, magic bytes and the stored name are all decided by
    // lib/uploads.ts - never by the client's filename or Content-Type.
    const checked = await validateUpload(file);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const { buffer, fileName, mimeType, size } = checked.value;

    // Outside public/, so nothing is statically served; reads go through
    // /api/media, which checks story membership first.
    const uploadDir = await bucketDir('photos');
    await writeFile(path.join(uploadDir, fileName), buffer);

    // Get image dimensions (simple approach - can be enhanced)
    // For now, we'll store null and can add sharp library later for proper image processing
    const width = null;
    const height = null;

    // Album resolution, story-scoped throughout.
    //
    // Both halves of this were wrong before: the General lookup had no
    // story filter and took whichever General album came first in the whole
    // table, and a client-supplied albumId was trusted outright. Together
    // that filed photos into another story's album.
    let finalAlbumId: number | null = null;

    if (albumId) {
      const requested = parseInt(albumId);
      if (Number.isInteger(requested)) {
        const [owned] = await pool.execute<any[]>(
          'SELECT id FROM albums WHERE id = ? AND story_id = ? LIMIT 1',
          [requested, storyId]
        );
        if (owned.length === 0) {
          return NextResponse.json(
            { error: 'That album does not exist' },
            { status: 400 }
          );
        }
        finalAlbumId = requested;
      }
    }

    if (!finalAlbumId) {
      const [generalAlbum] = await pool.execute<any[]>(
        'SELECT id FROM albums WHERE name = ? AND story_id = ? LIMIT 1',
        ['General', storyId]
      );
      if (generalAlbum.length > 0) {
        finalAlbumId = generalAlbum[0].id;
      }
    }

    // Store metadata in database
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO photos (story_id, user_id, title, description, file_name, file_path, file_size, mime_type, width, height, album_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        storyId,
        userId,
        title,
        description,
        fileName,
        mediaUrl('photos', fileName),
        size,
        mimeType,
        width,
        height,
        finalAlbumId
      ]
    );

    // Update album photo count
    if (finalAlbumId) {
      await pool.execute(
        'UPDATE albums SET photo_count = (SELECT COUNT(*) FROM photos WHERE album_id = ?) WHERE id = ? AND story_id = ?',
        [finalAlbumId, finalAlbumId, storyId]
      );
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: result.insertId,
        userId,
        fileName,
        filePath: mediaUrl('photos', fileName),
        title,
        description,
        albumId: finalAlbumId,
        fileSize: file.size,
        mimeType: file.type,
        width,
        height,
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload photo' 
    }, { status: 500 });
  }
}
