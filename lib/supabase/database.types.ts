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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      comp_admins: {
        Row: {
          competition_id: string
          user_id: string
        }
        Insert: {
          competition_id: string
          user_id: string
        }
        Update: {
          competition_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comp_admins_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comp_admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          settings: Json
          status: Database["public"]["Enums"]["competition_status"]
          team_size: number
          title_id: string
          type: Database["public"]["Enums"]["competition_type"]
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          settings?: Json
          status?: Database["public"]["Enums"]["competition_status"]
          team_size?: number
          title_id: string
          type: Database["public"]["Enums"]["competition_type"]
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          settings?: Json
          status?: Database["public"]["Enums"]["competition_status"]
          team_size?: number
          title_id?: string
          type?: Database["public"]["Enums"]["competition_type"]
        }
        Relationships: [
          {
            foreignKeyName: "competitions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competitions_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_player_stats: {
        Row: {
          game_id: string
          id: string
          stats: Json
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          stats?: Json
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          stats?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_player_stats_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_player_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          game_number: number
          id: string
          match_id: string
          score_a: number
          score_b: number
        }
        Insert: {
          game_number: number
          id?: string
          match_id: string
          score_a: number
          score_b: number
        }
        Update: {
          game_number?: number
          id?: string
          match_id?: string
          score_a?: number
          score_b?: number
        }
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_reschedules: {
        Row: {
          admin_approved_by: string | null
          created_at: string
          id: string
          match_id: string
          opponent_approved_by: string | null
          proposed_at: string
          requested_by: string
          status: Database["public"]["Enums"]["reschedule_status"]
        }
        Insert: {
          admin_approved_by?: string | null
          created_at?: string
          id?: string
          match_id: string
          opponent_approved_by?: string | null
          proposed_at: string
          requested_by: string
          status?: Database["public"]["Enums"]["reschedule_status"]
        }
        Update: {
          admin_approved_by?: string | null
          created_at?: string
          id?: string
          match_id?: string
          opponent_approved_by?: string | null
          proposed_at?: string
          requested_by?: string
          status?: Database["public"]["Enums"]["reschedule_status"]
        }
        Relationships: [
          {
            foreignKeyName: "match_reschedules_admin_approved_by_fkey"
            columns: ["admin_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reschedules_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reschedules_opponent_approved_by_fkey"
            columns: ["opponent_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_reschedules_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          best_of: number
          competition_id: string
          created_at: string
          forfeited_by: string | null
          id: string
          round: number
          scheduled_at: string | null
          stage: Database["public"]["Enums"]["match_stage"]
          status: Database["public"]["Enums"]["match_status"]
          team_a_id: string
          team_b_id: string
        }
        Insert: {
          best_of?: number
          competition_id: string
          created_at?: string
          forfeited_by?: string | null
          id?: string
          round?: number
          scheduled_at?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          team_a_id: string
          team_b_id: string
        }
        Update: {
          best_of?: number
          competition_id?: string
          created_at?: string
          forfeited_by?: string | null
          id?: string
          round?: number
          scheduled_at?: string | null
          stage?: Database["public"]["Enums"]["match_stage"]
          status?: Database["public"]["Enums"]["match_status"]
          team_a_id?: string
          team_b_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_forfeited_by_fkey"
            columns: ["forfeited_by"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_a_id_fkey"
            columns: ["team_a_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_team_b_id_fkey"
            columns: ["team_b_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      signups: {
        Row: {
          competition_id: string
          created_at: string
          status: Database["public"]["Enums"]["signup_status"]
          team_id: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          status?: Database["public"]["Enums"]["signup_status"]
          team_id: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          status?: Database["public"]["Enums"]["signup_status"]
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signups_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          created_at: string
          evidence_url: string | null
          id: string
          match_id: string
          payload: Json
          status: Database["public"]["Enums"]["submission_status"]
          submitted_by: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          evidence_url?: string | null
          id?: string
          match_id: string
          payload: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          evidence_url?: string | null
          id?: string
          match_id?: string
          payload?: Json
          status?: Database["public"]["Enums"]["submission_status"]
          submitted_by?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string
          id: string
          invited_by: string
          status: Database["public"]["Enums"]["invite_status"]
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by: string
          status?: Database["public"]["Enums"]["invite_status"]
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string
          status?: Database["public"]["Enums"]["invite_status"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          title_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          title_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          title_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
        ]
      }
      titles: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          stat_schema: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          stat_schema?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          stat_schema?: Json
        }
        Relationships: []
      }
      user_titles: {
        Row: {
          title_id: string
          user_id: string
        }
        Insert: {
          title_id: string
          user_id: string
        }
        Update: {
          title_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_titles_title_id_fkey"
            columns: ["title_id"]
            isOneToOne: false
            referencedRelation: "titles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_titles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: { Args: { invite_id: string }; Returns: undefined }
      approve_reschedule: {
        Args: { p_reschedule_id: string }
        Returns: undefined
      }
      captain_team_in_match: { Args: { p_match_id: string }; Returns: string }
      forfeit_match: { Args: { p_match_id: string }; Returns: undefined }
      is_comp_admin: { Args: { comp_id: string }; Returns: boolean }
      is_team_captain: { Args: { t_id: string }; Returns: boolean }
      propose_reschedule: {
        Args: { p_match_id: string; p_proposed_at: string }
        Returns: undefined
      }
      publish_schedule: { Args: { p_comp_id: string }; Returns: undefined }
      reject_reschedule: {
        Args: { p_reschedule_id: string }
        Returns: undefined
      }
      reopen_competition: { Args: { p_comp_id: string }; Returns: undefined }
      start_competition: { Args: { p_comp_id: string }; Returns: undefined }
      swap_match_teams: {
        Args: {
          p_match_a: string
          p_match_b: string
          p_slot_a: string
          p_slot_b: string
        }
        Returns: undefined
      }
      verify_submission: {
        Args: { p_submission_id: string }
        Returns: undefined
      }
    }
    Enums: {
      competition_status: "draft" | "open" | "active" | "completed"
      competition_type: "league" | "tournament"
      invite_status: "pending" | "accepted" | "declined"
      match_stage: "regular" | "playoff"
      match_status: "scheduled" | "live" | "completed" | "cancelled"
      reschedule_status: "pending" | "approved" | "rejected" | "cancelled"
      signup_status: "pending" | "accepted" | "rejected"
      submission_status: "pending" | "verified" | "rejected"
      team_role: "captain" | "member"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      competition_status: ["draft", "open", "active", "completed"],
      competition_type: ["league", "tournament"],
      invite_status: ["pending", "accepted", "declined"],
      match_stage: ["regular", "playoff"],
      match_status: ["scheduled", "live", "completed", "cancelled"],
      reschedule_status: ["pending", "approved", "rejected", "cancelled"],
      signup_status: ["pending", "accepted", "rejected"],
      submission_status: ["pending", "verified", "rejected"],
      team_role: ["captain", "member"],
    },
  },
} as const
