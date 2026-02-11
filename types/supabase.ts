export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    resource_id: string | null
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: string
                    title: string
                    message: string
                    resource_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: string
                    title?: string
                    message?: string
                    resource_id?: string | null
                    is_read?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            profiles: {
                Row: { id: string; full_name: string; role: string }
                Insert: { id: string; full_name: string; role: string }
                Update: { id?: string; full_name?: string; role?: string }
                Relationships: []
            }
            appointments: {
                Row: { id: string; patient_id: string; clinician_id: string | null; scheduled_at: string; status: string }
                Insert: { id?: string; patient_id: string; clinician_id: string | null; scheduled_at: string; status: string }
                Update: { id?: string; patient_id?: string; clinician_id?: string | null; scheduled_at?: string; status?: string }
                Relationships: []
            }
            daily_logs: {
                Row: { id: string; user_id: string; log_date: string; symptoms_entry: Json; calculated_risk_score: number; requires_action: boolean }
                Insert: { id?: string; user_id: string; log_date: string; symptoms_entry: Json; calculated_risk_score: number; requires_action: boolean }
                Update: { id?: string; user_id?: string; log_date?: string; symptoms_entry?: Json; calculated_risk_score?: number; requires_action?: boolean }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
