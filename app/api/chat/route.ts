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
  generateAISummary,
  createCompleteStudyPlan,
  parseStudyPlanRequest,
  createTask,
  createStudySession
} from '@/lib/database-helpers';

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
    const [userProfile, userPreferences, todayClasses, upcomingTasks, recentNotes] = await Promise.all([
      getUserProfile(userId),
      getUserPreferences(userId),
      getTodayClasses(userId),
      getUpcomingTasks(userId, 5),
      getRecentNotes(userId, 3)
    ]);

    // Generate AI response based on user message and context
    const aiResponse = await generateAIResponse(message, {
      userProfile,
      userPreferences,
      todayClasses,
      upcomingTasks,
      recentNotes,
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
  const lowerMessage = message.toLowerCase();
  const { userProfile, todayClasses, upcomingTasks, recentNotes, userId } = context;
  
  const userName = (userProfile as { full_name?: string })?.full_name?.split(' ')[0] || 'there';
  
  // Check for schedule creation requests first
  const scheduleKeywords = ['reminder', 'schedule', 'set', 'add', 'quiz', 'exam', 'test', 'class', 'meeting', 'appointment'];
  const isScheduleRequest = scheduleKeywords.some(keyword => lowerMessage.includes(keyword)) && 
    (lowerMessage.includes('for') || lowerMessage.includes('at') || lowerMessage.includes('on') || 
     lowerMessage.includes('tomorrow') || lowerMessage.includes('today') || 
     lowerMessage.includes('monday') || lowerMessage.includes('tuesday') || lowerMessage.includes('wednesday') ||
     lowerMessage.includes('thursday') || lowerMessage.includes('friday') || lowerMessage.includes('saturday') ||
     lowerMessage.includes('sunday'));

  if (isScheduleRequest) {
    const parsedRequest = parseScheduleRequest(message);
    
    // Try to extract and create schedule item
    let extractedTime = '';
    let extractedDay = '';
    let extractedSubject = '';
    
    // Process time
    if (parsedRequest.timeMatch) {
      if (parsedRequest.timeMatch[3]) { // Has AM/PM
        const hour = parsedRequest.timeMatch[1];
        const minute = parsedRequest.timeMatch[2] || '00';
        const ampm = parsedRequest.timeMatch[3].toUpperCase();
        extractedTime = `${hour}:${minute} ${ampm}`;
      } else {
        extractedTime = parsedRequest.timeMatch[0];
      }
    }
    
    // Process day
    if (parsedRequest.dayMatch) {
      const dayString = parsedRequest.dayMatch[1].toLowerCase();
      if (dayString === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        extractedDay = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });
      } else if (dayString === 'today') {
        extractedDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      } else if (dayString.includes('next')) {
        extractedDay = dayString.replace('next ', '');
        extractedDay = extractedDay.charAt(0).toUpperCase() + extractedDay.slice(1);
      } else {
        extractedDay = dayString.charAt(0).toUpperCase() + dayString.slice(1);
      }
    }
    
    // Process subject
    if (parsedRequest.subjectMatch) {
      extractedSubject = parsedRequest.subjectMatch[1].trim();
    } else {
      // Fallback: extract subject from common patterns
      const patterns = [
        /(?:my|the) ([^.]+?)(?:\s+(?:quiz|exam|test|class))/gi,
        /([^.]+?)(?:\s+(?:quiz|exam|test|class))/gi,
        /for ([^.]+)/gi
      ];
      
      for (const pattern of patterns) {
        const match = pattern.exec(message);
        if (match && match[1]) {
          extractedSubject = match[1].trim();
          break;
        }
      }
    }

    // If we have enough information, create the schedule item
    if (extractedSubject && (extractedTime || extractedDay)) {
      const scheduleType = lowerMessage.includes('quiz') || lowerMessage.includes('exam') || lowerMessage.includes('test') ? 'exam' : 
                          lowerMessage.includes('reminder') ? 'reminder' : 'class';
      
      const scheduleData = {
        subject: extractedSubject,
        time_slot: extractedTime || 'TBD',
        day_of_week: extractedDay || 'Monday',
        type: scheduleType,
        notifications: true
      };

      try {
        const createdItem = await createScheduleItem(userId as string, scheduleData);
        if (createdItem) {
          return `Perfect! I've added "${extractedSubject}" to your schedule${extractedDay ? ` for ${extractedDay}` : ''}${extractedTime ? ` at ${extractedTime}` : ''}. ${
            scheduleType === 'exam' ? 'Good luck with your exam! 📚' : 
            scheduleType === 'reminder' ? 'I\'ll make sure you don\'t forget! 🔔' : 
            'See you in class! 📖'
          } You can view and manage all your schedule items in the Schedule section.`;
        }
      } catch (error) {
        console.error('Error creating schedule item:', error);
      }
    }
    
    // If we couldn't parse enough information, ask for clarification
    return `I'd be happy to help you set up a schedule reminder! I understood you want to add something${extractedSubject ? ` about "${extractedSubject}"` : ''}${extractedDay ? ` for ${extractedDay}` : ''}${extractedTime ? ` at ${extractedTime}` : ''}. 

Could you provide more details? For example:
• "Set a reminder for my Math quiz tomorrow at 2 PM"
• "Add Chemistry class on Monday at 9:00 AM in Room 101"
• "Schedule Physics exam for Friday at 10:30 AM"

Or you can manually create schedule items in the Schedule section of your dashboard!`;
  }

  // Check for note summarization requests
  const noteKeywords = ['summarize', 'summary', 'notes', 'note', 'study', 'learn'];
  const isNoteRequest = noteKeywords.some(keyword => lowerMessage.includes(keyword)) && 
    (lowerMessage.includes('this') || lowerMessage.includes('text') || lowerMessage.includes('content') ||
     lowerMessage.includes('material') || lowerMessage.includes('lecture') || lowerMessage.includes('chapter'));

  if (isNoteRequest && (lowerMessage.includes('summarize') || lowerMessage.includes('summary'))) {
    // Extract the text to summarize from the message
    const patterns = [
      /summarize\s+this[:\s]+(.+)/gi,
      /summarize[:\s]+(.+)/gi,
      /create\s+notes?\s+for[:\s]+(.+)/gi,
      /make\s+a\s+summary\s+of[:\s]+(.+)/gi
    ];

    let extractedText = '';
    let title = 'Chat Summary';

    for (const pattern of patterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        extractedText = match[1].trim();
        title = extractedText.length > 50 
          ? extractedText.substring(0, 50) + '...' 
          : extractedText;
        break;
      }
    }

    if (extractedText && extractedText.length > 20) {
      try {
        const noteData = {
          title: `Chat Summary: ${title}`,
          original_text: extractedText,
          upload_type: 'text'
        };

        // Generate AI summary
        const { summary, keyPoints, flashcards } = await generateAISummary(extractedText, title);
        
        const createdNote = await createNote(userId as string, {
          ...noteData,
          summary,
          key_points: keyPoints,
          flashcards
        });

        if (createdNote) {
          return `Great! I've created a summary of your text and saved it to your notes. Here's what I found:

**Summary:** ${summary}

**Key Points:**
${keyPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

You can view the full note with flashcards in your Notes section. Would you like me to explain any of these concepts in more detail?`;
        }
      } catch (error) {
        console.error('Error creating note from chat:', error);
      }
    }
    
    return `I'd be happy to help you summarize text! You can:

• Paste the text directly after "summarize this:" followed by your content
• Ask me to "summarize this lecture material: [your text here]"
• Use "create notes for: [your content]"

Or you can upload files and paste text directly in the Notes section for more detailed summaries with flashcards!`;
  }

  // Check for study plan creation requests
  const studyPlanKeywords = ['study plan', 'plan for', 'studying for', 'prepare for', 'exam plan', 'study schedule'];
  const isStudyPlanRequest = studyPlanKeywords.some(keyword => lowerMessage.includes(keyword)) && 
    (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('quiz') || 
     lowerMessage.includes('for') || lowerMessage.includes('create') || lowerMessage.includes('make'));

  if (isStudyPlanRequest) {
    const parsedPlan = parseStudyPlanRequest(message);
    
    if (parsedPlan.isStudyPlanRequest && parsedPlan.subject && parsedPlan.examDate) {
      try {
        // Generate study plan structure
        const examDate = new Date(parsedPlan.examDate);
        const today = new Date();
        const totalDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const actualDays = Math.min(totalDays, 14); // Limit to 14 days max
        
        if (actualDays <= 0) {
          return `I notice the exam date you mentioned (${parsedPlan.examDate}) has already passed or is today. Could you provide a future date? For example: "Create a study plan for Biology exam on 2024-12-15"`;
        }

        // Generate study days with tasks
        const studyDays = [];
        
        const baseTopics = parsedPlan.topics 
          ? parsedPlan.topics.split(',').map(t => t.trim())
          : [
              'Review fundamental concepts',
              'Practice problems and exercises',
              'Study advanced topics',
              'Complete practice tests',
              'Review challenging areas',
              'Final review session'
            ];

        for (let i = 0; i < actualDays; i++) {
          const dayDate = new Date(today);
          dayDate.setDate(today.getDate() + i);
          
          const isEarlyDays = i < actualDays * 0.4;
          const isMidDays = i >= actualDays * 0.4 && i < actualDays * 0.8;
          
          let dayTasks = [];
          
          if (isEarlyDays) {
            // Early days: focus on reading and understanding
            dayTasks = [
              {
                title: `${baseTopics[0]} - ${parsedPlan.subject}`,
                duration: Math.floor((parsedPlan.hoursPerDay * 60) * 0.6),
                task_type: 'reading',
                priority: 'high'
              },
              {
                title: `Practice basic ${parsedPlan.subject} problems`,
                duration: Math.floor((parsedPlan.hoursPerDay * 60) * 0.4),
                task_type: 'practice',
                priority: 'medium'
              }
            ];
          } else if (isMidDays) {
            // Middle days: focus on practice and deeper understanding
            dayTasks = [
              {
                title: `Advanced ${parsedPlan.subject} concepts`,
                duration: Math.floor((parsedPlan.hoursPerDay * 60) * 0.4),
                task_type: 'reading',
                priority: 'high'
              },
              {
                title: `${parsedPlan.subject} problem sets`,
                duration: Math.floor((parsedPlan.hoursPerDay * 60) * 0.6),
                task_type: 'practice',
                priority: 'high'
              }
            ];
          } else {
            // Final days: focus on review and testing
            dayTasks = [
              {
                title: `Review all ${parsedPlan.subject} materials`,
                duration: Math.floor((parsedPlan.hoursPerDay * 60) * 0.5),
                task_type: 'review',
                priority: 'high'
              },
              {
                title: `${parsedPlan.subject} practice exam`,
                duration: Math.floor((parsedPlan.hoursPerDay * 60) * 0.5),
                task_type: 'quiz',
                priority: 'high'
              }
            ];
          }

          studyDays.push({
            day_number: i + 1,
            date: dayDate.toISOString().split('T')[0],
            total_hours: parsedPlan.hoursPerDay,
            tasks: dayTasks
          });
        }

        const createdPlan = await createCompleteStudyPlan(userId as string, {
          subject: parsedPlan.subject,
          exam_date: parsedPlan.examDate,
          hours_per_day: parsedPlan.hoursPerDay,
          topics: parsedPlan.topics,
          studyDays
        });

        if (createdPlan) {
          return `Excellent! I've created a comprehensive ${actualDays}-day study plan for your ${parsedPlan.subject} exam on ${new Date(parsedPlan.examDate).toLocaleDateString()}. 📚

**Study Plan Summary:**
• **Subject:** ${parsedPlan.subject}
• **Duration:** ${actualDays} days
• **Daily Study Time:** ${parsedPlan.hoursPerDay} hours
• **Total Study Hours:** ${actualDays * parsedPlan.hoursPerDay} hours

**Plan Structure:**
${actualDays <= 7 ? '• **Days 1-3:** Foundation building and basic concepts' : '• **Days 1-5:** Foundation building and basic concepts'}
${actualDays <= 7 ? '• **Days 4-5:** Practice and problem-solving' : '• **Days 6-10:** Advanced concepts and practice'}
${actualDays <= 7 ? '• **Days 6-7:** Review and practice exams' : '• **Days 11-14:** Review, practice exams, and final prep'}

Your study plan is now available in the Study Plan section where you can:
✅ Track your daily progress
📋 Mark tasks as complete
📈 Monitor your study streak
🎯 Adjust your schedule as needed

Good luck with your studies! Remember, consistency is key. 🌟`;
        }
      } catch (error) {
        console.error('Error creating study plan:', error);
        return `I'd love to help create your study plan! However, I encountered an issue setting it up. Could you try again or create one manually in the Study Plan section? 

For example, try: "Create a study plan for Mathematics exam on 2024-12-15 with 3 hours per day"`;
      }
    } else {
      // Provide guidance for better study plan requests
      const missingInfo = [];
      if (!parsedPlan.subject) missingInfo.push('subject');
      if (!parsedPlan.examDate) missingInfo.push('exam date');
      
      return `I'd be happy to create a study plan for you! I need a bit more information to get started. ${
        missingInfo.length > 0 ? `I couldn't identify the ${missingInfo.join(' and ')}.` : ''
      }

**Here are some examples of what works well:**
• "Create a study plan for Biology exam on 2024-12-15"
• "Make a study plan for Physics test on December 20th with 4 hours per day"
• "Plan for Chemistry quiz tomorrow with 2 hours daily"
• "Study plan for Mathematics exam next week covering calculus and algebra"

**I can automatically:**
📅 Calculate the optimal number of study days
⏰ Distribute your study hours effectively
📚 Create a balanced mix of reading, practice, and review
🎯 Focus on high-priority topics as the exam approaches

What subject and exam date should we plan for?`;
    }
  }

  // Check for task creation requests
  const taskKeywords = ['task', 'assignment', 'homework', 'project', 'essay', 'report', 'paper'];
  const taskActions = ['add', 'create', 'make', 'set', 'track', 'remind me'];
  const isTaskRequest = taskKeywords.some(keyword => lowerMessage.includes(keyword)) && 
    taskActions.some(action => lowerMessage.includes(action));

  if (isTaskRequest && !isScheduleRequest && !isStudyPlanRequest) {
    // Extract task information
    let taskTitle = '';
    let taskSubject = '';
    let taskDueDate = '';
    let taskPriority = 'medium';
    let estimatedHours = 2;

    // Extract title patterns
    const titlePatterns = [
      /(?:add|create|make|track)\s+(?:a\s+)?(?:task|assignment|homework)\s+(?:for\s+)?(?:called\s+)?["']([^"']+)["']/gi,
      /(?:add|create|make|track)\s+(?:a\s+)?(?:task|assignment|homework)\s+(?:for\s+)?(?:to\s+)?([^,.!?]+?)(?:\s+(?:due|for|in|by|on))/gi,
      /(?:add|create|make|track)\s+(?:a\s+)?(?:task|assignment|homework):\s*([^,.!?]+)/gi,
      /task\s+(?:called\s+)?["']([^"']+)["']/gi,
      /(?:remind me to|track)\s+([^,.!?]+?)(?:\s+(?:due|for|in|by|on))/gi
    ];

    for (const pattern of titlePatterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        taskTitle = match[1].trim();
        break;
      }
    }

    // Extract subject patterns
    const subjectPatterns = [
      /(?:for|in)\s+([A-Za-z]+)\s+(?:class|course|subject)/gi,
      /(?:for|in)\s+(Mathematics|Math|Physics|Chemistry|Biology|History|English|Literature|Science|Computer Science|Programming|Economics|Psychology|Sociology)/gi
    ];

    for (const pattern of subjectPatterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        taskSubject = match[1].trim();
        break;
      }
    }

    // Extract due date patterns
    const dueDatePatterns = [
      /due\s+(?:on\s+)?([0-9]{4}-[0-9]{2}-[0-9]{2})/gi,
      /due\s+(?:on\s+)?(tomorrow|today)/gi,
      /due\s+(?:on\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      /due\s+(?:on\s+)?([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/gi,
      /due\s+(?:in\s+)?([0-9]+)\s+days?/gi,
      /by\s+([0-9]{4}-[0-9]{2}-[0-9]{2})/gi
    ];

    for (const pattern of dueDatePatterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        const dateStr = match[1].toLowerCase();
        if (dateStr === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          taskDueDate = tomorrow.toISOString().split('T')[0];
        } else if (dateStr === 'today') {
          taskDueDate = new Date().toISOString().split('T')[0];
        } else if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(dateStr)) {
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const targetDay = days.indexOf(dateStr);
          const today = new Date();
          const currentDay = today.getDay();
          let daysUntil = targetDay - currentDay;
          if (daysUntil <= 0) daysUntil += 7;
          const targetDate = new Date();
          targetDate.setDate(today.getDate() + daysUntil);
          taskDueDate = targetDate.toISOString().split('T')[0];
        } else if (match[1].match(/[0-9]/)) {
          if (match[1].includes('days')) {
            const days = parseInt(match[1]);
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            taskDueDate = futureDate.toISOString().split('T')[0];
          } else {
            taskDueDate = match[1];
          }
        }
        break;
      }
    }

    // Extract priority patterns
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('high priority')) {
      taskPriority = 'high';
    } else if (lowerMessage.includes('low priority') || lowerMessage.includes('when i have time')) {
      taskPriority = 'low';
    }

    // Extract estimated hours
    const hoursPatterns = [
      /(?:take|need|require|estimate)\s+(?:about\s+)?([0-9]+(?:\.[0-9]+)?)\s+hours?/gi,
      /([0-9]+(?:\.[0-9]+)?)\s+hours?\s+(?:task|assignment|project)/gi
    ];

    for (const pattern of hoursPatterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        estimatedHours = parseFloat(match[1]);
        break;
      }
    }

    // Create task if we have enough information
    if (taskTitle) {
      try {
        const createdTask = await createTask(userId as string, {
          title: taskTitle,
          subject: taskSubject || undefined,
          due_date: taskDueDate || undefined,
          priority: taskPriority,
          estimated_hours: estimatedHours
        });

        if (createdTask) {
          return `Perfect! I've added "${taskTitle}" to your task list${taskSubject ? ` for ${taskSubject}` : ''}${taskDueDate ? ` with a due date of ${new Date(taskDueDate).toLocaleDateString()}` : ''}. 

**Task Details:**
• **Title:** ${taskTitle}
${taskSubject ? `• **Subject:** ${taskSubject}` : ''}
${taskDueDate ? `• **Due Date:** ${new Date(taskDueDate).toLocaleDateString()}` : ''}
• **Priority:** ${taskPriority.charAt(0).toUpperCase() + taskPriority.slice(1)}
• **Estimated Time:** ${estimatedHours} hours

You can track your progress and mark it complete in the Progress section! 📋✅`;
        }
      } catch (error) {
        console.error('Error creating task:', error);
      }
    } else {
      // Ask for clarification
      return `I'd be happy to help you track a new task! I need a bit more information to get started. 

**Here are some examples that work well:**
• "Add a task: Write History essay due tomorrow"
• "Create assignment for Math homework due Friday"
• "Track project: Physics lab report due 2024-12-15"
• "Make a task called 'Study for Chemistry quiz' due in 3 days"

What task would you like me to add for you?`;
    }
  }

  // Check for study session logging requests
  const sessionKeywords = ['studied', 'study session', 'log study', 'track study', 'record study', 'spent studying'];
  const timeKeywords = ['hours', 'minutes', 'hour', 'minute', 'mins', 'hrs'];
  const isStudySessionRequest = sessionKeywords.some(keyword => lowerMessage.includes(keyword)) && 
    timeKeywords.some(keyword => lowerMessage.includes(keyword));

  if (isStudySessionRequest) {
    // Extract study session information
    let sessionSubject = '';
    let sessionDuration = 60; // default 60 minutes
    let sessionDate = new Date().toISOString().split('T')[0];
    let sessionNotes = '';

    // Extract subject patterns
    const subjectPatterns = [
      /studied\s+([A-Za-z\s]+?)\s+for/gi,
      /study\s+session\s+(?:for\s+)?([A-Za-z\s]+?)\s+(?:for|lasted)/gi,
      /(?:log|track|record)\s+(?:study|studying)\s+([A-Za-z\s]+?)\s+for/gi,
      /spent\s+(?:[0-9]+\s+(?:hours?|minutes?|mins?|hrs?)\s+)?studying\s+([A-Za-z\s]+)/gi
    ];

    for (const pattern of subjectPatterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        sessionSubject = match[1].trim();
        break;
      }
    }

    // Extract duration patterns
    const durationPatterns = [
      /([0-9]+(?:\.[0-9]+)?)\s+hours?/gi,
      /([0-9]+)\s+(?:minutes?|mins?)/gi,
      /([0-9]+)\s+hrs?/gi
    ];

    for (const pattern of durationPatterns) {
      const match = pattern.exec(message);
      if (match && match[1]) {
        const value = parseFloat(match[1]);
        if (pattern.source.includes('hour') || pattern.source.includes('hrs')) {
          sessionDuration = Math.round(value * 60); // convert hours to minutes
        } else {
          sessionDuration = Math.round(value); // already in minutes
        }
        break;
      }
    }

    // Extract date patterns
    const datePatterns = [
      /(?:yesterday|last night)/gi,
      /(?:today|this morning|this afternoon|this evening)/gi,
      /on\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi
    ];

    for (const pattern of datePatterns) {
      const match = pattern.exec(message);
      if (match) {
        const dateStr = match[0].toLowerCase();
        if (dateStr.includes('yesterday') || dateStr.includes('last night')) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          sessionDate = yesterday.toISOString().split('T')[0];
        } else if (dateStr.includes('today') || dateStr.includes('morning') || dateStr.includes('afternoon') || dateStr.includes('evening')) {
          sessionDate = new Date().toISOString().split('T')[0];
        }
        break;
      }
    }

    // Extract notes/activities
    const notesPatterns = [
      /(?:on|about|covering)\s+([^.!?]+)/gi,
      /(?:reviewed|practiced|worked on|focused on)\s+([^.!?]+)/gi
    ];

    for (const pattern of notesPatterns) {
      const match = pattern.exec(message);
      if (match && match[1] && !match[1].includes('hour') && !match[1].includes('minute')) {
        sessionNotes = match[1].trim();
        break;
      }
    }

    // Create study session if we have enough information
    if (sessionSubject && sessionDuration > 0) {
      try {
        const createdSession = await createStudySession(userId as string, {
          subject: sessionSubject,
          duration: sessionDuration,
          session_date: sessionDate,
          notes: sessionNotes || null
        });

        if (createdSession) {
          return `Great job studying! I've logged your study session: 

**Study Session Recorded:**
• **Subject:** ${sessionSubject}
• **Duration:** ${Math.floor(sessionDuration / 60)}h ${sessionDuration % 60}m
• **Date:** ${new Date(sessionDate).toLocaleDateString()}
${sessionNotes ? `• **Focus:** ${sessionNotes}` : ''}

Keep up the excellent work! 🎓📚 You can view all your study sessions and progress in the Progress section.`;
        }
      } catch (error) {
        console.error('Error creating study session:', error);
      }
    } else {
      // Ask for clarification
      return `I'd love to help you log your study time! I need a bit more information to record your session properly.

**Here are some examples that work well:**
• "I studied Math for 2 hours today"
• "Log study session: Biology for 90 minutes on photosynthesis"
• "Track studying Physics for 1.5 hours yesterday"
• "Record study: spent 45 minutes reviewing Chemistry notes"

What subject did you study and for how long?`;
    }
  }
  
  // Schedule and reminder queries (viewing existing schedule)
  if (lowerMessage.includes('schedule') || lowerMessage.includes('class') || lowerMessage.includes('today')) {
    if (todayClasses.length > 0) {
      const classesText = todayClasses.map(cls => `${cls.subject} at ${cls.time_slot}`).join(', ');
      return `Hi ${userName}! Here are your classes for today: ${classesText}. ${
        todayClasses.length > 2 ? "Looks like a busy day! " : ""
      }Would you like me to set any reminders or help you prepare for any of these classes?`;
    } else {
      return `Hi ${userName}! You don't have any classes scheduled for today. This could be a great time to catch up on assignments, review notes, or work on upcoming projects. What would you like to focus on?`;
    }
  }

  // Task and deadline queries
  if (lowerMessage.includes('task') || lowerMessage.includes('assignment') || lowerMessage.includes('due') || lowerMessage.includes('deadline')) {
    if (upcomingTasks.length > 0) {
      const urgentTasks = upcomingTasks.filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
      });

      if (urgentTasks.length > 0) {
        const tasksList = urgentTasks.map(task => `"${task.title}" (due ${new Date(task.due_date!).toLocaleDateString()})`).join(', ');
        return `${userName}, you have ${urgentTasks.length} urgent task${urgentTasks.length > 1 ? 's' : ''} coming up: ${tasksList}. Would you like me to help you create a study plan or break these down into smaller steps?`;
      } else {
        const tasksList = upcomingTasks.slice(0, 3).map(task => task.title).join(', ');
        return `You have ${upcomingTasks.length} upcoming tasks: ${tasksList}. They're not urgent yet, but it's great that you're staying on top of things! Need help prioritizing or planning your approach?`;
      }
    } else {
      return `Great news ${userName}! You don't have any pending tasks at the moment. This is a perfect time to get ahead on your studies. Would you like me to help you create some study goals or review your recent notes?`;
    }
  }

  // Notes and study material queries
  if (lowerMessage.includes('note') || lowerMessage.includes('summarize') || lowerMessage.includes('study material')) {
    if (recentNotes.length > 0) {
      const notesList = recentNotes.map(note => note.title).join(', ');
      return `I can see you've been working on: ${notesList}. I can help you create summaries, generate flashcards, or extract key concepts from any of these. Which subject would you like to focus on, or would you like to upload new material to summarize?`;
    } else {
      return `${userName}, I don't see any notes in your account yet. I can help you summarize new material! You can upload PDFs, paste text, or just tell me about what you're studying and I'll help organize the information into digestible summaries and study aids.`;
    }
  }

  // Study plan queries
  if (lowerMessage.includes('study plan') || lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('quiz')) {
    const hasUpcomingExams = upcomingTasks.some(task => 
      task.title.toLowerCase().includes('exam') || 
      task.title.toLowerCase().includes('test') || 
      task.title.toLowerCase().includes('quiz')
    );

    if (hasUpcomingExams) {
      return `I can help you create a comprehensive study plan! Based on your upcoming tasks, it looks like you have some exams coming up. I can break down your study time, suggest focus areas, and create a day-by-day schedule. What subjects do you need to focus on most?`;
    } else {
      return `Creating a study plan is a great way to stay organized! I can help you set up a structured approach to your studies. Tell me about your subjects, any upcoming exams, and how much time you can dedicate to studying each day. I'll create a personalized plan for you.`;
    }
  }

  // General academic help
  if (lowerMessage.includes('explain') || lowerMessage.includes('help me understand') || lowerMessage.includes('how does')) {
    return `I'd be happy to explain any concept to you, ${userName}! I can break down complex topics into simple, easy-to-understand explanations with examples and analogies. What subject or topic would you like me to help you understand better?`;
  }

  // Motivation and study tips
  if (lowerMessage.includes('motivation') || lowerMessage.includes('procrastination') || lowerMessage.includes('focus') || lowerMessage.includes('stressed')) {
    return `I understand how challenging studying can be sometimes, ${userName}. Here are some strategies that can help: break large tasks into smaller chunks, use the Pomodoro technique (25 min study, 5 min break), find a quiet study environment, and celebrate small wins. Would you like me to help you create a specific action plan for what you're working on?`;
  }

  // Default response with personalization
  const personalizedContext = [];
  if (todayClasses.length > 0) personalizedContext.push(`${todayClasses.length} class${todayClasses.length > 1 ? 'es' : ''} today`);
  if (upcomingTasks.length > 0) personalizedContext.push(`${upcomingTasks.length} pending task${upcomingTasks.length > 1 ? 's' : ''}`);
  if (recentNotes.length > 0) personalizedContext.push(`${recentNotes.length} recent note${recentNotes.length > 1 ? 's' : ''}`);

  const contextText = personalizedContext.length > 0 
    ? ` I can see you have ${personalizedContext.join(', ')}.` 
    : '';

  return `Hi ${userName}! I'm here to help with all aspects of your academic journey.${contextText} I can assist with:

• 📅 Managing your schedule and deadlines
• 📝 Summarizing notes and creating study materials  
• 📚 Creating personalized study plans
• 🧠 Explaining complex concepts in simple terms
• ✅ Breaking down assignments into manageable tasks

What would you like to work on today?`;
} 