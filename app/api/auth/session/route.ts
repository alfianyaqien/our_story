import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    return NextResponse.json({
      user: {
        username: session.username,
        displayName: session.displayName
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
