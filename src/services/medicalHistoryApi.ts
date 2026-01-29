import { supabase } from '@/lib/supabaseClient';
import type { MedicalHistory } from '@/types';

export const medicalHistoryApi = {
    // -------------------------
    // Get medical history
    // -------------------------
    getHistory: async (userId: string): Promise<MedicalHistory | null> => {
        const { data, error } = await supabase
            .from('medical_history')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching medical history:', error);
            throw error;
        }

        return data ?? null;
    },

    // -------------------------
    // Upsert medical history
    // -------------------------
    upsertHistory: async (historyData: Partial<MedicalHistory>): Promise<MedicalHistory> => {
        try {
            // Get current user to ensure we have the correct user_id for the upsert constraint
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No authenticated user');

            // Strip existing user_id from input (trust source of truth from auth)
            // But RE-ADD it to the payload so Supabase knows what to conflict on
            const { user_id: _inputUid, ...rest } = historyData;

            // Prepare payload
            const payload: any = {
                ...rest,
                user_id: user.id // Explicitly set user_id from auth
            };

            // Note: Frontend now sends flat drug_allergies/food_allergies directly.
            // No need to map 'allergies' object anymore.

            console.log('Upserting history payload:', payload);

            const { data, error } = await supabase
                .from('medical_history')
                .upsert(payload, { onConflict: 'user_id' })
                .select()
                .single();

            if (error) {
                console.error('Supabase upsert error:', error);
                throw error;
            }
            return data;
        } catch (error) {
            console.error('Error saving medical history:', error);
            throw error;
        }
    }
};