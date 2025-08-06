-- Create study_plans table
CREATE TABLE IF NOT EXISTS study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  hours_per_day INTEGER NOT NULL CHECK (hours_per_day > 0 AND hours_per_day <= 24),
  total_days INTEGER NOT NULL CHECK (total_days > 0),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_days table
CREATE TABLE IF NOT EXISTS study_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  study_plan_id UUID NOT NULL REFERENCES study_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number > 0),
  date DATE NOT NULL,
  total_hours INTEGER NOT NULL CHECK (total_hours > 0),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(study_plan_id, day_number)
);

-- Create study_tasks table
CREATE TABLE IF NOT EXISTS study_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  study_day_id UUID NOT NULL REFERENCES study_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL CHECK (duration > 0),
  task_type TEXT CHECK (task_type IN ('reading', 'practice', 'review', 'quiz')),
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_plans_user_id ON study_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_study_plans_created_at ON study_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_days_study_plan_id ON study_days(study_plan_id);
CREATE INDEX IF NOT EXISTS idx_study_days_date ON study_days(date);
CREATE INDEX IF NOT EXISTS idx_study_tasks_study_day_id ON study_tasks(study_day_id);
CREATE INDEX IF NOT EXISTS idx_study_tasks_completed ON study_tasks(completed);

-- Enable Row Level Security
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_plans
CREATE POLICY "Users can view their own study plans" ON study_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study plans" ON study_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study plans" ON study_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study plans" ON study_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for study_days
CREATE POLICY "Users can view their own study days" ON study_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = study_days.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own study days" ON study_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = study_days.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own study days" ON study_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = study_days.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own study days" ON study_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM study_plans 
      WHERE study_plans.id = study_days.study_plan_id 
      AND study_plans.user_id = auth.uid()
    )
  );

-- Create RLS policies for study_tasks
CREATE POLICY "Users can view their own study tasks" ON study_tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM study_days 
      JOIN study_plans ON study_plans.id = study_days.study_plan_id
      WHERE study_days.id = study_tasks.study_day_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own study tasks" ON study_tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM study_days 
      JOIN study_plans ON study_plans.id = study_days.study_plan_id
      WHERE study_days.id = study_tasks.study_day_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own study tasks" ON study_tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM study_days 
      JOIN study_plans ON study_plans.id = study_days.study_plan_id
      WHERE study_days.id = study_tasks.study_day_id 
      AND study_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own study tasks" ON study_tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM study_days 
      JOIN study_plans ON study_plans.id = study_days.study_plan_id
      WHERE study_days.id = study_tasks.study_day_id 
      AND study_plans.user_id = auth.uid()
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_study_plans_updated_at 
  BEFORE UPDATE ON study_plans 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_days_updated_at 
  BEFORE UPDATE ON study_days 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_study_tasks_updated_at 
  BEFORE UPDATE ON study_tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 