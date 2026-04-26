export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      trips: {
        Row: {
          id: string;
          title: string;
          destination: string;
          budget: number;
          currency: string;
          start_date: string;
          end_date: string;
          num_people: number;
          invite_code: string;
          created_by: string;
          preferences: string[];
          itinerary: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          destination: string;
          budget: number;
          currency?: string;
          start_date: string;
          end_date: string;
          num_people: number;
          invite_code: string;
          created_by: string;
          preferences?: string[];
          itinerary?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          destination?: string;
          budget?: number;
          currency?: string;
          start_date?: string;
          end_date?: string;
          num_people?: number;
          preferences?: string[];
          itinerary?: Json | null;
          updated_at?: string;
        };
      };
      trip_members: {
        Row: {
          id: string;
          trip_id: string;
          user_id: string;
          role: "admin" | "member";
          joined_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          user_id: string;
          role?: "admin" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "admin" | "member";
        };
      };
      expenses: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          amount: number;
          category: "food" | "transport" | "stay" | "activities" | "shopping" | "other";
          paid_by: string;
          split_among: string[];
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          amount: number;
          category: "food" | "transport" | "stay" | "activities" | "shopping" | "other";
          paid_by: string;
          split_among: string[];
          description?: string | null;
          created_at?: string;
        };
        Update: {
          title?: string;
          amount?: number;
          category?: "food" | "transport" | "stay" | "activities" | "shopping" | "other";
          split_among?: string[];
          description?: string | null;
        };
      };
      settlements: {
        Row: {
          id: string;
          trip_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          settled: boolean;
          created_at: string;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          from_user: string;
          to_user: string;
          amount: number;
          settled?: boolean;
          created_at?: string;
          settled_at?: string | null;
        };
        Update: {
          settled?: boolean;
          settled_at?: string | null;
        };
      };
      votes: {
        Row: {
          id: string;
          trip_id: string;
          title: string;
          options: Json;
          created_by: string;
          created_at: string;
          ends_at: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          title: string;
          options: Json;
          created_by: string;
          created_at?: string;
          ends_at?: string | null;
        };
        Update: {
          title?: string;
          options?: Json;
          ends_at?: string | null;
        };
      };
      vote_responses: {
        Row: {
          id: string;
          vote_id: string;
          user_id: string;
          option_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          vote_id: string;
          user_id: string;
          option_index: number;
          created_at?: string;
        };
        Update: {};
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
