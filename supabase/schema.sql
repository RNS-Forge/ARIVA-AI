-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User settings table for API keys
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('gemini', 'grok')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Personality training data
CREATE TABLE IF NOT EXISTS personality_training (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Clone progress tracking
CREATE TABLE IF NOT EXISTS clone_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  personality_percentage INTEGER DEFAULT 0 CHECK (personality_percentage >= 0 AND personality_percentage <= 100),
  voice_percentage INTEGER DEFAULT 0 CHECK (voice_percentage >= 0 AND voice_percentage <= 100),
  knowledge_percentage INTEGER DEFAULT 0 CHECK (knowledge_percentage >= 0 AND knowledge_percentage <= 100),
  overall_percentage INTEGER DEFAULT 0 CHECK (overall_percentage >= 0 AND overall_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id)
);

-- Voice samples
CREATE TABLE IF NOT EXISTS voice_samples (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Social media links
CREATE TABLE IF NOT EXISTS social_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'github', 'instagram', 'youtube', 'other')),
  url TEXT NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, platform)
);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_personality_training_user_id ON personality_training(user_id);
CREATE INDEX IF NOT EXISTS idx_clone_progress_user_id ON clone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_samples_user_id ON voice_samples(user_id);
CREATE INDEX IF NOT EXISTS idx_social_links_user_id ON social_links(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE clone_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON user_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own training data" ON personality_training
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own training data" ON personality_training
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own training data" ON personality_training
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own training data" ON personality_training
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON clone_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON clone_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON clone_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own voice samples" ON voice_samples
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own voice samples" ON voice_samples
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own voice samples" ON voice_samples
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own social links" ON social_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own social links" ON social_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own social links" ON social_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own social links" ON social_links
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own chat history" ON chat_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat history" ON chat_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat history" ON chat_history
  FOR DELETE USING (auth.uid() = user_id);
