import { supabase } from '@/lib/supabaseClient';
import type {
  Profile,
  Medication,
  MedicationInfo,
  MedicationLog,
  MedicationLogWithDetails,
  HealthJournalEntry,
  Achievement,
  Caregiver,
  UserSettings,
} from '@/types';

import type { DashboardData } from '@/types';

// Profile API
export const profileApi = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) throw error;
  },
};

// Medication API
export const medicationApi = {
  async getMedications(userId: string): Promise<Medication[]> {
    const cacheKey = `medications_${userId}`;

    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
      return [];
    }
    return [];
  },

  async getMedication(medicationId: string): Promise<Medication | null> {
    const cacheKey = `medication_${medicationId}`;
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('id', medicationId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.error('Error fetching medication:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
      return null;
    }
    return null;
  },

  async createMedication(medication: Omit<Medication, 'id' | 'created_at' | 'updated_at'>): Promise<Medication | null> {
    const { data, error } = await supabase
      .from('medications')
      .insert(medication)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateMedication(medicationId: string, updates: Partial<Medication>): Promise<Medication | null> {
    const { data, error } = await supabase
      .from('medications')
      .update(updates)
      .eq('id', medicationId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async deleteMedication(medicationId: string): Promise<void> {
    const { error } = await supabase
      .from('medications')
      .update({ active: false })
      .eq('id', medicationId);

    if (error) throw error;
  },

  async decrementQuantity(medicationId: string): Promise<void> {
    const { data: med } = await supabase
      .from('medications')
      .select('remaining_quantity')
      .eq('id', medicationId)
      .maybeSingle();

    if (med?.remaining_quantity && med.remaining_quantity > 0) {
      await supabase
        .from('medications')
        .update({ remaining_quantity: med.remaining_quantity - 1 })
        .eq('id', medicationId);
    }
  },
};

// Medication Info API
export const medicationInfoApi = {
  async searchMedications(query: string): Promise<MedicationInfo[]> {
    const { data, error } = await supabase
      .from('medication_info')
      .select('*')
      .ilike('medication_name', `%${query}%`)
      .order('medication_name')
      .limit(10);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getMedicationInfo(medicationName: string): Promise<MedicationInfo | null> {
    const cacheKey = `med_info_${medicationName.toLowerCase()}`;

    // Try to fetch from Supabase
    try {
      const { data, error } = await supabase
        .from('medication_info')
        .select('*')
        .ilike('medication_name', medicationName)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Cache the successful result
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to cache medication info:', e);
        }
        return data;
      }
    } catch (error) {
      console.error('Error fetching medication info:', error);
      // Fallback to cache
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          console.log('Serving medication info from cache');
          return JSON.parse(cached);
        }
      } catch (e) {
        console.warn('Failed to read from cache:', e);
      }
      // If we're here, we really don't have the data (neither Supabase nor cache)
      // We explicitly return null if we can't find it
      return null;
    }

    // If no data from Supabase and no error (just not found), check if we have it cached (unlikely but possible if offline/online sync issues)
    // Actually, if data is null (not found in DB), we might not want to return cached data as it might be stale or wrong? 
    // But for "offline problem", usually we want to return what we have.
    // However, the logic above returns data if found. If not found in DB (data is null), we return null.

    return null;
  },

  async getAllMedicationInfo(): Promise<MedicationInfo[]> {
    const { data, error } = await supabase
      .from('medication_info')
      .select('*')
      .order('medication_name');

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },
};

