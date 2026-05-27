// Hand-written from schema.sql. Matches the shape Supabase's `gen types`
// produces, so it can be regenerated later without touching call sites.
//
// Source of truth: ../../../schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      settings: {
        Row: {
          id: number;
          pub_name: string;
          logo_url: string | null;
          hero_url: string | null;
          currency: string;
          accent_color: string;
          wifi_password: string | null;
          instagram: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          footer_note: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          pub_name?: string;
          logo_url?: string | null;
          hero_url?: string | null;
          currency?: string;
          accent_color?: string;
          wifi_password?: string | null;
          instagram?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          footer_note?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          pub_name?: string;
          logo_url?: string | null;
          hero_url?: string | null;
          currency?: string;
          accent_color?: string;
          wifi_password?: string | null;
          instagram?: string | null;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          footer_note?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      sections: {
        Row: {
          id: string;
          name: string;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          section_id: string;
          name: string;
          description: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          section_id: string;
          name: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          section_id?: string;
          name?: string;
          description?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'categories_section_id_fkey';
            columns: ['section_id'];
            isOneToOne: false;
            referencedRelation: 'sections';
            referencedColumns: ['id'];
          },
        ];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          description: string | null;
          volume: string | null;
          price: number;
          image_url: string | null;
          is_available: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          description?: string | null;
          volume?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          description?: string | null;
          volume?: string | null;
          price?: number;
          image_url?: string | null;
          is_available?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

// Convenience row aliases used across the app.
export type SettingsRow = Database['public']['Tables']['settings']['Row'];
export type SectionRow = Database['public']['Tables']['sections']['Row'];
export type CategoryRow = Database['public']['Tables']['categories']['Row'];
export type ProductRow = Database['public']['Tables']['products']['Row'];
