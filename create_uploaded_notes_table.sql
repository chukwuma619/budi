-- Create uploaded_notes table
CREATE TABLE IF NOT EXISTS uploaded_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  pages INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_uploaded_notes_user_id ON uploaded_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_notes_created_at ON uploaded_notes(created_at DESC);

-- Enable RLS
ALTER TABLE uploaded_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own uploaded notes" ON uploaded_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploaded notes" ON uploaded_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploaded notes" ON uploaded_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploaded notes" ON uploaded_notes
  FOR DELETE USING (auth.uid() = user_id); 