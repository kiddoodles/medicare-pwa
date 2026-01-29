-- Add medication columns if they are missing
-- The error "Could not find the 'current_medications' column" suggests they are missing from the active schema cache or table.

alter table public.medical_history 
  add column if not exists current_medications jsonb default '[]'::jsonb,
  add column if not exists past_medications jsonb default '[]'::jsonb;

-- Ensure RLS policies are refreshed (notify PostgREST)
notify pgrst, 'reload config';
