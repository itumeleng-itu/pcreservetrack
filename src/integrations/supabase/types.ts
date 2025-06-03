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
      computers: {
        Row: {
          created_at: string | null
          description: string | null
          fault_description: string | null
          id: number
          ip_address: string | null
          is_emergency: boolean | null
          last_maintenance: string | null
          last_seen: string | null
          location: string | null
          mac_address: string | null
          name: string
          reserved_by: string | null
          reserved_until: string | null
          specs: string | null
          status: string
          tracking_cpu_usage: number | null
          tracking_last_heartbeat: string | null
          tracking_memory_usage: number | null
          tracking_online: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fault_description?: string | null
          id?: number
          ip_address?: string | null
          is_emergency?: boolean | null
          last_maintenance?: string | null
          last_seen?: string | null
          location?: string | null
          mac_address?: string | null
          name: string
          reserved_by?: string | null
          reserved_until?: string | null
          specs?: string | null
          status?: string
          tracking_cpu_usage?: number | null
          tracking_last_heartbeat?: string | null
          tracking_memory_usage?: number | null
          tracking_online?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fault_description?: string | null
          id?: number
          ip_address?: string | null
          is_emergency?: boolean | null
          last_maintenance?: string | null
          last_seen?: string | null
          location?: string | null
          mac_address?: string | null
          name?: string
          reserved_by?: string | null
          reserved_until?: string | null
          specs?: string | null
          status?: string
          tracking_cpu_usage?: number | null
          tracking_last_heartbeat?: string | null
          tracking_memory_usage?: number | null
          tracking_online?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faults: {
        Row: {
          computer_id: number | null
          created_at: string | null
          description: string
          id: number
          reported_by: number | null
          status: string | null
        }
        Insert: {
          computer_id?: number | null
          created_at?: string | null
          description: string
          id?: never
          reported_by?: number | null
          status?: string | null
        }
        Update: {
          computer_id?: number | null
          created_at?: string | null
          description?: string
          id?: never
          reported_by?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faults_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "faults_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_queue: {
        Row: {
          created_at: string | null
          id: string
          lab_name: string
          position: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lab_name: string
          position: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lab_name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      maintenance_logs: {
        Row: {
          completed_at: string | null
          computer_id: number
          created_at: string | null
          id: number
          issue_description: string
          solution: string | null
          started_at: string | null
          status: string
          technician_id: string | null
        }
        Insert: {
          completed_at?: string | null
          computer_id: number
          created_at?: string | null
          id?: number
          issue_description: string
          solution?: string | null
          started_at?: string | null
          status?: string
          technician_id?: string | null
        }
        Update: {
          completed_at?: string | null
          computer_id?: number
          created_at?: string | null
          id?: number
          issue_description?: string
          solution?: string | null
          started_at?: string | null
          status?: string
          technician_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "registered"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      queues: {
        Row: {
          id: number
          joined_at: string | null
          lab_id: string
          position: number | null
          user_id: string
        }
        Insert: {
          id?: number
          joined_at?: string | null
          lab_id: string
          position?: number | null
          user_id: string
        }
        Update: {
          id?: number
          joined_at?: string | null
          lab_id?: string
          position?: number | null
          user_id?: string
        }
        Relationships: []
      }
      registered: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          is_deleted: boolean | null
          late_return_count: number | null
          name: string
          no_show_count: number | null
          role: string
          staff_num: string | null
          successful_reservations: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id: string
          is_deleted?: boolean | null
          late_return_count?: number | null
          name: string
          no_show_count?: number | null
          role: string
          staff_num?: string | null
          successful_reservations?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_deleted?: boolean | null
          late_return_count?: number | null
          name?: string
          no_show_count?: number | null
          role?: string
          staff_num?: string | null
          successful_reservations?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          computer_id: number
          created_at: string | null
          end_time: string | null
          id: number
          notes: string | null
          reservation_code: string
          reserved_at: string
          start_time: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          computer_id: number
          created_at?: string | null
          end_time?: string | null
          id?: number
          notes?: string | null
          reservation_code?: string
          reserved_at?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          computer_id?: number
          created_at?: string | null
          end_time?: string | null
          id?: number
          notes?: string | null
          reservation_code?: string
          reserved_at?: string
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_computer_id_fkey"
            columns: ["computer_id"]
            isOneToOne: false
            referencedRelation: "computers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "registered"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_statistics: {
        Row: {
          average_duration: unknown | null
          created_at: string | null
          date: string
          id: number
          peak_hour: number | null
          total_reservations: number | null
          unique_users: number | null
          updated_at: string | null
        }
        Insert: {
          average_duration?: unknown | null
          created_at?: string | null
          date?: string
          id?: number
          peak_hour?: number | null
          total_reservations?: number | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Update: {
          average_duration?: unknown | null
          created_at?: string | null
          date?: string
          id?: number
          peak_hour?: number | null
          total_reservations?: number | null
          unique_users?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_id: string
          email: string
          id: string
          last_active: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          email: string
          id?: string
          last_active?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          email?: string
          id?: string
          last_active?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_reservation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      register_user: {
        Args: { email: string; user_id: string }
        Returns: undefined
      }
      reserve_computer: {
        Args:
          | {
              p_computer_id: number
              p_user_id: string
              p_reserved_until: string
            }
          | {
              p_computer_id: number
              p_user_id: string
              p_start_time: string
              p_end_time: string
            }
        Returns: boolean
      }
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
