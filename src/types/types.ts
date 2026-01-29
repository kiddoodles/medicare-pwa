export type UserRole = 'user' | 'admin';

export type MedicationFrequency = 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily' | 'as_needed' | 'custom';

export type MedicationLogStatus = 'taken' | 'missed' | 'skipped' | 'pending';

export type BadgeType = 'first_dose' | 'week_streak' | 'month_streak' | 'perfect_week' | 'perfect_month' | 'hundred_doses' | 'early_bird' | 'night_owl';

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  phone: string | null;
  mobile?: string | null;
  role: UserRole;
  full_name: string | null;
  date_of_birth: string | null;
  medical_history: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  healthcare_provider: string | null;
  photo_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: MedicationFrequency;
  start_date: string;
  end_date: string | null;
  reminder_times: string[];
  photo_url: string | null;
  notes: string | null;
  remaining_quantity: number | null;
  refill_reminder_threshold: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationInfo {
  id: string;
  medication_name: string;
  uses: string | null;
  side_effects: string | null;
  contraindications: string | null;
  drug_interactions: string | null;
  dosage_recommendations: string | null;
  storage_instructions: string | null;
  barcode: string | null;
  created_at: string;
}

export interface MedicationLog {
  id: string;
  medication_id: string;
  user_id: string;
  scheduled_time: string;
  taken_time: string | null;
  status: MedicationLogStatus;
  notes: string | null;
  created_at: string;
}

// Joined type for UI convenience when fetching logs with medication details
export interface MedicationLogWithDetails extends MedicationLog {
  medication?: {
    name: string;
    dosage: string;
    photo_url: string | null;
  } | null;
}

export interface HealthJournalEntry {
  id: string;
  user_id: string;
  entry_date: string;
  symptoms: string | null;
  mood: string | null;
  wellness_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  user_id: string;
  badge_type: BadgeType;
  earned_date: string;
  streak_count: number;
  created_at: string;
}

export interface Caregiver {
  id: string;
  user_id: string;
  caregiver_email: string;
  caregiver_name: string | null;
  access_level: string;
  approved: boolean;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  dark_mode: boolean;
  sound_enabled: boolean;
  ringtone: string;
  snooze_minutes: number;
  updated_at: string;
}

// UI specific interfaces
export interface DashboardData {
  today_medications: (Medication & { logs: MedicationLog[] })[];
  upcoming_doses: MedicationLogWithDetails[];
  adherence_stats: {
    total_doses: number;
    taken_doses: number;
    missed_doses: number;
    skipped_doses: number;
    adherence_rate: number;
    current_streak: number;
    longest_streak: number; // Placeholder, as schema doesn't strictly track this easily without heavy calculation
  };
  recent_achievements: Achievement[];
}

export interface AdherenceStats {
  total_doses: number;
  taken_doses: number;
  missed_doses: number;
  skipped_doses: number;
  adherence_rate: number;
  current_streak: number;
  longest_streak: number;
}

export interface MedicationWithLogs extends Medication {
  logs: MedicationLog[];
}

export interface MedicalHistory {
  id: string;
  user_id: string;
  chronic_conditions: string[];
  current_medications: {
    name: string;
    dosage: string;
    frequency: string;
    start_date: string;
  }[];
  past_medications: {
    name: string;
    duration: string;
    reason_stopped: string;
  }[];
  drug_allergies: string[];
  food_allergies: string[];
  family_history: string[];
  notes: string | null;
  clinical_notes: string | null;
  created_at: string;
  updated_at: string;
}
