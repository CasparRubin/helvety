export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      contacts: {
        Row: {
          category_id: string;
          created_at: string;
          encrypted_birthday: string | null;
          encrypted_description: string | null;
          encrypted_email: string | null;
          encrypted_first_name: string;
          encrypted_last_name: string;
          encrypted_notes: string | null;
          encrypted_phone: string | null;
          id: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id?: string;
          created_at?: string;
          encrypted_birthday?: string | null;
          encrypted_description?: string | null;
          encrypted_email?: string | null;
          encrypted_first_name: string;
          encrypted_last_name: string;
          encrypted_notes?: string | null;
          encrypted_phone?: string | null;
          id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          encrypted_birthday?: string | null;
          encrypted_description?: string | null;
          encrypted_email?: string | null;
          encrypted_first_name?: string;
          encrypted_last_name?: string;
          encrypted_notes?: string | null;
          encrypted_phone?: string | null;
          id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      docs: {
        Row: {
          created_at: string;
          encrypted_docx: string;
          encrypted_title: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          encrypted_docx: string;
          encrypted_title: string;
          id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          encrypted_docx?: string;
          encrypted_title?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      entity_links: {
        Row: {
          created_at: string;
          id: string;
          metadata: Json;
          relation_type: string;
          source_entity_id: string;
          source_entity_type: string;
          target_entity_id: string;
          target_entity_type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          relation_type?: string;
          source_entity_id: string;
          source_entity_type: string;
          target_entity_id: string;
          target_entity_type: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          metadata?: Json;
          relation_type?: string;
          source_entity_id?: string;
          source_entity_type?: string;
          target_entity_id?: string;
          target_entity_type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
          created_at: string;
          encrypted_description: string | null;
          encrypted_end_date: string | null;
          encrypted_start_date: string | null;
          encrypted_title: string;
          id: string;
          label_id: string;
          priority: number;
          sort_order: number;
          stage_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          encrypted_description?: string | null;
          encrypted_end_date?: string | null;
          encrypted_start_date?: string | null;
          encrypted_title: string;
          id?: string;
          label_id: string;
          priority?: number;
          sort_order?: number;
          stage_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          encrypted_description?: string | null;
          encrypted_end_date?: string | null;
          encrypted_start_date?: string | null;
          encrypted_title?: string;
          id?: string;
          label_id?: string;
          priority?: number;
          sort_order?: number;
          stage_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      link_folders: {
        Row: {
          created_at: string;
          encrypted_name: string;
          id: string;
          parent_folder_id: string | null;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          encrypted_name: string;
          id?: string;
          parent_folder_id?: string | null;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          encrypted_name?: string;
          id?: string;
          parent_folder_id?: string | null;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "link_folders_parent_folder_id_fkey";
            columns: ["parent_folder_id"];
            isOneToOne: false;
            referencedRelation: "link_folders";
            referencedColumns: ["id"];
          },
        ];
      };
      links: {
        Row: {
          created_at: string;
          encrypted_name: string;
          encrypted_url: string;
          folder_id: string | null;
          id: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          encrypted_name: string;
          encrypted_url: string;
          folder_id?: string | null;
          id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          encrypted_name?: string;
          encrypted_url?: string;
          folder_id?: string | null;
          id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "link_folders";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          category_id: string;
          created_at: string;
          encrypted_description: string | null;
          encrypted_title: string;
          id: string;
          sort_order: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id?: string;
          created_at?: string;
          encrypted_description?: string | null;
          encrypted_title: string;
          id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string;
          encrypted_description?: string | null;
          encrypted_title?: string;
          id?: string;
          sort_order?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_auth_credentials: {
        Row: {
          backed_up: boolean | null;
          counter: number;
          created_at: string;
          credential_id: string;
          device_type: string | null;
          id: string;
          last_used_at: string | null;
          public_key: string;
          transports: string[] | null;
          user_id: string;
        };
        Insert: {
          backed_up?: boolean | null;
          counter?: number;
          created_at?: string;
          credential_id: string;
          device_type?: string | null;
          id?: string;
          last_used_at?: string | null;
          public_key: string;
          transports?: string[] | null;
          user_id: string;
        };
        Update: {
          backed_up?: boolean | null;
          counter?: number;
          created_at?: string;
          credential_id?: string;
          device_type?: string | null;
          id?: string;
          last_used_at?: string | null;
          public_key?: string;
          transports?: string[] | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_passkey_params: {
        Row: {
          created_at: string;
          credential_id: string;
          prf_salt: string;
          user_id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          credential_id: string;
          prf_salt: string;
          user_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          credential_id?: string;
          prf_salt?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_user_by_email: {
        Args: { lookup_email: string };
        Returns: {
          email: string;
          id: string;
        }[];
      };
      purge_auth_user_owned_data: {
        Args: { p_user_id: string };
        Returns: undefined;
      };
      validate_entity_link_endpoint: {
        Args: { p_entity_id: string; p_entity_type: string; p_user_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

/** Helvety alias used by Supabase client factories. */
export type DatabaseSchema = Database;
