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
      appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          created_at: string | null
          doctor_id: string | null
          id: string
          notes: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string | null
          id: string
          medicine_id: string | null
          quantity: number
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          quantity?: number
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          quantity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          available_days: string[] | null
          available_hours: string | null
          avatar_url: string | null
          bio: string | null
          consultation_fee: number | null
          created_at: string | null
          experience_years: number | null
          id: string
          name: string
          rating: number | null
          specialty: string
        }
        Insert: {
          available_days?: string[] | null
          available_hours?: string | null
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          name: string
          rating?: number | null
          specialty: string
        }
        Update: {
          available_days?: string[] | null
          available_hours?: string | null
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number | null
          created_at?: string | null
          experience_years?: number | null
          id?: string
          name?: string
          rating?: number | null
          specialty?: string
        }
        Relationships: []
      }
      health_records: {
        Row: {
          created_at: string | null
          data: Json | null
          description: string | null
          file_url: string | null
          id: string
          record_type: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          file_url?: string | null
          id?: string
          record_type: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          description?: string | null
          file_url?: string | null
          id?: string
          record_type?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      medicines: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          manufacturer: string | null
          name: string
          price: number
          requires_prescription: boolean | null
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name: string
          price: number
          requires_prescription?: boolean | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          manufacturer?: string | null
          name?: string
          price?: number
          requires_prescription?: boolean | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          medicine_id: string | null
          order_id: string | null
          price: number
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          order_id?: string | null
          price: number
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          medicine_id?: string | null
          order_id?: string | null
          price?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          shipping_address: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          shipping_address?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          shipping_address?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      symptom_checks: {
        Row: {
          ai_diagnosis: string | null
          created_at: string | null
          id: string
          recommendations: string | null
          severity_level: string | null
          symptoms: string[]
          user_id: string | null
        }
        Insert: {
          ai_diagnosis?: string | null
          created_at?: string | null
          id?: string
          recommendations?: string | null
          severity_level?: string | null
          symptoms: string[]
          user_id?: string | null
        }
        Update: {
          ai_diagnosis?: string | null
          created_at?: string | null
          id?: string
          recommendations?: string | null
          severity_level?: string | null
          symptoms?: string[]
          user_id?: string | null
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
