# Budi - AI Study Assistant

Budi is an intelligent AI-powered study assistant designed to help students manage their academic journey. Built with Next.js, Supabase, and OpenAI, Budi provides personalized study plans, note summarization, task management, and more.

## Features

- 🤖 **AI-Powered Chat**: Intelligent responses using OpenAI's GPT models
- 📚 **Study Plan Creation**: Personalized study plans with daily tasks
- 📝 **Note Summarization**: AI-generated summaries and flashcards
- 📅 **Schedule Management**: Class scheduling and reminders
- ✅ **Task Tracking**: Assignment and homework management
- 📊 **Progress Analytics**: Study session tracking and insights
- 🎯 **Smart Recommendations**: Context-aware suggestions

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o-mini
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 20+ 
- pnpm (recommended) or npm
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd budi
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the database migrations (see Database Setup section)
   - Copy your project URL and anon key to `.env.local`

5. **Get OpenAI API Key**
   - Sign up at [OpenAI](https://platform.openai.com)
   - Create an API key
   - Add it to your `.env.local` file

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

The application uses Supabase as its database. You'll need to set up the following tables:

### Required Tables

1. **users** (handled by Supabase Auth)
2. **user_profiles**
3. **user_preferences**
4. **schedule_items**
5. **notes**
6. **study_plans**
7. **study_days**
8. **study_tasks**
9. **tasks**
10. **study_sessions**
11. **chat_messages**

### Quick Setup

1. In your Supabase dashboard, go to the SQL Editor
2. Run the following SQL to create the necessary tables:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  university TEXT,
  major TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE user_preferences (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT true,
  study_reminders BOOLEAN DEFAULT true,
  smart_reminders BOOLEAN DEFAULT true,
  assignment_alerts BOOLEAN DEFAULT true,
  weekly_summary BOOLEAN DEFAULT true,
  progress_insights BOOLEAN DEFAULT true,
  ai_personality TEXT DEFAULT 'friendly',
  response_length TEXT DEFAULT 'medium',
  reminder_time INTEGER DEFAULT 9,
  auto_schedule BOOLEAN DEFAULT false,
  study_suggestions BOOLEAN DEFAULT true,
  analytics_consent BOOLEAN DEFAULT true,
  data_sharing_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create schedule_items table
CREATE TABLE schedule_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  room TEXT,
  type TEXT DEFAULT 'class',
  color TEXT DEFAULT '#3B82F6',
  notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  original_text TEXT,
  summary TEXT,
  key_points TEXT[],
  flashcards JSONB,
  file_name TEXT,
  file_size INTEGER,
  upload_type TEXT DEFAULT 'text',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_plans table
CREATE TABLE study_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  exam_date DATE NOT NULL,
  hours_per_day INTEGER DEFAULT 2,
  total_days INTEGER,
  topics TEXT,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_days table
CREATE TABLE study_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  study_plan_id UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  total_hours INTEGER NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_tasks table
CREATE TABLE study_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  study_day_id UUID REFERENCES study_days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration INTEGER NOT NULL,
  task_type TEXT DEFAULT 'reading',
  priority TEXT DEFAULT 'medium',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  due_date DATE,
  priority TEXT DEFAULT 'medium',
  estimated_hours INTEGER DEFAULT 2,
  actual_hours INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create study_sessions table
CREATE TABLE study_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  duration INTEGER NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  context JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own schedule items" ON schedule_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own schedule items" ON schedule_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own schedule items" ON schedule_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own schedule items" ON schedule_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes" ON notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON notes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study plans" ON study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study plans" ON study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study plans" ON study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study plans" ON study_plans FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study days" ON study_days FOR SELECT USING (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = study_plan_id));
CREATE POLICY "Users can insert own study days" ON study_days FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = study_plan_id));
CREATE POLICY "Users can update own study days" ON study_days FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = study_plan_id));
CREATE POLICY "Users can delete own study days" ON study_days FOR DELETE USING (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = study_plan_id));

CREATE POLICY "Users can view own study tasks" ON study_tasks FOR SELECT USING (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = (SELECT study_plan_id FROM study_days WHERE id = study_day_id)));
CREATE POLICY "Users can insert own study tasks" ON study_tasks FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = (SELECT study_plan_id FROM study_days WHERE id = study_day_id)));
CREATE POLICY "Users can update own study tasks" ON study_tasks FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = (SELECT study_plan_id FROM study_days WHERE id = study_day_id)));
CREATE POLICY "Users can delete own study tasks" ON study_tasks FOR DELETE USING (auth.uid() IN (SELECT user_id FROM study_plans WHERE id = (SELECT study_plan_id FROM study_days WHERE id = study_day_id)));

CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own study sessions" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own study sessions" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study sessions" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study sessions" ON study_sessions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat messages" ON chat_messages FOR DELETE USING (auth.uid() = user_id);
```

## Usage

### Chat with Budi

Budi can help you with various academic tasks:

- **Schedule Management**: "Set a reminder for my Math quiz tomorrow at 2 PM"
- **Note Summarization**: "Summarize this: [your text here]"
- **Study Plans**: "Create a study plan for Biology exam on 2024-12-15"
- **Task Creation**: "Add a task: Write History essay due tomorrow"
- **Study Logging**: "I studied Math for 2 hours today"

### Features Overview

1. **Dashboard**: Overview of your academic progress
2. **Chat**: AI-powered conversation with Budi
3. **Schedule**: Manage classes and appointments
4. **Notes**: Create and organize study materials
5. **Study Plans**: Structured exam preparation
6. **Progress**: Track study sessions and task completion
7. **Settings**: Customize your experience

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/budi/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## Acknowledgments

- [OpenAI](https://openai.com) for providing the AI capabilities
- [Supabase](https://supabase.com) for the backend infrastructure
- [Next.js](https://nextjs.org) for the React framework
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Radix UI](https://www.radix-ui.com) for accessible components
