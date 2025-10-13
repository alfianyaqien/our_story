import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
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
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const culinaryId = searchParams.get('culinaryId');

    if (!culinaryId) {
      return NextResponse.json({ error: 'Culinary ID is required' }, { status: 400 });
    }

    const [rows] = await pool.execute<CulinaryPhotoRow[]>(
      'SELECT * FROM culinary_photos WHERE culinary_id = ? ORDER BY photo_order ASC',
      [culinaryId]
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
    console.error('Error fetching culinary photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST - Upload photos for a culinary plan
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse session to get user ID
    const userId = parseInt(sessionCookie.value.split(':')[0]);

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
      'SELECT status, place_name FROM recipes WHERE id = ?',
      [culinaryId]
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
      'SELECT COUNT(*) as count FROM culinary_photos WHERE culinary_id = ?',
      [culinaryId]
    );

    if (countRows[0].count >= 3) {
      return NextResponse.json({ 
        error: 'Maximum 3 photos per culinary plan' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const fileName = `culinary-${culinaryId}-${timestamp}-${randomString}.${extension}`;

    // Save file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'culinary');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Delete existing photo with same order if exists
    const [existingPhotos] = await pool.execute<CulinaryPhotoRow[]>(
      'SELECT * FROM culinary_photos WHERE culinary_id = ? AND photo_order = ?',
      [culinaryId, photoOrder]
    );

    if (existingPhotos.length > 0) {
      // Delete old file
      const oldFilePath = path.join(process.cwd(), 'public', existingPhotos[0].file_path);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
      // Delete from culinary_photos database
      await pool.execute(
        'DELETE FROM culinary_photos WHERE culinary_id = ? AND photo_order = ?',
        [culinaryId, photoOrder]
      );
      
      // Delete from photos (gallery) database if exists
      await pool.execute(
        'DELETE FROM photos WHERE file_name = ?',
        [existingPhotos[0].file_name]
      );
    }

    // Save to culinary_photos table
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO culinary_photos (culinary_id, file_name, file_path, file_size, mime_type, photo_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        culinaryId,
        fileName,
        `/uploads/culinary/${fileName}`,
        file.size,
        file.type,
        photoOrder
      ]
    );

    // Also save to photos (gallery) table with 'culinary' album
    await pool.execute(
      `INSERT INTO photos (user_id, title, description, file_name, file_path, file_size, mime_type, width, height, album)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        `${placeName} - Photo ${photoOrder}`,
        `Photo from culinary visit to ${placeName}`,
        fileName,
        `/uploads/culinary/${fileName}`,
        file.size,
        file.type,
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
        filePath: `/uploads/culinary/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        photoOrder,
        uploadedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload photo' 
    }, { status: 500 });
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
      return NextResponse.json({ error: 'Photo ID is required' }, { status: 400 });
    }

    // Get photo details
    const [photos] = await pool.execute<CulinaryPhotoRow[]>(
      'SELECT * FROM culinary_photos WHERE id = ?',
      [photoId]
    );

    if (photos.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    const photo = photos[0];

    // Delete file from disk
    const filePath = path.join(process.cwd(), 'public', photo.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from culinary_photos database
    await pool.execute(
      'DELETE FROM culinary_photos WHERE id = ?',
      [photoId]
    );

    // Also delete from photos (gallery) database
    await pool.execute(
      'DELETE FROM photos WHERE file_name = ?',
      [photo.file_name]
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Photo deleted successfully' 
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: 'Failed to delete photo' 
    }, { status: 500 });
  }
}
