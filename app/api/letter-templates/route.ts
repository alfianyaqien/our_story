import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/database';
import { RowDataPacket } from 'mysql2';

interface TemplateRow extends RowDataPacket {
  id: number;
  name: string;
  category: string;
  content: string;
  placeholders: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const [rows] = await pool.execute<TemplateRow[]>(
      `SELECT * FROM letter_templates ORDER BY category, name`
    );

    const formattedTemplates = rows.map(template => ({
      id: template.id,
      name: template.name,
      category: template.category,
      content: template.content,
      placeholders: JSON.parse(template.placeholders)
    }));

    return NextResponse.json({ templates: formattedTemplates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
