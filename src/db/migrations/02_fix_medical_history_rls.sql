-- Ensure user_id has default auth.uid()
alter table public.medical_history 
  alter column user_id set default auth.uid();

-- Re-apply RLS policies to be sure (idempotent-ish check not needed if we just replace/add)
-- But standard practice: drop if exists to ensure clean state or just add if missing.
-- Since the user said "Ensure RLS policies exist", I will drop and recreate to be safe and strictly follow requirements.

drop policy if exists "Users can view their own medical history" on public.medical_history;
drop policy if exists "Users can insert/update their own medical history" on public.medical_history;

create policy "Users can view their own medical history"
  on public.medical_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own medical history"
  on public.medical_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update own medical history"
  on public.medical_history for update
  using (auth.uid() = user_id);
  
-- Note: The previous policy was "for all", splitting it is safer and clearer.
