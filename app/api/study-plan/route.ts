import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  getUserStudyPlans, 
  createCompleteStudyPlan, 
  updateStudyPlan, 
  deleteStudyPlan
} from '@/lib/database-helpers';

// GET: Fetch user's study plans
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studyPlans = await getUserStudyPlans(user.id);
    return NextResponse.json(studyPlans);
  } catch (error) {
    console.error('Error fetching study plans:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new study plan
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, examDate, hoursPerDay, topics, studyDays } = body;

    if (!subject || !examDate || !hoursPerDay || !studyDays) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const studyPlan = await createCompleteStudyPlan(user.id, {
      subject,
      exam_date: examDate,
      hours_per_day: hoursPerDay,
      topics,
      studyDays
    });

    if (!studyPlan) {
      return NextResponse.json({ error: 'Failed to create study plan' }, { status: 500 });
    }

    return NextResponse.json(studyPlan);
  } catch (error) {
    console.error('Error creating study plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update an existing study plan
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, subject, examDate, hoursPerDay, progress } = body;

    if (!id) {
      return NextResponse.json({ error: 'Study plan ID is required' }, { status: 400 });
    }

    const updatedPlan = await updateStudyPlan(user.id, id, {
      subject,
      exam_date: examDate,
      hours_per_day: hoursPerDay,
      progress
    });

    if (!updatedPlan) {
      return NextResponse.json({ error: 'Failed to update study plan' }, { status: 500 });
    }

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating study plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a study plan
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!planId) {
      return NextResponse.json({ error: 'Study plan ID is required' }, { status: 400 });
    }

    const success = await deleteStudyPlan(user.id, planId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete study plan' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting study plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 