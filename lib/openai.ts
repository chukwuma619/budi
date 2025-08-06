import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// System prompt for the AI assistant
const SYSTEM_PROMPT = `You are Budi, an AI study assistant designed to help students with their academic journey. You are friendly, encouraging, and knowledgeable about various academic subjects.

Your capabilities include:
- Helping with study plans and exam preparation
- Explaining complex concepts in simple terms
- Providing motivation and study tips
- Assisting with note-taking and summarization
- Helping with time management and scheduling
- Answering questions about various academic subjects
- Analyzing and answering questions about uploaded PDF notes and documents

When users ask questions about their uploaded notes, you can reference the content from their PDF files to provide accurate and contextual answers. You have access to the text content of their uploaded documents.

Always be encouraging and supportive. Use emojis occasionally to make responses more engaging. Keep responses concise but helpful. If you don't know something, be honest about it and suggest alternative resources.

Remember: You're here to help students succeed in their academic journey!`;

export interface ChatContext {
  userProfile?: any;
  userPreferences?: any;
  todayClasses?: any[];
  upcomingTasks?: any[];
  recentNotes?: any[];
  uploadedNotes?: any[];
  userId: string;
}

export async function generateAIResponse(
  message: string, 
  context: ChatContext
): Promise<string> {
  try {
    // Build context-aware prompt
    const contextInfo = buildContextInfo(context);
    
    // Check if the message is asking about uploaded notes
    const isAskingAboutNotes = /note|document|pdf|file|upload|content|read|analyze/i.test(message);
    
    let userMessage = message;
    let systemPrompt = SYSTEM_PROMPT + '\n\n' + contextInfo;
    
    // If asking about notes and user has uploaded notes, include relevant content
    if (isAskingAboutNotes && context.uploadedNotes && context.uploadedNotes.length > 0) {
      const relevantNotes = context.uploadedNotes.slice(0, 2); // Limit to 2 most recent notes
      const notesContent = relevantNotes.map(note => 
        `Document: ${note.filename}\nContent: ${note.content.substring(0, 2000)}...`
      ).join('\n\n');
      
      systemPrompt += `\n\nUser's uploaded documents:\n${notesContent}`;
    }
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 800, // Increased for longer responses with document content
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || 'I apologize, but I\'m having trouble generating a response right now. Please try again.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'I apologize, but I\'m experiencing technical difficulties right now. Please try again in a moment.';
  }
}

export async function generateAISummary(
  text: string, 
  title: string
): Promise<{ summary: string; keyPoints: string[]; flashcards: Array<{ question: string; answer: string }> }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert at creating study materials. Create a concise summary, key points, and flashcards for the given text. 
          
          Format your response as JSON with the following structure:
          {
            "summary": "A concise 2-3 sentence summary",
            "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
            "flashcards": [
              {"question": "Question 1", "answer": "Answer 1"},
              {"question": "Question 2", "answer": "Answer 2"}
            ]
          }
          
          Keep the summary under 150 words, include 3-5 key points, and create 2-4 flashcards.`
        },
        {
          role: 'user',
          content: `Please create study materials for this text titled "${title}":\n\n${text}`
        }
      ],
      max_tokens: 800,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (response) {
      try {
        const parsed = JSON.parse(response);
        return {
          summary: parsed.summary || 'Summary not available',
          keyPoints: parsed.keyPoints || [],
          flashcards: parsed.flashcards || []
        };
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        return createFallbackSummary(text, title);
      }
    }
    
    return createFallbackSummary(text, title);
  } catch (error) {
    console.error('OpenAI API error for summary:', error);
    return createFallbackSummary(text, title);
  }
}

function buildContextInfo(context: ChatContext): string {
  const info = [];
  
  if (context.userProfile?.full_name) {
    info.push(`Student name: ${context.userProfile.full_name}`);
  }
  
  if (context.todayClasses && context.todayClasses.length > 0) {
    const classes = context.todayClasses.map(c => c.subject).join(', ');
    info.push(`Today's classes: ${classes}`);
  }
  
  if (context.upcomingTasks && context.upcomingTasks.length > 0) {
    const urgentTasks = context.upcomingTasks
      .filter(task => {
        if (!task.due_date) return false;
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 3;
      })
      .map(task => task.title);
    
    if (urgentTasks.length > 0) {
      info.push(`Urgent tasks: ${urgentTasks.join(', ')}`);
    }
  }
  
  if (context.recentNotes && context.recentNotes.length > 0) {
    const notes = context.recentNotes.map(note => note.title).join(', ');
    info.push(`Recent notes: ${notes}`);
  }
  
  if (context.uploadedNotes && context.uploadedNotes.length > 0) {
    const uploadedNoteNames = context.uploadedNotes.map(note => note.filename).join(', ');
    info.push(`Uploaded PDF notes: ${uploadedNoteNames}`);
  }
  
  return info.length > 0 ? `Context: ${info.join(' | ')}` : '';
}

function createFallbackSummary(text: string, title: string) {
  const words = text.split(' ').filter(word => word.trim().length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let summary = '';
  if (words.length > 100) {
    const firstSentences = sentences.slice(0, 3).join('. ');
    const lastSentence = sentences.length > 3 ? '. ' + sentences[sentences.length - 1] : '';
    summary = firstSentences + lastSentence + '.';
  } else {
    summary = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');
  }

  const keyPoints = [];
  if (sentences.length >= 1) keyPoints.push(`Main concept: ${sentences[0].trim()}`);
  if (sentences.length >= 2) keyPoints.push(`Important detail: ${sentences[1].trim()}`);
  if (sentences.length >= 3) keyPoints.push(`Additional point: ${sentences[2].trim()}`);

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

  return { summary, keyPoints, flashcards };
} 