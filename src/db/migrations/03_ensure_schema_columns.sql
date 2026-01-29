-- Add columns if they are missing to match the expected schema
-- This handles the case where the DB might be missing these fields despite user expectations

alter table public.medical_history 
  add column if not exists drug_allergies text[] default '{}',
  add column if not exists food_allergies text[] default '{}',
  add column if not exists clinical_notes text;

-- Ensure RLS allows access to these new columns (implicit in "for all" policies, but good measure)
-- (No specific action needed for generic table policies)

-- Verify user_id is unique for onConflict support
-- If the unique constraint is missing (unlikely if script 01 ran), adding it here would be complex without checking existence.
-- We assume 01 ran.
