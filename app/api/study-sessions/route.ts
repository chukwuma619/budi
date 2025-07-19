import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getAllStudySessions, 
  createStudySession, 
  updateStudySession, 
  deleteStudySession,
  getStudyTimeStats
} from '@/lib/database-helpers';

// GET: Fetch user's study sessions
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statsOnly = searchParams.get('stats') === 'true';

    if (statsOnly) {
      const stats = await getStudyTimeStats(user.id);
      return NextResponse.json(stats);
    }

    const sessions = await getAllStudySessions(user.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching study sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new study session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, duration, session_date, notes } = body;

    if (!subject || !duration) {
      return NextResponse.json({ error: 'Subject and duration are required' }, { status: 400 });
    }

    const session = await createStudySession(user.id, {
      subject,
      duration: parseInt(duration),
      session_date,
      notes
    });

    if (!session) {
      return NextResponse.json({ error: 'Failed to create study session' }, { status: 500 });
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Error creating study session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing study session
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const result = await updateStudySession(user.id, id, updateData);

    if (!result) {
      return NextResponse.json({ error: 'Failed to update study session' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating study session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a study session
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const success = await deleteStudySession(user.id, sessionId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete study session' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting study session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 