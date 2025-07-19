//@ts-nocheck
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateAISummary } from '@/lib/database-helpers';

// GET - Fetch user's notes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    // Parse JSON fields
    const processedNotes = data?.map(note => ({
      ...note,
      key_points: note.key_points ? JSON.parse(note.key_points) : null,
      flashcards: note.flashcards ? JSON.parse(note.flashcards) : null,
    })) || [];

    return NextResponse.json({ notes: processedNotes });

  } catch (error) {
    console.error('Notes API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new note with AI summarization
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      title, 
      original_text, 
      file_name, 
      file_size, 
      upload_type,
      generate_summary = true 
    } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    let summary = null;
    let key_points = null;
    let flashcards = null;

    // Generate AI summary if requested and original_text is provided
    if (generate_summary && original_text) {
      try {
        const aiResult = await generateAISummary(original_text, title);
        summary = aiResult.summary;
        key_points = aiResult.keyPoints;
        flashcards = aiResult.flashcards;
      } catch (error) {
        console.error('Error generating AI summary:', error);
        // Continue without summary if AI fails
      }
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title,
        original_text: original_text || null,
        summary,
        key_points: key_points ? JSON.stringify(key_points) : null,
        flashcards: flashcards ? JSON.stringify(flashcards) : null,
        file_name: file_name || null,
        file_size: file_size || null,
        upload_type: upload_type || 'text',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json(
        { error: 'Failed to create note' },
        { status: 500 }
      );
    }

    // Parse JSON fields for response
    const processedNote = {
      ...data,
      key_points: data.key_points ? JSON.parse(data.key_points) : null,
      flashcards: data.flashcards ? JSON.parse(data.flashcards) : null,
    };

    return NextResponse.json({ note: processedNote });

  } catch (error) {
    console.error('Note creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update note
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { 
      id, 
      title, 
      original_text, 
      summary, 
      key_points, 
      flashcards,
      file_name, 
      file_size, 
      upload_type 
    } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (original_text !== undefined) updateData.original_text = original_text;
    if (summary !== undefined) updateData.summary = summary;
    if (key_points !== undefined) updateData.key_points = JSON.stringify(key_points);
    if (flashcards !== undefined) updateData.flashcards = JSON.stringify(flashcards);
    if (file_name !== undefined) updateData.file_name = file_name;
    if (file_size !== undefined) updateData.file_size = file_size;
    if (upload_type !== undefined) updateData.upload_type = upload_type;

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating note:', error);
      return NextResponse.json(
        { error: 'Failed to update note' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Note not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields for response
    const processedNote = {
      ...data,
      key_points: data.key_points ? JSON.parse(data.key_points) : null,
      flashcards: data.flashcards ? JSON.parse(data.flashcards) : null,
    };

    return NextResponse.json({ note: processedNote });

  } catch (error) {
    console.error('Note update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete note
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting note:', error);
      return NextResponse.json(
        { error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Note deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 