-- Create medical_history table
create table if not exists public.medical_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null unique,
  chronic_conditions text[] default '{}',
  current_medications jsonb[] default '{}',
  past_medications jsonb[] default '{}',
  allergies jsonb default '{"drug": [], "food": []}'::jsonb,
  family_history text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.medical_history enable row level security;

-- Create policies
create policy "Users can view their own medical history"
  on public.medical_history for select
  using (auth.uid() = user_id);

create policy "Users can insert/update their own medical history"
  on public.medical_history for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
