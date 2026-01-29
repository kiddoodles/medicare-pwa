-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create medication frequency enum
CREATE TYPE public.medication_frequency AS ENUM ('once_daily', 'twice_daily', 'three_times_daily', 'four_times_daily', 'as_needed', 'custom');

-- Create medication log status enum
CREATE TYPE public.medication_log_status AS ENUM ('taken', 'missed', 'skipped', 'pending');

-- Create badge type enum
CREATE TYPE public.badge_type AS ENUM ('first_dose', 'week_streak', 'month_streak', 'perfect_week', 'perfect_month', 'hundred_doses', 'early_bird', 'night_owl');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  full_name TEXT,
  date_of_birth DATE,
  medical_history TEXT,
  allergies TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  healthcare_provider TEXT,
  photo_url TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medications table
CREATE TABLE public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency public.medication_frequency NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  reminder_times TEXT[] NOT NULL,
  photo_url TEXT,
  notes TEXT,
  remaining_quantity INTEGER,
  refill_reminder_threshold INTEGER DEFAULT 7,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_info table (reference data)
CREATE TABLE public.medication_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_name TEXT UNIQUE NOT NULL,
  uses TEXT,
  side_effects TEXT,
  contraindications TEXT,
  drug_interactions TEXT,
  dosage_recommendations TEXT,
  storage_instructions TEXT,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medication_logs table
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ NOT NULL,
  taken_time TIMESTAMPTZ,
  status public.medication_log_status NOT NULL DEFAULT 'pending'::public.medication_log_status,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create health_journal table
CREATE TABLE public.health_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  symptoms TEXT,
  mood TEXT,
  wellness_score INTEGER CHECK (wellness_score >= 1 AND wellness_score <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_type public.badge_type NOT NULL,
  earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  streak_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type, earned_date)
);

-- Create caregivers table
CREATE TABLE public.caregivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  caregiver_email TEXT NOT NULL,
  caregiver_name TEXT,
  access_level TEXT DEFAULT 'view',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, caregiver_email)
);

-- Create settings table
CREATE TABLE public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  notification_frequency TEXT DEFAULT 'all',
  snooze_duration INTEGER DEFAULT 10,
  ringtone TEXT DEFAULT 'default',
  ringtone_volume INTEGER DEFAULT 80,
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_active ON public.medications(active);
CREATE INDEX idx_medication_logs_user_id ON public.medication_logs(user_id);
CREATE INDEX idx_medication_logs_medication_id ON public.medication_logs(medication_id);
CREATE INDEX idx_medication_logs_scheduled_time ON public.medication_logs(scheduled_time);
CREATE INDEX idx_medication_logs_status ON public.medication_logs(status);
CREATE INDEX idx_health_journal_user_id ON public.health_journal(user_id);
CREATE INDEX idx_health_journal_entry_date ON public.health_journal(entry_date);
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_caregivers_user_id ON public.caregivers(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_journal_updated_at BEFORE UPDATE ON public.health_journal
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();