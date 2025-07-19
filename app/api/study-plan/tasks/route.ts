import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { toggleStudyTaskCompletion, updateStudyTask } from '@/lib/database-helpers';

// PUT: Toggle task completion or update task details
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action, ...updateData } = body;

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    let result;
    if (action === 'toggle') {
      // Toggle completion status and update progress
      result = await toggleStudyTaskCompletion(user.id, taskId);
    } else {
      // Update task details
      result = await updateStudyTask(taskId, updateData);
    }

    if (!result) {
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 