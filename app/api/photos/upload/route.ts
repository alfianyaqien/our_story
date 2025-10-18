import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import pool from '@/lib/database';
import { ResultSetHeader } from 'mysql2';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Parse session to get user ID (assuming session format is "userId:username")
    const userId = parseInt(sessionCookie.value.split(':')[0]);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';
    const albumId = formData.get('albumId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExt = path.extname(file.name);
    const fileName = `${timestamp}-${randomString}${fileExt}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save file to disk
    const filePath = path.join(uploadDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Get image dimensions (simple approach - can be enhanced)
    // For now, we'll store null and can add sharp library later for proper image processing
    const width = null;
    const height = null;

    // Get or use default album (General)
    let finalAlbumId = albumId ? parseInt(albumId) : null;
    
    if (!finalAlbumId) {
      // Get the General album ID
      const [generalAlbum] = await pool.execute<any[]>(
        'SELECT id FROM albums WHERE name = ? LIMIT 1',
        ['General']
      );
      
      if (generalAlbum.length > 0) {
        finalAlbumId = generalAlbum[0].id;
      }
    }

    // Store metadata in database
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO photos (user_id, title, description, file_name, file_path, file_size, mime_type, width, height, album_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        description,
        fileName,
        `/uploads/photos/${fileName}`,
        file.size,
        file.type,
        width,
        height,
        finalAlbumId
      ]
    );

    // Update album photo count
    if (finalAlbumId) {
      await pool.execute(
        'UPDATE albums SET photo_count = (SELECT COUNT(*) FROM photos WHERE album_id = ?) WHERE id = ?',
        [finalAlbumId, finalAlbumId]
      );
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: result.insertId,
        userId,
        fileName,
        filePath: `/uploads/photos/${fileName}`,
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
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload photo' 
    }, { status: 500 });
  }
}
