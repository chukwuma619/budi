import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to map day names to database format
function getDayOfWeekFormat(dayName: string): string {
  const dayMap: { [key: string]: string } = {
    'monday': 'Monday',
    'tuesday': 'Tuesday', 
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  };
  
  const normalized = dayName.toLowerCase();
  return dayMap[normalized] || dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
}

// GET - Fetch user's schedule
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('user_id', user.id)
      .order('day_of_week', { ascending: true });

    if (error) {
      console.error('Error fetching schedule:', error);
      return NextResponse.json(
        { error: 'Failed to fetch schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule: data || [] });

  } catch (error) {
    console.error('Schedule API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new schedule item
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subject, time_slot, room, day_of_week, type, color, notifications } = await request.json();

    if (!subject || !time_slot || !day_of_week) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, time_slot, day_of_week' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('classes')
      .insert({
        user_id: user.id,
        subject,
        time_slot,
        room: room || null,
        day_of_week: getDayOfWeekFormat(day_of_week),
        type: type || 'class',
        color: color || null,
        notifications: notifications ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule item:', error);
      return NextResponse.json(
        { error: 'Failed to create schedule item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ schedule_item: data });

  } catch (error) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update schedule item
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, subject, time_slot, room, day_of_week, type, color, notifications } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (subject !== undefined) updateData.subject = subject;
    if (time_slot !== undefined) updateData.time_slot = time_slot;
    if (room !== undefined) updateData.room = room;
    if (day_of_week !== undefined) updateData.day_of_week = getDayOfWeekFormat(day_of_week);
    if (type !== undefined) updateData.type = type;
    if (color !== undefined) updateData.color = color;
    if (notifications !== undefined) updateData.notifications = notifications;

    const { data, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating schedule item:', error);
      return NextResponse.json(
        { error: 'Failed to update schedule item' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Schedule item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ schedule_item: data });

  } catch (error) {
    console.error('Schedule update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete schedule item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting schedule item:', error);
      return NextResponse.json(
        { error: 'Failed to delete schedule item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Schedule deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 