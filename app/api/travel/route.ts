import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { toSqlDate, fromSqlDate } from '@/lib/date';

interface TravelPlanRow extends RowDataPacket {
  id: number;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  notes: string;
  status: string;
  created_at: string;
}

export async function GET() {
  try {
    const { userId, storyId } = await requireStoryMember();

    const [rows] = await pool.execute<TravelPlanRow[]>(
      `SELECT * FROM travel_plans WHERE story_id = ? ORDER BY created_at DESC`,
      [storyId]
    );

    const formattedPlans = rows.map(plan => ({
      id: plan.id,
      destination: plan.destination,
      startDate: fromSqlDate(plan.start_date),
      endDate: fromSqlDate(plan.end_date),
      budget: plan.budget,
      notes: plan.notes,
      status: plan.status,
      createdAt: plan.created_at
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching travel plans:', error);
    return NextResponse.json({ error: 'Failed to fetch travel plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { destination, startDate, endDate, budget, notes, status } = await request.json();

    if (!destination) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO travel_plans (story_id, destination, start_date, end_date, budget, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [storyId, destination, toSqlDate(startDate), toSqlDate(endDate), budget || null, notes || '', status || 'wishlist']
    );

    return NextResponse.json({ 
      success: true,
      planId: result.insertId
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating travel plan:', error);
    return NextResponse.json({ error: 'Failed to create travel plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { id, destination, startDate, endDate, budget, notes, status } = await request.json();

    if (!id || !destination) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE travel_plans
       SET destination = ?, start_date = ?, end_date = ?, budget = ?, notes = ?, status = ?
       WHERE id = ? AND story_id = ?`,
      [destination, toSqlDate(startDate), toSqlDate(endDate), budget || null, notes || '', status || 'wishlist', id, storyId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error updating travel plan:', error);
    return NextResponse.json({ error: 'Failed to update travel plan' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    await pool.execute('DELETE FROM travel_plans WHERE id = ? AND story_id = ?', [id, storyId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting travel plan:', error);
    return NextResponse.json({ error: 'Failed to delete travel plan' }, { status: 500 });
  }
}
