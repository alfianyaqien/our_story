import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import {
  bucketDir,
  mediaUrl,
  resolveStoredFile,
  validateUpload,
} from '@/lib/uploads';
import { writeFile } from 'fs/promises';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import * as fs from 'fs';
import * as path from 'path';

interface CulinaryPhotoRow extends RowDataPacket {
  id: number;
  culinary_id: number;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  photo_order: number;
  uploaded_at: string;
  created_at: string;
}

// GET - Fetch photos for a culinary plan
export async function GET(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const culinaryId = searchParams.get('culinaryId');

    if (!culinaryId) {
      return NextResponse.json({ error: 'Culinary ID is required' }, { status: 400 });
    }

    const [rows] = await pool.execute<CulinaryPhotoRow[]>(
      `SELECT cp.* FROM culinary_photos cp
         JOIN recipes r ON r.id = cp.culinary_id
        WHERE cp.culinary_id = ? AND r.story_id = ?
        ORDER BY cp.photo_order ASC`,
      [culinaryId, storyId]
    );

    const photos = rows.map(row => ({
      id: row.id,
      culinaryId: row.culinary_id,
      fileName: row.file_name,
      filePath: row.file_path,
      fileSize: row.file_size,
      mimeType: row.mime_type,
      photoOrder: row.photo_order,
      uploadedAt: row.uploaded_at,
      createdAt: row.created_at
    }));

    return NextResponse.json({ photos });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching culinary photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST - Upload photos for a culinary plan
export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const formData = await request.formData();
    const culinaryId = formData.get('culinaryId') as string;
    const photoOrder = parseInt(formData.get('photoOrder') as string) || 1;
    const file = formData.get('file') as File;

    if (!culinaryId || !file) {
      return NextResponse.json({ error: 'Culinary ID and file are required' }, { status: 400 });
    }

    // Validate photo order (1-3)
    if (photoOrder < 1 || photoOrder > 3) {
      return NextResponse.json({ error: 'Photo order must be between 1 and 3' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size exceeds 10MB limit' 
      }, { status: 400 });
    }

    // Check if culinary plan has status 'visited' and get place name
    const [culinaryRows] = await pool.execute<RowDataPacket[]>(
      'SELECT status, place_name FROM recipes WHERE id = ? AND story_id = ?',
      [culinaryId, storyId]
    );

    if (culinaryRows.length === 0) {
      return NextResponse.json({ error: 'Culinary plan not found' }, { status: 404 });
    }

    if (culinaryRows[0].status !== 'visited') {
      return NextResponse.json({ 
        error: 'Can only upload photos for visited places' 
      }, { status: 400 });
    }

    const placeName = culinaryRows[0].place_name;

    // Check existing photo count
    const [countRows] = await pool.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS count
         FROM culinary_photos cp
         JOIN recipes r ON r.id = cp.culinary_id
        WHERE cp.culinary_id = ? AND r.story_id = ?`,
      [culinaryId, storyId]
    );

    if (countRows[0].count >= 3) {
      return NextResponse.json({ 
        error: 'Maximum 3 photos per culinary plan' 
      }, { status: 400 });
    }

    // Validated and named by lib/uploads.ts: the extension comes from sniffed
    // magic bytes, not from `file.name`.
    const checked = await validateUpload(file, `culinary-${culinaryId}-`);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const { buffer, fileName, mimeType, size } = checked.value;

    const uploadDir = await bucketDir('culinary');
    await writeFile(path.join(uploadDir, fileName), buffer);

    // Delete existing photo with same order if exists
    const [existingPhotos] = await pool.execute<CulinaryPhotoRow[]>(
      `SELECT cp.* FROM culinary_photos cp
         JOIN recipes r ON r.id = cp.culinary_id
        WHERE cp.culinary_id = ? AND cp.photo_order = ? AND r.story_id = ?`,
      [culinaryId, photoOrder, storyId]
    );

    if (existingPhotos.length > 0) {
      // Delete old file
      const oldFilePath = resolveStoredFile('culinary', existingPhotos[0].file_name);
      if (oldFilePath && fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Delete from culinary_photos database
      await pool.execute(
        `DELETE cp FROM culinary_photos cp
           JOIN recipes r ON r.id = cp.culinary_id
          WHERE cp.culinary_id = ? AND cp.photo_order = ? AND r.story_id = ?`,
        [culinaryId, photoOrder, storyId]
      );
      
      // Delete from photos (gallery) database if exists
      await pool.execute(
        'DELETE FROM photos WHERE file_name = ? AND story_id = ?',
        [existingPhotos[0].file_name, storyId]
      );
    }

    // Save to culinary_photos table
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO culinary_photos (culinary_id, file_name, file_path, file_size, mime_type, photo_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        culinaryId,
        fileName,
        mediaUrl('culinary', fileName),
        size,
        mimeType,
        photoOrder
      ]
    );

    // Also save to photos (gallery) table with 'culinary' album
    await pool.execute(
      `INSERT INTO photos (story_id, user_id, title, description, file_name, file_path, file_size, mime_type, width, height, album)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        storyId,
        userId,
        `${placeName} - Photo ${photoOrder}`,
        `Photo from culinary visit to ${placeName}`,
        fileName,
        mediaUrl('culinary', fileName),
        size,
        mimeType,
        null,
        null,
        'culinary'
      ]
    );

    return NextResponse.json({
      success: true,
      photo: {
        id: result.insertId,
        culinaryId: parseInt(culinaryId),
        fileName,
        filePath: mediaUrl('culinary', fileName),
        fileSize: file.size,
        mimeType: file.type,
        photoOrder,
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

// DELETE - Delete a photo
export async function DELETE(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const photoId = searchParams.get('id');

    if (!photoId) {
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    // Get photo details
    const [photos] = await pool.execute<CulinaryPhotoRow[]>(
      `SELECT cp.* FROM culinary_photos cp
         JOIN recipes r ON r.id = cp.culinary_id
        WHERE cp.id = ? AND r.story_id = ?`,
      [photoId, storyId]
    );

    if (photos.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photos[0];

    // Delete file from disk
    const filePath = resolveStoredFile('culinary', photo.file_name);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from culinary_photos database
    await pool.execute(
      `DELETE cp FROM culinary_photos cp
         JOIN recipes r ON r.id = cp.culinary_id
        WHERE cp.id = ? AND r.story_id = ?`,
      [photoId, storyId]
    );

    // Also delete from photos (gallery) database
    await pool.execute(
      'DELETE FROM photos WHERE file_name = ? AND story_id = ?',
      [photo.file_name, storyId]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete photo' 
    }, { status: 500 });
  }
}
