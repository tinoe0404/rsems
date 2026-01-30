/**
 * RSEMS Database Types
 * Auto-generated TypeScript types for Supabase database schema
 * 
 * These types ensure type safety when querying the database
 * from the Next.js frontend.
 */

// =====================================================
// ENUMS
// =====================================================

export type UserRole = 'patient' | 'clinician';

export type AppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'no-show';

export type SeverityLevel = 0 | 1 | 2 | 3;

export type SymptomCategory =
    | 'General'
    | 'Nausea/Vomiting'
    | 'Toilet/Bowel'
    | 'Toilet/Urinary'
    | 'Vaginal/Pelvic'
    | 'Skin'
    | 'Pain'
    | 'Sleep/Mental'
    | 'Other';

// =====================================================
// DATABASE TABLES
// =====================================================

/**
 * User Profile (extends Supabase Auth)
 */
export interface Profile {
    id: string; // UUID
    full_name: string;
    role: UserRole;
    cancer_type: string;
    treatment_start_date: string | null; // ISO date string
    phone_number: string | null;
    date_of_birth: string | null; // ISO date string
    created_at: string; // ISO datetime string
    updated_at: string; // ISO datetime string
}

/**
 * Insert type for Profile (excludes auto-generated fields)
 */
export interface ProfileInsert {
    id: string; // Must match auth.users.id
    full_name: string;
    role?: UserRole;
    cancer_type?: string;
    treatment_start_date?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
}

/**
 * Update type for Profile (all fields optional)
 */
export interface ProfileUpdate {
    full_name?: string;
    role?: UserRole;
    cancer_type?: string;
    treatment_start_date?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
}

/**
 * Symptom Master (Static Library)
 */
export interface SymptomMaster {
    id: number;
    name: string;
    category: SymptomCategory;
    default_severity: SeverityLevel;
    description: string | null;
    clinical_notes: string | null;
    is_active: boolean;
    created_at: string;
}

/**
 * Symptom Entry (JSONB structure in daily_logs)
 */
export interface SymptomEntry {
    symptom_id: number;
    symptom_name: string;
    severity: SeverityLevel;
    notes?: string;
}

/**
 * Daily Log (Patient Symptom Tracking)
 */
export interface DailyLog {
    id: string; // UUID
    user_id: string; // UUID
    log_date: string; // ISO date string (YYYY-MM-DD)
    symptoms_entry: SymptomEntry[];
    calculated_risk_score: SeverityLevel;
    requires_action: boolean;
    additional_notes: string | null;
    created_at: string; // ISO datetime string
    updated_at: string; // ISO datetime string
}

/**
 * Insert type for Daily Log
 */
export interface DailyLogInsert {
    user_id: string;
    log_date?: string; // Defaults to today
    symptoms_entry: SymptomEntry[];
    additional_notes?: string | null;
    // calculated_risk_score and requires_action are auto-calculated
}

/**
 * Update type for Daily Log
 */
export interface DailyLogUpdate {
    symptoms_entry?: SymptomEntry[];
    additional_notes?: string | null;
    // Can only update same-day logs
}

/**
 * Appointment
 */
export interface Appointment {
    id: string; // UUID
    patient_id: string; // UUID
    clinician_id: string | null; // UUID
    scheduled_at: string; // ISO datetime string
    duration_minutes: number;
    appointment_type: string;
    status: AppointmentStatus;
    notes: string | null;
    cancellation_reason: string | null;
    created_by: string | null; // UUID
    created_at: string; // ISO datetime string
    updated_at: string; // ISO datetime string
}

/**
 * Insert type for Appointment
 */
export interface AppointmentInsert {
    patient_id: string;
    clinician_id?: string | null;
    scheduled_at: string;
    duration_minutes?: number;
    appointment_type?: string;
    status?: AppointmentStatus;
    notes?: string | null;
    created_by?: string | null;
}

/**
 * Update type for Appointment
 */
export interface AppointmentUpdate {
    clinician_id?: string | null;
    scheduled_at?: string;
    duration_minutes?: number;
    appointment_type?: string;
    status?: AppointmentStatus;
    notes?: string | null;
    cancellation_reason?: string | null;
}

// =====================================================
// DATABASE VIEWS
// =====================================================

/**
 * High Risk Patients View
 */
export interface HighRiskPatient {
    id: string; // Profile ID
    full_name: string;
    cancer_type: string;
    log_date: string;
    calculated_risk_score: SeverityLevel;
    symptoms_entry: SymptomEntry[];
    created_at: string;
}

