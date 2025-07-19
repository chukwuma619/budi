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
      chat_messages: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          message: string
          response: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message: string
          response: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          message?: string
          response?: string
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          color: string | null
          created_at: string | null
          day_of_week: string
          id: string
          notifications: boolean | null
          room: string | null
          subject: string
          time_slot: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          day_of_week: string
          id?: string
          notifications?: boolean | null
          room?: string | null
          subject: string
          time_slot: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          day_of_week?: string
          id?: string
          notifications?: boolean | null
          room?: string | null
          subject?: string
          time_slot?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          created_at: string | null
          file_name: string | null
          file_size: number | null
          flashcards: Json | null
          id: string
          key_points: Json | null
          original_text: string | null
          summary: string | null
          title: string
          updated_at: string | null
          upload_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          flashcards?: Json | null
          id?: string
          key_points?: Json | null
          original_text?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          upload_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string | null
          file_size?: number | null
          flashcards?: Json | null
          id?: string
          key_points?: Json | null
          original_text?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          upload_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_days: {
        Row: {
          completed: boolean | null
          created_at: string | null
          date: string
          day_number: number
          id: string
          study_plan_id: string
          total_hours: number
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          date: string
          day_number: number
          id?: string
          study_plan_id: string
          total_hours: number
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          date?: string
          day_number?: number
          id?: string
          study_plan_id?: string
          total_hours?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_days_study_plan_id_fkey"
            columns: ["study_plan_id"]
            isOneToOne: false
            referencedRelation: "study_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      study_plans: {
        Row: {
          created_at: string | null
          exam_date: string
          hours_per_day: number
          id: string
          progress: number | null
          subject: string
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exam_date: string
          hours_per_day: number
          id?: string
          progress?: number | null
          subject: string
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          exam_date?: string
          hours_per_day?: number
          id?: string
          progress?: number | null
          subject?: string
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string | null
          duration: number
          id: string
          notes: string | null
          session_date: string | null
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration: number
          id?: string
          notes?: string | null
          session_date?: string | null
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration?: number
          id?: string
          notes?: string | null
          session_date?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      study_tasks: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration: number
          id: string
          priority: string | null
          study_day_id: string
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration: number
          id?: string
          priority?: string | null
          study_day_id: string
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration?: number
          id?: string
          priority?: string | null
          study_day_id?: string
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "study_tasks_study_day_id_fkey"
            columns: ["study_day_id"]
            isOneToOne: false
            referencedRelation: "study_days"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: string | null
          subject: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          subject?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string | null
          subject?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          ai_personality: string | null
          analytics_consent: boolean | null
          assignment_alerts: boolean | null
          auto_schedule: boolean | null
          created_at: string | null
          data_sharing_consent: boolean | null
          email_notifications: boolean | null
          id: string
          progress_insights: boolean | null
          reminder_time: number | null
          response_length: string | null
          smart_reminders: boolean | null
          study_reminders: boolean | null
          study_suggestions: boolean | null
          updated_at: string | null
          weekly_summary: boolean | null
        }
        Insert: {
          ai_personality?: string | null
          analytics_consent?: boolean | null
          assignment_alerts?: boolean | null
          auto_schedule?: boolean | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          email_notifications?: boolean | null
          id: string
          progress_insights?: boolean | null
          reminder_time?: number | null
          response_length?: string | null
          smart_reminders?: boolean | null
          study_reminders?: boolean | null
          study_suggestions?: boolean | null
          updated_at?: string | null
          weekly_summary?: boolean | null
        }
        Update: {
          ai_personality?: string | null
          analytics_consent?: boolean | null
          assignment_alerts?: boolean | null
          auto_schedule?: boolean | null
          created_at?: string | null
          data_sharing_consent?: boolean | null
          email_notifications?: boolean | null
          id?: string
          progress_insights?: boolean | null
          reminder_time?: number | null
          response_length?: string | null
          smart_reminders?: boolean | null
          study_reminders?: boolean | null
          study_suggestions?: boolean | null
          updated_at?: string | null
          weekly_summary?: boolean | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          major: string | null
          timezone: string | null
          university: string | null
          updated_at: string | null
          year_of_study: number | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          major?: string | null
          timezone?: string | null
          university?: string | null
          updated_at?: string | null
          year_of_study?: number | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          major?: string | null
          timezone?: string | null
          university?: string | null
          updated_at?: string | null
          year_of_study?: number | null
        }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
