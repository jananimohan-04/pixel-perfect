export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: string | null
          document_id: string | null
          document_number: string | null
          id: string
          ip_address: string | null
          party_name: string | null
          user_id: string | null
          user_name: string | null
          version_number: number | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          document_id?: string | null
          document_number?: string | null
          id?: string
          ip_address?: string | null
          party_name?: string | null
          user_id?: string | null
          user_name?: string | null
          version_number?: number | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          document_id?: string | null
          document_number?: string | null
          id?: string
          ip_address?: string | null
          party_name?: string | null
          user_id?: string | null
          user_name?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_permissions: {
        Row: {
          created_at: string
          department: string | null
          document_id: string
          id: string
          permissions: string[]
          role_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          document_id: string
          id?: string
          permissions?: string[]
          role_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          document_id?: string
          id?: string
          permissions?: string[]
          role_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          document_id: string
          drive_file_id: string | null
          drive_folder_id: string | null
          drive_url: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          revision_notes: string | null
          status: Database["public"]["Enums"]["doc_status"]
          uploaded_at: string
          uploaded_by: string | null
          uploaded_by_name: string | null
          version_number: number
        }
        Insert: {
          document_id: string
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_url?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          uploaded_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version_number: number
        }
        Update: {
          document_id?: string
          drive_file_id?: string | null
          drive_folder_id?: string | null
          drive_url?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          revision_notes?: string | null
          status?: Database["public"]["Enums"]["doc_status"]
          uploaded_at?: string
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          current_version: number
          description: string | null
          document_name: string
          document_number: string
          document_type: string
          drawing_number: string | null
          file_type: string | null
          id: string
          part_id: string | null
          part_number: string | null
          party_id: string
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
          updated_by: string | null
          updated_by_name: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          current_version?: number
          description?: string | null
          document_name: string
          document_number: string
          document_type?: string
          drawing_number?: string | null
          file_type?: string | null
          id?: string
          part_id?: string | null
          part_number?: string | null
          party_id: string
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          current_version?: number
          description?: string | null
          document_name?: string
          document_number?: string
          document_type?: string
          drawing_number?: string | null
          file_type?: string | null
          id?: string
          part_id?: string | null
          part_number?: string | null
          party_id?: string
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
          updated_by?: string | null
          updated_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          document_id: string | null
          id: string
          read: boolean
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          document_id?: string | null
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
          address: string | null
          code: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
        }
        Relationships: []
      }
      parts: {
        Row: {
          created_at: string
          current_revision: number
          drawing_number: string | null
          drawing_type: string | null
          id: string
          part_name: string
          part_number: string
          party_id: string
          status: Database["public"]["Enums"]["doc_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_revision?: number
          drawing_number?: string | null
          drawing_type?: string | null
          id?: string
          part_name: string
          part_number: string
          party_id: string
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_revision?: number
          drawing_number?: string | null
          drawing_type?: string | null
          id?: string
          part_name?: string
          part_number?: string
          party_id?: string
          status?: Database["public"]["Enums"]["doc_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_party_id_fkey"
            columns: ["party_id"]
            isOneToOne: false
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string
          full_name: string
          last_login_at: string | null
          status: Database["public"]["Enums"]["entity_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          last_login_at?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          full_name?: string
          last_login_at?: string | null
          status?: Database["public"]["Enums"]["entity_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          name: string
          permissions: string[]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          name: string
          permissions?: string[]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          name?: string
          permissions?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_document: {
        Args: { _document_id: string; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      is_doc_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      doc_status:
        | "Draft"
        | "Under Review"
        | "Approved"
        | "Released"
        | "Superseded"
        | "Archived"
      entity_status: "Active" | "Inactive" | "Suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      doc_status: [
        "Draft",
        "Under Review",
        "Approved",
        "Released",
        "Superseded",
        "Archived",
      ],
      entity_status: ["Active", "Inactive", "Suspended"],
    },
  },
} as const
