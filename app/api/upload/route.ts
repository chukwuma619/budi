import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if file is a PDF, DOCX, or PPTX
    if (file.type !== 'application/pdf' && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
        file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      return NextResponse.json({ error: 'Only PDF, DOCX, and PPTX files are supported' }, { status: 400 });
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size too large. Maximum 10MB allowed.' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';
    let pages = 0;

    // Extract text based on file type
    if (file.type === 'application/pdf') {
      // Extract text from PDF using dynamic import
      const pdf = (await import('pdf-parse')).default;
      const pdfData = await pdf(buffer);
      extractedText = pdfData.text;
      pages = pdfData.numpages;
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      // Extract text from DOCX using dynamic import
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
      pages = Math.ceil(extractedText.length / 2000); // Rough estimate: ~2000 chars per page
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      // Extract text from PPTX using dynamic import
      try {
        const pptx2json = await import('pptx2json');
        const pptxData = await pptx2json.toJson(buffer);
        const slides = pptxData.slides || [];
        
        // Extract text from all slides
        const slideTexts = slides.map((slide: any, index: number) => {
          const slideText = slide.texts ? slide.texts.join(' ') : '';
          return `Slide ${index + 1}: ${slideText}`;
        });
        
        extractedText = slideTexts.join('\n\n');
        pages = slides.length;
      } catch (error) {
        console.error('Error parsing PPTX:', error);
        throw new Error('Failed to parse PPTX file. The file might be corrupted or contain unsupported content.');
      }
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json({ error: 'Could not extract text from file. The file might be empty or corrupted.' }, { status: 400 });
    }

    // For now, return the extracted text directly without storing in database
    // This allows the chat functionality to work while we set up the database table
    return NextResponse.json({
      success: true,
      note: {
        id: Date.now().toString(),
        filename: file.name,
        content: extractedText.substring(0, 500) + '...', // Preview
        pages: pages,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, return empty array since we're not storing in database yet
    return NextResponse.json({ notes: [] });

  } catch (error) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 