/**
 * Upcoming Appointments View
 */
export interface UpcomingAppointment {
    id: string; // Appointment ID
    scheduled_at: string;
    status: AppointmentStatus;
    appointment_type: string;
    patient_name: string;
    cancer_type: string;
    clinician_name: string | null;
    notes: string | null;
}

// =====================================================
// JOINED TYPES (Common Queries)
// =====================================================

/**
 * Daily Log with Profile (for clinician dashboard)
 */
export interface DailyLogWithProfile extends DailyLog {
    profile: Pick<Profile, 'full_name' | 'cancer_type' | 'phone_number'>;
}

/**
 * Appointment with Details (full patient and clinician info)
 */
export interface AppointmentWithDetails extends Appointment {
    patient: Pick<Profile, 'full_name' | 'cancer_type' | 'phone_number'>;
    clinician: Pick<Profile, 'full_name'> | null;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

/**
 * Standard API Response
 */
export interface ApiResponse<T> {
    data: T | null;
    error: string | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

// =====================================================
// FORM TYPES (Frontend)
// =====================================================

/**
 * Daily Log Form Data
 */
export interface DailyLogFormData {
    selectedSymptoms: Array<{
        symptomId: number;
        symptomName: string;
        category: SymptomCategory;
        severity: SeverityLevel;
        notes?: string;
    }>;
    additionalNotes?: string;
}

/**
 * Appointment Form Data
 */
export interface AppointmentFormData {
    patientId: string;
    clinicianId?: string;
    scheduledAt: Date;
    duration: number;
    type: string;
    notes?: string;
}

// =====================================================
// STATISTICS TYPES
// =====================================================

/**
 * Symptom Statistics
 */
export interface SymptomStats {
    symptomId: number;
    symptomName: string;
    category: SymptomCategory;
    occurrences: number;
    averageSeverity: number;
    maxSeverity: SeverityLevel;
    lastReported: string;
}

/**
 * Patient Dashboard Summary
 */
export interface PatientDashboardSummary {
    totalLogs: number;
    currentStreak: number;
    highRiskDays: number;
    upcomingAppointments: number;
    lastLogDate: string | null;
    commonSymptoms: SymptomStats[];
}

/**
 * Clinician Dashboard Summary
 */
export interface ClinicianDashboardSummary {
    totalPatients: number;
    highRiskPatients: number;
    appointmentsToday: number;
    pendingReviews: number;
    recentHighRiskLogs: DailyLogWithProfile[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Database Table Names
 */
export type TableName =
    | 'profiles'
    | 'symptoms_master'
    | 'daily_logs'
    | 'appointments';

/**
 * View Names
 */
export type ViewName =
    | 'high_risk_patients'
    | 'upcoming_appointments';

/**
 * Type guard for severity level
 */
export function isSeverityLevel(value: number): value is SeverityLevel {
    return value >= 0 && value <= 3;
}

/**
 * Type guard for user role
 */
export function isUserRole(value: string): value is UserRole {
    return value === 'patient' || value === 'clinician';
}

/**
 * Type guard for appointment status
 */
export function isAppointmentStatus(value: string): value is AppointmentStatus {
    return ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'].includes(value);
}

// =====================================================
// SUPABASE CLIENT TYPES
// =====================================================

/**
 * Database Schema (for Supabase client)
 */
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: ProfileInsert;
                Update: ProfileUpdate;
            };
            symptoms_master: {
                Row: SymptomMaster;
                Insert: Omit<SymptomMaster, 'id' | 'created_at'>;
                Update: Partial<Omit<SymptomMaster, 'id' | 'created_at'>>;
            };
            daily_logs: {
                Row: DailyLog;
                Insert: DailyLogInsert;
                Update: DailyLogUpdate;
            };
            appointments: {
                Row: Appointment;
                Insert: AppointmentInsert;
                Update: AppointmentUpdate;
            };
        };
        Views: {
            high_risk_patients: {
                Row: HighRiskPatient;
            };
            upcoming_appointments: {
                Row: UpcomingAppointment;
            };
        };
        Functions: {
            calculate_risk_score: {
                Args: { symptoms: SymptomEntry[] };
                Returns: SeverityLevel;
            };
        };
    };
}

// =====================================================
// EXPORTS
// =====================================================

export type { Database as default };
