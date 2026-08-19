import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import {
  contentTypeFor,
  resolveStoredFile,
  type UploadBucket,
} from '@/lib/uploads';

const BUCKETS: UploadBucket[] = ['photos', 'culinary'];

/**
 * Serves uploaded images, but only to someone who may see them.
 *
 * Uploads previously sat in `public/uploads/` and were handed out by Next's
 * static file server, which performs no authentication - so a photo URL was a
 * bearer token that never expired, and stories could not actually keep images
 * private from one another. This route checks the session, resolves which story
 * the file belongs to, and confirms the caller is a member before returning a
 * single byte.
 *
 * Note for the client: `next/image` optimisation fetches the source server-side
 * without the viewer's cookies, so it would get a 401 here. User uploads are
 * therefore rendered with `unoptimized` and fetched directly by the browser,
 * which does send the session cookie.
 */
export async function GET(
  _request: Request,
  { params }: { params: { path: string[] } }
) {
  try {
    const { storyId } = await requireStoryMember();

    const [bucket, fileName, ...rest] = params.path || [];

    if (rest.length > 0 || !bucket || !fileName) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (!BUCKETS.includes(bucket as UploadBucket)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Path traversal guard. Names are generated server-side, but this value
    // arrives from the URL, so it is validated rather than trusted.
    const absolute = resolveStoredFile(bucket as UploadBucket, fileName);
    if (!absolute) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Does this file belong to the caller's story? Both tables record the
    // file name, so ownership is a lookup rather than an assumption.
    const owned =
      bucket === 'photos'
        ? await pool.execute<RowDataPacket[]>(
            'SELECT 1 FROM photos WHERE file_name = ? AND story_id = ? LIMIT 1',
            [fileName, storyId]
          )
        : await pool.execute<RowDataPacket[]>(
            `SELECT 1
               FROM culinary_photos cp
               JOIN recipes r ON r.id = cp.culinary_id
              WHERE cp.file_name = ? AND r.story_id = ?
              LIMIT 1`,
            [fileName, storyId]
          );

    if ((owned[0] as RowDataPacket[]).length === 0) {
      // Deliberately 404, not 403: confirming a file exists in someone else's
      // story would itself leak information.
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
      const info = await stat(absolute);
      if (!info.isFile()) throw new Error('not a file');
      const data = await readFile(absolute);

      return new NextResponse(new Uint8Array(data), {
        headers: {
          'Content-Type': contentTypeFor(fileName),
          'Content-Length': String(info.size),
          // Private: the response depends on who is asking, so shared caches
          // must not keep it.
          'Cache-Control': 'private, max-age=3600',
          'X-Content-Type-Options': 'nosniff',
          // Stops the browser rendering anything here as an active document.
          'Content-Security-Policy': "default-src 'none'; sandbox",
        },
      });
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error serving media:', error);
    return NextResponse.json({ error: 'Failed to load file' }, { status: 500 });
  }
}
