import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/database.types';

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

// Helper function to get user's classes for today
export async function getTodayClasses(userId: string) {
  const supabase = await createClient();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .eq('day_of_week', today)
    .order('time_slot', { ascending: true });

  if (error) {
    console.error('Error fetching today\'s classes:', error);
    return [];
  }

  return data || [];
}

// Helper function to get user's upcoming tasks
export async function getUpcomingTasks(userId: string, limit: number = 5) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .gte('due_date', today)
    .order('due_date', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming tasks:', error);
    return [];
  }

  return data || [];
}

// Helper function to get user's recent notes
export async function getRecentNotes(userId: string, limit: number = 5) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent notes:', error);
    return [];
  }

  // Parse JSON fields for compatibility
  return (data || []).map(note => ({
    ...note,
    key_points: note.key_points ? JSON.parse(note.key_points) : null,
    flashcards: note.flashcards ? JSON.parse(note.flashcards) : null,
  }));
}

// Helper function to get user's study sessions for progress tracking
export async function getRecentStudySessions(userId: string, limit: number = 10) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching study sessions:', error);
    return [];
  }

  return data || [];
}

// Helper function to get user's active study plans
export async function getActiveStudyPlans(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_plans')
    .select(`
      *,
      study_days (
        *,
        study_tasks (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching study plans:', error);
    return [];
  }

  return data || [];
}

// Helper function to get user profile
export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

// Helper function to get user preferences
export async function getUserPreferences(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }

  return data;
}

// Helper function to create initial user profile and preferences
export async function createUserProfileAndPreferences(userId: string, email: string, fullName?: string) {
  const supabase = await createClient();
  
  // Create user profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      full_name: fullName || null,
    });

  if (profileError) {
    console.error('Error creating user profile:', profileError);
  }

  // Create user preferences with defaults
  const { error: preferencesError } = await supabase
    .from('user_preferences')
    .insert({
      id: userId,
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
    });

  if (preferencesError) {
    console.error('Error creating user preferences:', preferencesError);
  }

  return { profileError, preferencesError };
}

// SCHEDULE/CLASSES CRUD OPERATIONS

// Helper function to get all user's classes/schedule
export async function getUserSchedule(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true });

  if (error) {
    console.error('Error fetching user schedule:', error);
    return [];
  }

  return data || [];
}

// Helper function to create a new class/schedule item
export async function createScheduleItem(userId: string, scheduleData: {
  subject: string;
  time_slot: string;
  day_of_week: string;
  room?: string;
  type?: string;
  color?: string;
  notifications?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('classes')
    .insert({
      user_id: userId,
      subject: scheduleData.subject,
      time_slot: scheduleData.time_slot,
      day_of_week: getDayOfWeekFormat(scheduleData.day_of_week),
      room: scheduleData.room || null,
      type: scheduleData.type || 'class',
      color: scheduleData.color || null,
      notifications: scheduleData.notifications ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating schedule item:', error);
    return null;
  }

  return data;
}

// Helper function to update a schedule item
export async function updateScheduleItem(userId: string, itemId: string, updateData: {
  subject?: string;
  time_slot?: string;
  day_of_week?: string;
  room?: string;
  type?: string;
  color?: string;
  notifications?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('classes')
    .update({
      ...updateData,
      day_of_week: updateData.day_of_week ? getDayOfWeekFormat(updateData.day_of_week) : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating schedule item:', error);
    return null;
  }

  return data;
}

// Helper function to delete a schedule item
export async function deleteScheduleItem(userId: string, itemId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting schedule item:', error);
    return false;
  }

  return true;
}

// Helper function to toggle notifications for a schedule item
export async function toggleScheduleNotifications(userId: string, itemId: string) {
  const supabase = await createClient();
  
  // First get the current state
  const { data: currentItem, error: fetchError } = await supabase
    .from('classes')
    .select('notifications')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching schedule item:', fetchError);
    return null;
  }

  // Toggle the notification state
  const { data, error } = await supabase
    .from('classes')
    .update({ 
      notifications: !currentItem.notifications,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling notifications:', error);
    return null;
  }

  return data;
}

// Helper function to parse natural language schedule requests
export function parseScheduleRequest(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Extract time patterns
  const timePatterns = [
    /at (\d{1,2}):(\d{2})\s*(am|pm)/gi,
    /at (\d{1,2})\s*(am|pm)/gi,
    /(\d{1,2}):(\d{2})\s*(am|pm)/gi,
    /(\d{1,2})\s*(am|pm)/gi
  ];
  
  // Extract day patterns
  const dayPatterns = [
    /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(tomorrow)/gi,
    /(today)/gi,
    /(next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/gi
  ];
  
  // Extract subject/event patterns
  const subjectPatterns = [
    /(?:for|about|regarding)\s+(.+?)(?:\s+at|\s+on|\s+tomorrow|\s+today|$)/gi,
    /reminder.+?for\s+(.+?)(?:\s+at|\s+on|\s+tomorrow|\s+today|$)/gi,
    /(?:quiz|exam|test|class|lecture|meeting|assignment).+?(.+?)(?:\s+at|\s+on|\s+tomorrow|\s+today|$)/gi
  ];

  let timeMatch = null;
  let dayMatch = null;
  let subjectMatch = null;

  // Find time
  for (const pattern of timePatterns) {
    const match = pattern.exec(message);
    if (match) {
      timeMatch = match;
      break;
    }
  }

  // Find day
  for (const pattern of dayPatterns) {
    const match = pattern.exec(lowerMessage);
    if (match) {
      dayMatch = match;
      break;
    }
  }

  // Find subject
  for (const pattern of subjectPatterns) {
    const match = pattern.exec(message);
    if (match) {
      subjectMatch = match;
      break;
    }
  }

  return {
    timeMatch,
    dayMatch,
    subjectMatch,
    rawMessage: message
  };
}

// NOTES CRUD OPERATIONS

// Helper function to get all user's notes
export async function getUserNotes(userId: string, limit?: number) {
  const supabase = await createClient();
  
  let query = supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user notes:', error);
    return [];
  }

  // Parse JSON fields for compatibility
  return (data || []).map(note => ({
    ...note,
    key_points: note.key_points ? JSON.parse(note.key_points) : null,
    flashcards: note.flashcards ? JSON.parse(note.flashcards) : null,
  }));
}

// Helper function to create a new note
export async function createNote(userId: string, noteData: {
  title: string;
  original_text?: string;
  summary?: string;
  key_points?: string[];
  flashcards?: { question: string; answer: string }[];
  file_name?: string;
  file_size?: number;
  upload_type?: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: userId,
      title: noteData.title,
      original_text: noteData.original_text || null,
      summary: noteData.summary || null,
      key_points: noteData.key_points ? JSON.stringify(noteData.key_points) : null,
      flashcards: noteData.flashcards ? JSON.stringify(noteData.flashcards) : null,
      file_name: noteData.file_name || null,
      file_size: noteData.file_size || null,
      upload_type: noteData.upload_type || 'text',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating note:', error);
    return null;
  }

  return data;
}

// Helper function to update a note
export async function updateNote(userId: string, noteId: string, updateData: {
  title?: string;
  original_text?: string;
  summary?: string;
  key_points?: string[];
  flashcards?: { question: string; answer: string }[];
  file_name?: string;
  file_size?: number;
  upload_type?: string;
}) {
  const supabase = await createClient();
  
  const updatePayload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updateData.title !== undefined) updatePayload.title = updateData.title;
  if (updateData.original_text !== undefined) updatePayload.original_text = updateData.original_text;
  if (updateData.summary !== undefined) updatePayload.summary = updateData.summary;
  if (updateData.key_points !== undefined) updatePayload.key_points = JSON.stringify(updateData.key_points);
  if (updateData.flashcards !== undefined) updatePayload.flashcards = JSON.stringify(updateData.flashcards);
  if (updateData.file_name !== undefined) updatePayload.file_name = updateData.file_name;
  if (updateData.file_size !== undefined) updatePayload.file_size = updateData.file_size;
  if (updateData.upload_type !== undefined) updatePayload.upload_type = updateData.upload_type;

  const { data, error } = await supabase
    .from('notes')
    .update(updatePayload)
    .eq('id', noteId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating note:', error);
    return null;
  }

  return data;
}

// Helper function to delete a note
export async function deleteNote(userId: string, noteId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting note:', error);
    return false;
  }

  return true;
}

// Helper function to get a single note by ID
export async function getNoteById(userId: string, noteId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('id', noteId)
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('Error fetching note:', error);
    return null;
  }

  if (!data) return null;

  // Parse JSON fields for compatibility
  return {
    ...data,
    key_points: data.key_points ? JSON.parse(data.key_points) : null,
    flashcards: data.flashcards ? JSON.parse(data.flashcards) : null,
  };
}

// Helper function to generate AI summary (placeholder for now)
export async function generateAISummary(text: string, title: string) {
  // This is a placeholder - in a real implementation, you'd call an AI service
  // For now, let's create a more intelligent summary
  
  const words = text.split(' ').filter(word => word.trim().length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Create a more intelligent summary
  let summary = '';
  if (words.length > 100) {
    // Take first 3 sentences and last 1 sentence for a better summary
    const firstSentences = sentences.slice(0, 3).join('. ');
    const lastSentence = sentences.length > 3 ? '. ' + sentences[sentences.length - 1] : '';
    summary = firstSentences + lastSentence + '.';
  } else {
    summary = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
  }

  // Generate more meaningful key points
  const keyPoints = [];
  if (sentences.length >= 1) keyPoints.push(`Main concept: ${sentences[0].trim()}`);
  if (sentences.length >= 2) keyPoints.push(`Important detail: ${sentences[1].trim()}`);
  if (sentences.length >= 3) keyPoints.push(`Additional point: ${sentences[2].trim()}`);
  if (sentences.length >= 4) keyPoints.push(`Conclusion: ${sentences[sentences.length - 1].trim()}`);

  // Generate more relevant flashcards
  const flashcards = [];
  
  if (sentences.length > 0) {
    flashcards.push({
      question: `What is the main topic discussed in "${title}"?`,
      answer: sentences[0].trim()
    });
  }
  
  if (keyPoints.length > 1) {
    flashcards.push({
      question: `What are the key points covered?`,
      answer: keyPoints.map(point => point.replace(/^[^:]+:\s*/, '')).join('; ')
    });
  }

  // Add a practical application question if the content seems educational
  if (text.toLowerCase().includes('example') || text.toLowerCase().includes('formula') || text.toLowerCase().includes('method')) {
    flashcards.push({
      question: `How would you apply the concepts from "${title}"?`,
      answer: 'Apply the methods and examples discussed in practical scenarios'
    });
  }

  return { summary, keyPoints, flashcards };
}

// Helper function to get user's chat history
export async function getChatHistory(userId: string, limit: number = 50) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return data || [];
}

// STUDY PLAN CRUD OPERATIONS

// Helper function to get user's study plans
export async function getUserStudyPlans(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_plans')
    .select(`
      *,
      study_days (
        *,
        study_tasks (*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching study plans:', error);
    return [];
  }

  return data || [];
}

// Helper function to create a new study plan
export async function createStudyPlan(userId: string, planData: {
  subject: string;
  exam_date: string;
  hours_per_day: number;
  total_days: number;
  progress?: number;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_plans')
    .insert({
      user_id: userId,
      subject: planData.subject,
      exam_date: planData.exam_date,
      hours_per_day: planData.hours_per_day,
      total_days: planData.total_days,
      progress: planData.progress || 0,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating study plan:', error);
    return null;
  }

  return data;
}

// Helper function to update a study plan
export async function updateStudyPlan(userId: string, planId: string, updateData: {
  subject?: string;
  exam_date?: string;
  hours_per_day?: number;
  total_days?: number;
  progress?: number;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_plans')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', planId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating study plan:', error);
    return null;
  }

  return data;
}

// Helper function to delete a study plan and its related data
export async function deleteStudyPlan(userId: string, planId: string) {
  const supabase = await createClient();
  
  // First delete all study tasks for this plan
  const { error: tasksError } = await supabase
    .from('study_tasks')
    .delete()
    .in('study_day_id', 
      supabase
        .from('study_days')
        .select('id')
        .eq('study_plan_id', planId)
    );

  if (tasksError) {
    console.error('Error deleting study tasks:', tasksError);
    return false;
  }

  // Then delete all study days for this plan
  const { error: daysError } = await supabase
    .from('study_days')
    .delete()
    .eq('study_plan_id', planId);

  if (daysError) {
    console.error('Error deleting study days:', daysError);
    return false;
  }

  // Finally delete the study plan
  const { error: planError } = await supabase
    .from('study_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', userId);

  if (planError) {
    console.error('Error deleting study plan:', planError);
    return false;
  }

  return true;
}

// Helper function to create study days for a plan
export async function createStudyDay(studyPlanId: string, dayData: {
  day_number: number;
  date: string;
  total_hours: number;
  completed?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_days')
    .insert({
      study_plan_id: studyPlanId,
      day_number: dayData.day_number,
      date: dayData.date,
      total_hours: dayData.total_hours,
      completed: dayData.completed || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating study day:', error);
    return null;
  }

  return data;
}

// Helper function to create study tasks for a day
export async function createStudyTask(studyDayId: string, taskData: {
  title: string;
  duration: number;
  task_type?: string;
  priority?: string;
  completed?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_tasks')
    .insert({
      study_day_id: studyDayId,
      title: taskData.title,
      duration: taskData.duration,
      task_type: taskData.task_type || 'reading',
      priority: taskData.priority || 'medium',
      completed: taskData.completed || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating study task:', error);
    return null;
  }

  return data;
}

// Helper function to update a study task
export async function updateStudyTask(taskId: string, updateData: {
  title?: string;
  duration?: number;
  task_type?: string;
  priority?: string;
  completed?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_tasks')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error updating study task:', error);
    return null;
  }

  return data;
}

// Helper function to toggle task completion and update plan progress
export async function toggleStudyTaskCompletion(userId: string, taskId: string) {
  const supabase = await createClient();
  
  // First get the current task state
  const { data: task, error: taskError } = await supabase
    .from('study_tasks')
    .select(`
      *,
      study_days (
        *,
        study_plans (*)
      )
    `)
    .eq('id', taskId)
    .single();

  if (taskError || !task) {
    console.error('Error fetching task:', taskError);
    return null;
  }

  // Toggle the task completion
  const { data: updatedTask, error: updateError } = await supabase
    .from('study_tasks')
    .update({
      completed: !task.completed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating task:', updateError);
    return null;
  }

  // Update the study day completion status
  const studyDay = Array.isArray(task.study_days) ? task.study_days[0] : task.study_days;
  if (studyDay) {
    // Get all tasks for this day to check completion
    const { data: dayTasks } = await supabase
      .from('study_tasks')
      .select('completed')
      .eq('study_day_id', studyDay.id);

    const allCompleted = dayTasks?.every(t => t.id === taskId ? !task.completed : t.completed) || false;
    
    await supabase
      .from('study_days')
      .update({
        completed: allCompleted,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studyDay.id);

    // Update the overall study plan progress
    const studyPlan = Array.isArray(studyDay.study_plans) ? studyDay.study_plans[0] : studyDay.study_plans;
    if (studyPlan) {
      await updateStudyPlanProgress(studyPlan.id);
    }
  }

  return updatedTask;
}

// Helper function to update study plan progress
export async function updateStudyPlanProgress(planId: string) {
  const supabase = await createClient();
  
  // Get all tasks for this plan
  const { data: allTasks } = await supabase
    .from('study_tasks')
    .select('completed')
    .in('study_day_id', 
      supabase
        .from('study_days')
        .select('id')
        .eq('study_plan_id', planId)
    );

  if (allTasks && allTasks.length > 0) {
    const completedTasks = allTasks.filter(task => task.completed).length;
    const progress = Math.round((completedTasks / allTasks.length) * 100);
    
    await supabase
      .from('study_plans')
      .update({
        progress: progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', planId);
  }
}

// Helper function to create a complete study plan with days and tasks
export async function createCompleteStudyPlan(userId: string, planData: {
  subject: string;
  exam_date: string;
  hours_per_day: number;
  topics?: string;
  studyDays: Array<{
    day_number: number;
    date: string;
    total_hours: number;
    tasks: Array<{
      title: string;
      duration: number;
      task_type: string;
      priority: string;
    }>;
  }>;
}) {
  const supabase = await createClient();
  
  try {
    // Create the study plan
    const studyPlan = await createStudyPlan(userId, {
      subject: planData.subject,
      exam_date: planData.exam_date,
      hours_per_day: planData.hours_per_day,
      total_days: planData.studyDays.length,
      progress: 0,
    });

    if (!studyPlan) {
      throw new Error('Failed to create study plan');
    }

    // Create study days and tasks
    for (const dayData of planData.studyDays) {
      const studyDay = await createStudyDay(studyPlan.id, {
        day_number: dayData.day_number,
        date: dayData.date,
        total_hours: dayData.total_hours,
        completed: false,
      });

      if (studyDay) {
        for (const taskData of dayData.tasks) {
          await createStudyTask(studyDay.id, taskData);
        }
      }
    }

    return studyPlan;
  } catch (error) {
    console.error('Error creating complete study plan:', error);
    return null;
  }
}

// Helper function to parse natural language study plan requests
export function parseStudyPlanRequest(message: string) {
  const lowerMessage = message.toLowerCase();
  
  // Extract subject
  const subjectMatch = lowerMessage.match(/(?:study plan for|plan for|studying) (.+?)(?:\s+exam|\s+test|\s+quiz|$)/);
  const subject = subjectMatch ? subjectMatch[1].trim() : '';
  
  // Extract exam date
  const datePatterns = [
    /(?:exam|test|quiz).*?(?:on|by|for)\s+(\d{4}-\d{2}-\d{2})/,
    /(?:exam|test|quiz).*?(?:on|by|for)\s+(tomorrow|today|next week|next month)/,
    /(?:exam|test|quiz).*?(?:on|by|for)\s+(\w+day)/,
  ];
  
  let examDate = '';
  for (const pattern of datePatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const dateStr = match[1];
      if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
        examDate = dateStr;
      } else {
        // Convert relative dates to actual dates
        const today = new Date();
        if (dateStr === 'tomorrow') {
          today.setDate(today.getDate() + 1);
          examDate = today.toISOString().split('T')[0];
        } else if (dateStr === 'today') {
          examDate = today.toISOString().split('T')[0];
        } else if (dateStr === 'next week') {
          today.setDate(today.getDate() + 7);
          examDate = today.toISOString().split('T')[0];
        } else if (dateStr === 'next month') {
          today.setMonth(today.getMonth() + 1);
          examDate = today.toISOString().split('T')[0];
        }
      }
      break;
    }
  }
  
  // Extract hours per day
  const hoursMatch = lowerMessage.match(/(\d+)\s*(?:hours?|hrs?)\s*(?:per day|daily|each day)/);
  const hoursPerDay = hoursMatch ? parseInt(hoursMatch[1]) : 2;
  
  // Extract topics/content
  const topicsMatch = lowerMessage.match(/(?:topics?|covering|including|focus on)\s+(.+?)(?:\s+exam|\s+test|\s+quiz|$)/);
  const topics = topicsMatch ? topicsMatch[1].trim() : '';
  
  return {
    subject,
    examDate,
    hoursPerDay,
    topics,
    isStudyPlanRequest: !!(subject && examDate),
  };
}

// TASKS CRUD OPERATIONS

// Helper function to get all user tasks
export async function getUserTasks(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user tasks:', error);
    return [];
  }

  return data || [];
}

// Helper function to create a new task
export async function createTask(userId: string, taskData: {
  title: string;
  subject?: string;
  due_date?: string;
  priority?: string;
  estimated_hours?: number;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title: taskData.title,
      subject: taskData.subject || null,
      due_date: taskData.due_date || null,
      priority: taskData.priority || 'medium',
      estimated_hours: taskData.estimated_hours || null,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    return null;
  }

  return data;
}

// Helper function to update a task
export async function updateTask(userId: string, taskId: string, updateData: {
  title?: string;
  subject?: string;
  due_date?: string;
  priority?: string;
  estimated_hours?: number;
  actual_hours?: number;
  completed?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .update({
      ...updateData,
      completed_at: updateData.completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    return null;
  }

  return data;
}

// Helper function to toggle task completion
export async function toggleTaskCompletion(userId: string, taskId: string) {
  const supabase = await createClient();
  
  // First get the current task state
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('completed')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single();

  if (taskError || !task) {
    console.error('Error fetching task:', taskError);
    return null;
  }

  // Toggle the completion status
  const { data, error } = await supabase
    .from('tasks')
    .update({
      completed: !task.completed,
      completed_at: !task.completed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error toggling task completion:', error);
    return null;
  }

  return data;
}

// Helper function to delete a task
export async function deleteTask(userId: string, taskId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting task:', error);
    return false;
  }

  return true;
}

// STUDY SESSIONS CRUD OPERATIONS

// Helper function to get all user study sessions
export async function getAllStudySessions(userId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('session_date', { ascending: false });

  if (error) {
    console.error('Error fetching study sessions:', error);
    return [];
  }

  return data || [];
}

// Helper function to create a new study session
export async function createStudySession(userId: string, sessionData: {
  subject: string;
  duration: number;
  session_date?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      subject: sessionData.subject,
      duration: sessionData.duration,
      session_date: sessionData.session_date || new Date().toISOString().split('T')[0],
      notes: sessionData.notes || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating study session:', error);
    return null;
  }

  return data;
}

// Helper function to update a study session
export async function updateStudySession(userId: string, sessionId: string, updateData: {
  subject?: string;
  duration?: number;
  session_date?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating study session:', error);
    return null;
  }

  return data;
}

// Helper function to delete a study session
export async function deleteStudySession(userId: string, sessionId: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting study session:', error);
    return false;
  }

  return true;
}

// PROGRESS ANALYTICS HELPERS

// Helper function to get task completion statistics
export async function getTaskCompletionStats(userId: string) {
  const supabase = await createClient();
  
  const { data: allTasks } = await supabase
    .from('tasks')
    .select('completed')
    .eq('user_id', userId);

  const { data: completedTasks } = await supabase
    .from('tasks')
    .select('completed_at')
    .eq('user_id', userId)
    .eq('completed', true);

  const total = allTasks?.length || 0;
  const completed = completedTasks?.length || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    pending: total - completed,
    completionRate
  };
}

// Helper function to get study time statistics
export async function getStudyTimeStats(userId: string) {
  const supabase = await createClient();
  
  // Get all study sessions
  const { data: allSessions } = await supabase
    .from('study_sessions')
    .select('duration, session_date, subject')
    .eq('user_id', userId);

  if (!allSessions) return { totalHours: 0, weeklyHours: 0, subjectStats: {} };

  const totalMinutes = allSessions.reduce((sum, session) => sum + session.duration, 0);
  const totalHours = totalMinutes / 60;

  // Calculate weekly hours (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weeklyMinutes = allSessions
    .filter(session => {
      const sessionDate = new Date(session.session_date || session.created_at);
      return sessionDate >= weekAgo;
    })
    .reduce((sum, session) => sum + session.duration, 0);
  const weeklyHours = weeklyMinutes / 60;

  // Calculate subject statistics
  const subjectStats = allSessions.reduce((acc, session) => {
    const subject = session.subject || 'Other';
    acc[subject] = (acc[subject] || 0) + session.duration / 60;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalHours,
    weeklyHours,
    subjectStats
  };
}

// SETTINGS AND DATA MANAGEMENT HELPERS

// Helper function to update user profile
export async function updateUserProfile(userId: string, profileData: {
  full_name?: string;
  university?: string;
  major?: string;
  bio?: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: userId,
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return data;
}

// Helper function to update user preferences
export async function updateUserPreferences(userId: string, preferences: {
  email_notifications?: boolean;
  study_reminders?: boolean;
  smart_reminders?: boolean;
  assignment_alerts?: boolean;
  weekly_summary?: boolean;
  progress_insights?: boolean;
  ai_personality?: string;
  response_length?: string;
  reminder_time?: number;
  auto_schedule?: boolean;
  study_suggestions?: boolean;
  analytics_consent?: boolean;
  data_sharing_consent?: boolean;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }

  return data;
}

// Helper function to export user data
export async function exportUserData(userId: string) {
  const supabase = await createClient();
  
  try {
    // Fetch all user data
    const [profile, preferences, tasks, sessions, notes, studyPlans, classes, chatMessages] = await Promise.all([
      getUserProfile(userId),
      getUserPreferences(userId),
      getUserTasks(userId),
      getAllStudySessions(userId),
      getUserNotes(userId),
      getUserStudyPlans(userId),
      getUserSchedule(userId),
      supabase.from('chat_messages').select('*').eq('user_id', userId)
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: userId,
      profile: profile || {},
      preferences: preferences || {},
      tasks: tasks || [],
      study_sessions: sessions || [],
      notes: notes || [],
      study_plans: studyPlans || [],
      schedule: classes || [],
      chat_history: chatMessages.data || [],
      summary: {
        total_tasks: tasks?.length || 0,
        total_study_sessions: sessions?.length || 0,
        total_notes: notes?.length || 0,
        total_study_plans: studyPlans?.length || 0,
        total_classes: classes?.length || 0,
        total_chat_messages: chatMessages.data?.length || 0
      }
    };

    return exportData;
  } catch (error) {
    console.error('Error exporting user data:', error);
    return null;
  }
}

// Helper function to clear all study data (but keep profile/preferences)
export async function clearAllStudyData(userId: string) {
  const supabase = await createClient();
  
  try {
    // Delete all study-related data in the correct order (respecting foreign keys)
    const deleteOperations = [
      // Delete study tasks first (dependent on study_days)
      supabase.from('study_tasks').delete().in('study_day_id', 
        supabase.from('study_days').select('id').in('study_plan_id',
          supabase.from('study_plans').select('id').eq('user_id', userId)
        )
      ),
      // Delete study days (dependent on study_plans)
      supabase.from('study_days').delete().in('study_plan_id',
        supabase.from('study_plans').select('id').eq('user_id', userId)
      ),
      // Delete study plans
      supabase.from('study_plans').delete().eq('user_id', userId),
      // Delete other data
      supabase.from('tasks').delete().eq('user_id', userId),
      supabase.from('study_sessions').delete().eq('user_id', userId),
      supabase.from('notes').delete().eq('user_id', userId),
      supabase.from('classes').delete().eq('user_id', userId),
      supabase.from('chat_messages').delete().eq('user_id', userId)
    ];

    // Execute deletions sequentially to avoid foreign key constraint violations
    for (const operation of deleteOperations) {
      const { error } = await operation;
      if (error) {
        console.error('Error during data deletion:', error);
        throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Error clearing user study data:', error);
    return false;
  }
}

// Helper function to delete user account completely
export async function deleteUserAccount(userId: string) {
  const supabase = await createClient();
  
  try {
    // First clear all study data
    const studyDataCleared = await clearAllStudyData(userId);
    if (!studyDataCleared) {
      throw new Error('Failed to clear study data');
    }

    // Delete user profile and preferences
    await Promise.all([
      supabase.from('user_profiles').delete().eq('id', userId),
      supabase.from('user_preferences').delete().eq('id', userId)
    ]);

    // Finally, delete the auth user (this should be done last)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Continue anyway as the data is already deleted
    }

    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    return false;
  }
}

// Helper function to get user account summary/stats
export async function getUserAccountSummary(userId: string) {
  const supabase = await createClient();
  
  try {
    const [profile, tasks, sessions, notes, studyPlans, classes] = await Promise.all([
      getUserProfile(userId),
      getUserTasks(userId),
      getAllStudySessions(userId),
      getUserNotes(userId),
      getUserStudyPlans(userId),
      getUserSchedule(userId)
    ]);

    const totalStudyTime = sessions?.reduce((total, session) => total + session.duration, 0) || 0;
    const completedTasks = tasks?.filter(task => task.completed).length || 0;
    const activeStudyPlans = studyPlans?.filter(plan => {
      const examDate = new Date(plan.exam_date);
      return examDate > new Date();
    }).length || 0;

    return {
      profile,
      stats: {
        total_tasks: tasks?.length || 0,
        completed_tasks: completedTasks,
        total_study_sessions: sessions?.length || 0,
        total_study_time_minutes: totalStudyTime,
        total_study_time_hours: Math.round((totalStudyTime / 60) * 10) / 10,
        total_notes: notes?.length || 0,
        total_study_plans: studyPlans?.length || 0,
        active_study_plans: activeStudyPlans,
        total_classes: classes?.length || 0,
        account_created: profile?.created_at || null
      }
    };
  } catch (error) {
    console.error('Error getting user account summary:', error);
    return null;
  }
} 