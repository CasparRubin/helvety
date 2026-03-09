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
      consent_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          privacy_version: string;
          terms_version: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          privacy_version: string;
          terms_version: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          privacy_version?: string;
          terms_version?: string;
          user_id?: string;
        };
        Relationships: [];
      };
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
          category_id: string;
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
      item_contact_links: {
        Row: {
          contact_id: string;
          created_at: string;
          id: string;
          item_id: string;
          user_id: string;
        };
        Insert: {
          contact_id: string;
          created_at?: string;
          id?: string;
          item_id: string;
          user_id: string;
        };
        Update: {
          contact_id?: string;
          created_at?: string;
          id?: string;
          item_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "item_contact_links_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "item_contact_links_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "items";
            referencedColumns: ["id"];
          },
        ];
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
      licensed_tenants: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          subscription_id: string;
          tenant_domain: string;
          tenant_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          subscription_id: string;
          tenant_domain: string;
          tenant_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          subscription_id?: string;
          tenant_domain?: string;
          tenant_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "licensed_tenants_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      purchases: {
        Row: {
          amount_paid: number;
          created_at: string;
          currency: string;
          id: string;
          product_id: string;
          stripe_payment_intent_id: string | null;
          stripe_price_id: string;
          tier_id: string;
          user_id: string;
        };
        Insert: {
          amount_paid: number;
          created_at?: string;
          currency?: string;
          id?: string;
          product_id: string;
          stripe_payment_intent_id?: string | null;
          stripe_price_id: string;
          tier_id: string;
          user_id: string;
        };
        Update: {
          amount_paid?: number;
          created_at?: string;
          currency?: string;
          id?: string;
          product_id?: string;
          stripe_payment_intent_id?: string | null;
          stripe_price_id?: string;
          tier_id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      subscription_events: {
        Row: {
          created_at: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          purchase_id: string | null;
          stripe_event_id: string | null;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          purchase_id?: string | null;
          stripe_event_id?: string | null;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          purchase_id?: string | null;
          stripe_event_id?: string | null;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subscription_events_purchase_id_fkey";
            columns: ["purchase_id"];
            isOneToOne: false;
            referencedRelation: "purchases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "subscription_events_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          created_at: string;
          current_period_end: string | null;
          current_period_start: string | null;
          id: string;
          product_id: string;
          status: Database["public"]["Enums"]["subscription_status"];
          stripe_price_id: string;
          stripe_subscription_id: string | null;
          tier_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          product_id: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_price_id: string;
          stripe_subscription_id?: string | null;
          tier_id: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          created_at?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          id?: string;
          product_id?: string;
          status?: Database["public"]["Enums"]["subscription_status"];
          stripe_price_id?: string;
          stripe_subscription_id?: string | null;
          tier_id?: string;
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
          stripe_customer_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id: string;
          stripe_customer_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          stripe_customer_id?: string | null;
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
    };
    Enums: {
      subscription_status:
        | "incomplete"
        | "incomplete_expired"
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "paused";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type DatabaseSchema = Database;