// Medication Log API
export const medicationLogApi = {
  async getLogs(userId: string, startDate?: string, endDate?: string): Promise<MedicationLog[]> {
    let query = supabase
      .from('medication_logs')
      .select('*')
      .eq('user_id', userId);

    if (startDate) {
      query = query.gte('scheduled_time', startDate);
    }
    if (endDate) {
      query = query.lte('scheduled_time', endDate);
    }

    const { data, error } = await query.order('scheduled_time', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getLogsByMedication(medicationId: string): Promise<MedicationLog[]> {
    const { data, error } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('medication_id', medicationId)
      .order('scheduled_time', { ascending: false })
      .limit(30);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getTodayLogs(userId: string): Promise<MedicationLogWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `todayLogs_${userId}_${today}`;

    try {
      // 1. Get Logs
      const { data: logs, error: logsError } = await supabase
        .from('medication_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('scheduled_time', `${today}T00:00:00`)
        .lte('scheduled_time', `${today}T23:59:59`)
        .order('scheduled_time');

      if (logsError) throw logsError;
      if (!logs || logs.length === 0) {
        // Even empty logs should be cached to avoid spinner if we know there are none
        localStorage.setItem(cacheKey, JSON.stringify([]));
        return [];
      }

      // 2. Get Medications
      const medIds = [...new Set(logs.map(log => log.medication_id))];
      const { data: meds, error: medsError } = await supabase
        .from('medications')
        .select('id, name, dosage, photo_url')
        .in('id', medIds);

      if (medsError) throw medsError;

      // 3. Merge
      const medsMap = new Map(meds?.map(m => [m.id, m]));

      const result = logs.map(log => ({
        ...log,
        medication: medsMap.get(log.medication_id)
      }));

      localStorage.setItem(cacheKey, JSON.stringify(result));
      return result;

    } catch (error) {
      console.error('Error fetching today logs:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
      return [];
    }
  },

  async createLog(log: Omit<MedicationLog, 'id' | 'created_at'>): Promise<MedicationLog> {
    const { data, error } = await supabase
      .from('medication_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateLog(logId: string, updates: Partial<MedicationLog>): Promise<MedicationLog> {
    const { data, error } = await supabase
      .from('medication_logs')
      .update(updates)
      .eq('id', logId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async markAsTaken(logId: string, medicationId: string): Promise<void> {
    const { error } = await supabase
      .from('medication_logs')
      .update({
        status: 'taken',
        taken_time: new Date().toISOString(),
      })
      .eq('id', logId);

    if (error) throw error;

    await medicationApi.decrementQuantity(medicationId);
  },

  async markAsSkipped(logId: string): Promise<void> {
    const { error } = await supabase
      .from('medication_logs')
      .update({ status: 'skipped' })
      .eq('id', logId);

    if (error) throw error;
  },
};

// Health Journal API
export const healthJournalApi = {
  async getEntries(userId: string, limit = 30): Promise<HealthJournalEntry[]> {
    const { data, error } = await supabase
      .from('health_journal')
      .select('*')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async getEntry(userId: string, date: string): Promise<HealthJournalEntry | null> {
    const { data, error } = await supabase
      .from('health_journal')
      .select('*')
      .eq('user_id', userId)
      .eq('entry_date', date)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createEntry(entry: Omit<HealthJournalEntry, 'id' | 'created_at' | 'updated_at'>): Promise<HealthJournalEntry> {
    const { data, error } = await supabase
      .from('health_journal')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEntry(entryId: string, updates: Partial<HealthJournalEntry>): Promise<HealthJournalEntry> {
    const { data, error } = await supabase
      .from('health_journal')
      .update(updates)
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEntry(entryId: string): Promise<void> {
    const { error } = await supabase
      .from('health_journal')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
  },
};

// Achievement API
export const achievementApi = {
  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .eq('user_id', userId)
      .order('earned_date', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async createAchievement(achievement: Omit<Achievement, 'id' | 'created_at'>): Promise<Achievement> {
    const { data, error } = await supabase
      .from('achievements')
      .insert(achievement)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStreak(userId: string, badgeType: string, streakCount: number): Promise<void> {
    const { error } = await supabase
      .from('achievements')
      .update({ streak_count: streakCount })
      .eq('user_id', userId)
      .eq('badge_type', badgeType);

    if (error) throw error;
  },
};

// Caregiver API
export const caregiverApi = {
  async getCaregivers(userId: string): Promise<Caregiver[]> {
    const { data, error } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return Array.isArray(data) ? data : [];
  },

  async addCaregiver(caregiver: Omit<Caregiver, 'id' | 'created_at'>): Promise<Caregiver> {
    const { data, error } = await supabase
      .from('caregivers')
      .insert(caregiver)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeCaregiver(caregiverId: string): Promise<void> {
    const { error } = await supabase
      .from('caregivers')
      .delete()
      .eq('id', caregiverId);

    if (error) throw error;
  },

  async approveCaregiver(caregiverId: string): Promise<void> {
    const { error } = await supabase
      .from('caregivers')
      .update({ approved: true })
      .eq('id', caregiverId);

    if (error) throw error;
  },
};

// Settings API
// Settings API
export const settingsApi = {
  async getSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error("Supabase error in getSettings:", error);
      // We don't throw here to allow UI to handle 'no settings' gracefully if it's just a 404-like scenario, 
      // but 'maybeSingle' shouldn't error on 404. Real errors should be logged.
      return null;
    }
    return data;
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    console.log("Saving settings for user:", userId, updates);

    // Explicitly construct the payload to ensure user_id is present for upsert
    // and to match the schema requirements strictly.
    const payload = {
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_settings')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error("Supabase error in updateSettings:", error);
      throw error; // Re-throw so UI can show the message
    }

    return data;
  },
};

// Dashboard API
export const dashboardApi = {
  async getDashboardData(userId: string): Promise<DashboardData> {
    const cacheKey = `dashboard_data_${userId}`;

    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [medications, todayLogs, recentLogs, achievements] = await Promise.all([
        medicationApi.getMedications(userId),
        medicationLogApi.getTodayLogs(userId),
        medicationLogApi.getLogs(userId, thirtyDaysAgo),
        achievementApi.getAchievements(userId),
      ]);

      const takenCount = recentLogs.filter(log => log.status === 'taken').length;
      const missedCount = recentLogs.filter(log => log.status === 'missed').length;
      const skippedCount = recentLogs.filter(log => log.status === 'skipped').length;
      const totalCount = recentLogs.length;

      const adherenceRate = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;

      let currentStreak = 0;
      const sortedLogs = [...recentLogs].sort((a, b) =>
        new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
      );

      for (const log of sortedLogs) {
        if (log.status === 'taken') {
          currentStreak++;
        } else if (log.status === 'missed') {
          break;
        }
      }

      // todayLogs already has joined 'medication' data if using getTodayLogs
      const upcomingDoses = todayLogs
        .filter(log => log.status === 'pending')
        .slice(0, 5);

      const result: DashboardData = {
        today_medications: medications.map(med => ({
          ...med,
          logs: todayLogs.filter(log => log.medication_id === med.id),
        })),
        upcoming_doses: upcomingDoses,
        adherence_stats: {
          total_doses: totalCount,
          taken_doses: takenCount,
          missed_doses: missedCount,
          skipped_doses: skippedCount,
          adherence_rate: Math.round(adherenceRate),
          current_streak: currentStreak,
          longest_streak: currentStreak,
        },
        recent_achievements: achievements.slice(0, 5),
      };

      localStorage.setItem(cacheKey, JSON.stringify(result));
      return result;

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error; // If no cache, we have to throw
    }
  },
};
// Image Upload API
export const imageApi = {
  async uploadImage(file: File, bucket = 'app-90t1jgnsbt35_medication_images'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  async deleteImage(url: string, bucket = 'app-90t1jgnsbt35_medication_images'): Promise<void> {
    const path = url.split('/').pop();
    if (!path) return;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
  },
};
