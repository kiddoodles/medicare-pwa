-- Add INSERT policy for user_settings to allow users to create their own settings if missing
-- This fixes the issue where users created before the trigger existed or if the trigger failed cannot save settings.

CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
