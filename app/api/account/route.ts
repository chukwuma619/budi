import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { exportUserData, clearAllStudyData, getUserAccountSummary } from '@/lib/database-helpers';

// GET: Get account summary/stats
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'export') {
      // Export user data
      const exportData = await exportUserData(user.id);
      if (!exportData) {
        return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="budi-data-export-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    }

    if (action === 'summary') {
      // Get account summary
      const summary = await getUserAccountSummary(user.id);
      if (!summary) {
        return NextResponse.json({ error: 'Failed to get account summary' }, { status: 500 });
      }
      return NextResponse.json(summary);
    }

    // Default: return basic account info
    return NextResponse.json({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      email_confirmed_at: user.email_confirmed_at,
      last_sign_in_at: user.last_sign_in_at
    });
  } catch (error) {
    console.error('Error in account API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Clear study data or delete account
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'clear-data') {
      // Clear all study data but keep account
      const success = await clearAllStudyData(user.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to clear study data' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Study data cleared successfully' });
    }

    if (action === 'delete-account') {
      // This is a dangerous operation that should be handled carefully
      // In a real app, you might want additional verification
      const success = await clearAllStudyData(user.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to clear data before account deletion' }, { status: 500 });
      }

      // Delete profile and preferences
      await Promise.all([
        supabase.from('user_profiles').delete().eq('id', user.id),
        supabase.from('user_preferences').delete().eq('id', user.id)
      ]);

      return NextResponse.json({ 
        success: true, 
        message: 'Account data deleted successfully. Please contact support for complete account removal.' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting account data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 