import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/database';
import { requireStoryMember, StoryAccessError } from '@/lib/story';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { toSqlDate, fromSqlDate } from '@/lib/date';

interface CulinaryPlanRow extends RowDataPacket {
  id: number;
  place_name: string;
  location: string | null;
  cuisine_type: string | null;
  price_range: string;
  recommended_menu: string | null;
  notes: string | null;
  status: string;
  rating: number | null;
  is_favorite: boolean;
  visit_date: string | null;
  created_at: string;
}

export async function GET() {
  try {
    const { userId, storyId } = await requireStoryMember();

    const [rows] = await pool.execute<CulinaryPlanRow[]>(
      `SELECT * FROM recipes WHERE story_id = ? ORDER BY is_favorite DESC, created_at DESC`,
      [storyId]
    );

    const formattedPlans = rows.map(plan => ({
      id: plan.id,
      placeName: plan.place_name,
      location: plan.location,
      cuisineType: plan.cuisine_type,
      priceRange: plan.price_range,
      recommendedMenu: plan.recommended_menu,
      notes: plan.notes,
      status: plan.status,
      rating: plan.rating,
      isFavorite: plan.is_favorite,
      visitDate: fromSqlDate(plan.visit_date),
      createdAt: plan.created_at
    }));

    return NextResponse.json({ recipes: formattedPlans });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error fetching culinary plans:', error);
    return NextResponse.json({ error: 'Failed to fetch culinary plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { 
      placeName, 
      location, 
      cuisineType, 
      priceRange, 
      recommendedMenu, 
      notes, 
      status, 
      rating, 
      isFavorite,
      visitDate
    } = await request.json();

    if (!placeName) {
      return NextResponse.json({ error: 'Place name is required' }, { status: 400 });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO recipes (story_id, place_name, location, cuisine_type, price_range, recommended_menu, notes, status, rating, is_favorite, visit_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        storyId,
        placeName, 
        location || null, 
        cuisineType || null, 
        priceRange || '$$', 
        recommendedMenu || null, 
        notes || null, 
        status || 'wishlist',
        rating || null,
        isFavorite || false,
        toSqlDate(visitDate)
      ]
    );

    return NextResponse.json({ 
      success: true,
      recipeId: result.insertId
    });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error creating culinary plan:', error);
    return NextResponse.json({ error: 'Failed to create culinary plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, storyId } = await requireStoryMember();

    const { 
      id, 
      placeName, 
      location, 
      cuisineType, 
      priceRange, 
      recommendedMenu, 
      notes, 
      status, 
      rating, 
      isFavorite,
      visitDate
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Plan ID is required' }, { status: 400 });
    }

    await pool.execute(
      `UPDATE recipes
       SET place_name = ?, location = ?, cuisine_type = ?, price_range = ?, 
           recommended_menu = ?, notes = ?, status = ?, rating = ?, is_favorite = ?, visit_date = ?
       WHERE id = ? AND story_id = ?`,
      [
        placeName, 
        location || null, 
        cuisineType || null, 
        priceRange || '$$', 
        recommendedMenu || null, 
        notes || null, 
        status || 'wishlist',
        rating || null,
        isFavorite || false,
        toSqlDate(visitDate),
        id,
        storyId
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error updating culinary plan:', error);
    return NextResponse.json({ error: 'Failed to update culinary plan' }, { status: 500 });
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

    await pool.execute('DELETE FROM recipes WHERE id = ? AND story_id = ?', [id, storyId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StoryAccessError) return error.response;
    console.error('Error deleting culinary plan:', error);
    return NextResponse.json({ error: 'Failed to delete culinary plan' }, { status: 500 });
  }
}
