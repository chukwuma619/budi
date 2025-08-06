//@ts-nocheck

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserProfile, 
  getUserPreferences, 
  getTodayClasses, 
  getUpcomingTasks, 
  getRecentNotes,
  createScheduleItem,
  parseScheduleRequest,
  createNote,
  createCompleteStudyPlan,
  parseStudyPlanRequest,
  createTask,
  createStudySession
} from '@/lib/database-helpers';
import { generateAIResponse as generateOpenAIResponse, generateAISummary } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, userId } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get user context for personalized responses
    const [userProfile, userPreferences, todayClasses, upcomingTasks, recentNotes, uploadedNotes] = await Promise.all([
      getUserProfile(userId),
      getUserPreferences(userId),
      getTodayClasses(userId),
      getUpcomingTasks(userId, 5),
      getRecentNotes(userId, 3),
      getUploadedNotes(userId)
    ]);

    // Generate AI response based on user message and context
    const aiResponse = await generateAIResponse(message, {
      userProfile,
      userPreferences,
      todayClasses,
      upcomingTasks,
      recentNotes,
      uploadedNotes,
      userId
    });

    // Store chat message in database
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        message: message,
        response: aiResponse,
        context: {
          timestamp: new Date().toISOString(),
          hasClasses: todayClasses.length > 0,
          hasTasks: upcomingTasks.length > 0,
          hasNotes: recentNotes.length > 0
        }
      });

    if (insertError) {
      console.error('Error storing chat message:', insertError);
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(message: string, context: Record<string, unknown>): Promise<string> {
  const { userProfile, todayClasses, upcomingTasks, recentNotes, uploadedNotes, userId } = context;
  
  // Use OpenAI for general responses
  const aiResponse = await generateOpenAIResponse(message, {
    userProfile,
    todayClasses,
    upcomingTasks,
    recentNotes,
    uploadedNotes,
    userId
  });
  
  return aiResponse;
}

async function getUploadedNotes(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('uploaded_notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching uploaded notes:', error);
    return [];
  }

  return data || [];
} 