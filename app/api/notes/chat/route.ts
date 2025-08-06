import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateAIResponse } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { message, userId, uploadedNotes } = await request.json();

    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message and userId are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isStudyRequest = /practice|question|quiz|exam|test|flashcard|summary|key point/i.test(message);
    const isNoteQuestion = /note|document|pdf|content|what|explain|how|why/i.test(message);

    let systemPrompt = `You are Budi, an AI study assistant specialized in helping students with their academic notes and study materials.

Your capabilities include:
- Analyzing uploaded PDF notes and documents
- Generating practice questions and quizzes
- Creating flashcards for study
- Summarizing key points from notes
- Explaining complex concepts from study materials
- Providing study tips and strategies

When users ask about their uploaded notes, you can reference the content from their PDF files to provide accurate and contextual answers. You have access to the text content of their uploaded documents.

For study material requests:
- Generate relevant practice questions with answers
- Create flashcards with clear questions and answers
- Provide concise summaries of key concepts
- Include explanations that help with understanding

Always be encouraging and supportive. Use emojis occasionally to make responses more engaging. Keep responses concise but helpful.`;

    if ((isStudyRequest || isNoteQuestion) && uploadedNotes && uploadedNotes.length > 0) {
      const relevantNotes = uploadedNotes.slice(0, 2); // Limit to 2 documents to avoid token limits
      const notesContent = relevantNotes.map((note: any) =>
        `Document: ${note.filename}\nContent: ${note.content.substring(0, 3000)}...`
      ).join('\n\n');

      systemPrompt += `\n\nUser's uploaded documents:\n${notesContent}`;
    }

    const aiResponse = await generateAIResponse(message, {
      userProfile: null,
      userPreferences: null,
      todayClasses: [],
      upcomingTasks: [],
      recentNotes: [],
      uploadedNotes: uploadedNotes || [],
      userId
    });

    return NextResponse.json({ response: aiResponse });

  } catch (error) {
    console.error('Notes chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 