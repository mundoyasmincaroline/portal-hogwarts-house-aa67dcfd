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
      ads: {
        Row: {
          active: boolean
          ad_type: string
          created_at: string
          id: string
          image_url: string | null
          link: string
          title: string
        }
        Insert: {
          active?: boolean
          ad_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string
          title: string
        }
        Update: {
          active?: boolean
          ad_type?: string
          created_at?: string
          id?: string
          image_url?: string | null
          link?: string
          title?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          xp_required: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          xp_required?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          xp_required?: number | null
        }
        Relationships: []
      }
      banned_words: {
        Row: {
          created_at: string
          id: string
          word: string
        }
        Insert: {
          created_at?: string
          id?: string
          word: string
        }
        Update: {
          created_at?: string
          id?: string
          word?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          action_type: string | null
          active: boolean
          correct_answer: string | null
          created_at: string
          created_by: string | null
          description: string | null
          goal: number | null
          id: string
          question: string | null
          title: string
          type: string
          xp_reward: number
        }
        Insert: {
          action_type?: string | null
          active?: boolean
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          goal?: number | null
          id?: string
          question?: string | null
          title: string
          type?: string
          xp_reward?: number
        }
        Update: {
          action_type?: string | null
          active?: boolean
          correct_answer?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          goal?: number | null
          id?: string
          question?: string | null
          title?: string
          type?: string
          xp_reward?: number
        }
        Relationships: []
      }
      channels: {
        Row: {
          allowed_houses: string[] | null
          category: string | null
          created_at: string
          description: string | null
          house_only: string | null
          icon: string | null
          id: string
          is_admin_only: boolean | null
          is_premium: boolean | null
          meet_link: string | null
          name: string
          type: string
        }
        Insert: {
          allowed_houses?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          house_only?: string | null
          icon?: string | null
          id?: string
          is_admin_only?: boolean | null
          is_premium?: boolean | null
          meet_link?: string | null
          name: string
          type?: string
        }
        Update: {
          allowed_houses?: string[] | null
          category?: string | null
          created_at?: string
          description?: string | null
          house_only?: string | null
          icon?: string | null
          id?: string
          is_admin_only?: boolean | null
          is_premium?: boolean | null
          meet_link?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      characters_birthdays: {
        Row: {
          age: number | null
          birth_date: string
          created_at: string
          house: string | null
          id: string
          name: string
        }
        Insert: {
          age?: number | null
          birth_date: string
          created_at?: string
          house?: string | null
          id?: string
          name: string
        }
        Update: {
          age?: number | null
          birth_date?: string
          created_at?: string
          house?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      class_attendance: {
        Row: {
          attended_at: string
          class_id: string
          id: string
          user_id: string
        }
        Insert: {
          attended_at?: string
          class_id: string
          id?: string
          user_id: string
        }
        Update: {
          attended_at?: string
          class_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          day_of_week: string
          id: string
          is_optional: boolean
          professor: string | null
          target_years: string
          time_slot: string
          title: string
          week_rotation: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          day_of_week: string
          id?: string
          is_optional?: boolean
          professor?: string | null
          target_years?: string
          time_slot: string
          title: string
          week_rotation?: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          day_of_week?: string
          id?: string
          is_optional?: boolean
          professor?: string | null
          target_years?: string
          time_slot?: string
          title?: string
          week_rotation?: number
          xp_reward?: number
        }
        Relationships: []
      }
      fichas: {
        Row: {
          age: number | null
          blood_status: string | null
          character_name: string
          created_at: string
          history: string | null
          id: string
          patronus: string | null
          primary_house: string | null
          school_year: number | null
          status: string
          user_id: string
          wand: string | null
        }
        Insert: {
          age?: number | null
          blood_status?: string | null
          character_name: string
          created_at?: string
          history?: string | null
          id?: string
          patronus?: string | null
          primary_house?: string | null
          school_year?: number | null
          status?: string
          user_id: string
          wand?: string | null
        }
        Update: {
          age?: number | null
          blood_status?: string | null
          character_name?: string
          created_at?: string
          history?: string | null
          id?: string
          patronus?: string | null
          primary_house?: string | null
          school_year?: number | null
          status?: string
          user_id?: string
          wand?: string | null
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      house_points: {
        Row: {
          awarded_by: string | null
          created_at: string
          house: Database["public"]["Enums"]["house_type"]
          id: string
          points: number
          reason: string | null
        }
        Insert: {
          awarded_by?: string | null
          created_at?: string
          house: Database["public"]["Enums"]["house_type"]
          id?: string
          points?: number
          reason?: string | null
        }
        Update: {
          awarded_by?: string | null
          created_at?: string
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          points?: number
          reason?: string | null
        }
        Relationships: []
      }
      insta_posts: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          likes: string[]
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          likes?: string[]
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          likes?: string[]
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_log: {
        Row: {
          action: string
          content_id: string | null
          content_type: string
          created_at: string
          id: string
          original_content: string | null
          reason: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          content_id?: string | null
          content_type: string
          created_at?: string
          id?: string
          original_content?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          content_id?: string | null
          content_type?: string
          created_at?: string
          id?: string
          original_content?: string | null
          reason?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string
          id: string
          reactions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reactions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reactions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number
          approved: boolean
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          full_name: string
          has_seen_intro: boolean | null
          house: Database["public"]["Enums"]["house_type"]
          id: string
          last_seen: string | null
          level: number
          online: boolean
          role: string | null
          updated_at: string
          user_id: string
          username: string
          xp: number
          xp_to_next: number
        }
        Insert: {
          age?: number
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          has_seen_intro?: boolean | null
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          last_seen?: string | null
          level?: number
          online?: boolean
          role?: string | null
          updated_at?: string
          user_id: string
          username: string
          xp?: number
          xp_to_next?: number
        }
        Update: {
          age?: number
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          full_name?: string
          has_seen_intro?: boolean | null
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          last_seen?: string | null
          level?: number
          online?: boolean
          role?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          xp?: number
          xp_to_next?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stickers: {
        Row: {
          character_name: string
          created_at: string
          house: string | null
          id: string
          image_url: string
          level_required: number
          rarity: string
        }
        Insert: {
          character_name: string
          created_at?: string
          house?: string | null
          id?: string
          image_url?: string
          level_required?: number
          rarity?: string
        }
        Update: {
          character_name?: string
          created_at?: string
          house?: string | null
          id?: string
          image_url?: string
          level_required?: number
          rarity?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          caption: string | null
          content: string | null
          created_at: string
          expires_at: string
          id: string
          image_url: string | null
          media_url: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          media_url?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          content?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          image_url?: string | null
          media_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_challenges: {
        Row: {
          challenge_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          progress: number | null
          proof: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number | null
          proof?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number | null
          proof?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cooldowns: {
        Row: {
          id: string
          last_enigma_at: string | null
          last_message_at: string | null
          last_post_at: string | null
          last_reaction_at: string | null
          minute_started_at: string | null
          updated_at: string
          user_id: string
          xp_gained_this_minute: number | null
        }
        Insert: {
          id?: string
          last_enigma_at?: string | null
          last_message_at?: string | null
          last_post_at?: string | null
          last_reaction_at?: string | null
          minute_started_at?: string | null
          updated_at?: string
          user_id: string
          xp_gained_this_minute?: number | null
        }
        Update: {
          id?: string
          last_enigma_at?: string | null
          last_message_at?: string | null
          last_post_at?: string | null
          last_reaction_at?: string | null
          minute_started_at?: string | null
          updated_at?: string
          user_id?: string
          xp_gained_this_minute?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stickers: {
        Row: {
          id: string
          obtained_at: string
          sticker_id: string
          user_id: string
        }
        Insert: {
          id?: string
          obtained_at?: string
          sticker_id: string
          user_id: string
        }
        Update: {
          id?: string
          obtained_at?: string
          sticker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stickers_sticker_id_fkey"
            columns: ["sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp_action: {
        Args: { _action: string; _user_id: string; _xp: number }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      house_type: "gryffindor" | "slytherin" | "ravenclaw" | "hufflepuff"
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
      app_role: ["admin", "moderator", "user"],
      house_type: ["gryffindor", "slytherin", "ravenclaw", "hufflepuff"],
    },
  },
} as const
