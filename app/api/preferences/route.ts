import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserPreferences } from '@/lib/database-helpers';

// GET: Fetch user preferences
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await getUserPreferences(user.id);
    
    // Return default preferences if none exist
    if (!preferences) {
      const defaultPreferences = {
        id: user.id,
        email_notifications: true,
        study_reminders: true,
        smart_reminders: true,
        assignment_alerts: true,
        weekly_summary: true,
        progress_insights: true,
        ai_personality: 'friendly',
        response_length: 'medium',
        reminder_time: 30,
        auto_schedule: true,
        study_suggestions: true,
        analytics_consent: false,
        data_sharing_consent: false,
      };
      
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update user preferences
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email_notifications,
      study_reminders,
      smart_reminders,
      assignment_alerts,
      weekly_summary,
      progress_insights,
      ai_personality,
      response_length,
      reminder_time,
      auto_schedule,
      study_suggestions,
      analytics_consent,
      data_sharing_consent
    } = body;

    // Update user preferences in database
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        id: user.id,
        email_notifications: email_notifications ?? true,
        study_reminders: study_reminders ?? true,
        smart_reminders: smart_reminders ?? true,
        assignment_alerts: assignment_alerts ?? true,
        weekly_summary: weekly_summary ?? true,
        progress_insights: progress_insights ?? true,
        ai_personality: ai_personality || 'friendly',
        response_length: response_length || 'medium',
        reminder_time: reminder_time ?? 30,
        auto_schedule: auto_schedule ?? true,
        study_suggestions: study_suggestions ?? true,
        analytics_consent: analytics_consent ?? false,
        data_sharing_consent: data_sharing_consent ?? false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating preferences:', error);
      return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Reset preferences to defaults
export async function DELETE() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset to default preferences
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        id: user.id,
        email_notifications: true,
        study_reminders: true,
        smart_reminders: true,
        assignment_alerts: true,
        weekly_summary: true,
        progress_insights: true,
        ai_personality: 'friendly',
        response_length: 'medium',
        reminder_time: 30,
        auto_schedule: true,
        study_suggestions: true,
        analytics_consent: false,
        data_sharing_consent: false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error resetting preferences:', error);
      return NextResponse.json({ error: 'Failed to reset preferences' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error resetting preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 