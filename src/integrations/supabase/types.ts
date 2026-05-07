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
          clicks: number | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          link: string
          title: string
        }
        Insert: {
          active?: boolean
          ad_type?: string
          clicks?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string
          title: string
        }
        Update: {
          active?: boolean
          ad_type?: string
          clicks?: number | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          link?: string
          title?: string
        }
        Relationships: []
      }
      azkaban_status: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          reason: string | null
          release_at: string
          user_id: string
          xp_penalty: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          reason?: string | null
          release_at: string
          user_id: string
          xp_penalty?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          reason?: string | null
          release_at?: string
          user_id?: string
          xp_penalty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "azkaban_status_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          name: string
          rarity: string | null
          xp_required: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity?: string | null
          xp_required?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: string | null
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
      canon_claims: {
        Row: {
          canon_name: string
          claimed_by: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          canon_name: string
          claimed_by?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          canon_name?: string
          claimed_by?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
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
          is_disabled: boolean | null
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
          is_disabled?: boolean | null
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
          is_disabled?: boolean | null
          is_premium?: boolean | null
          meet_link?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          actor_faceclaim: string | null
          adult_job: string | null
          age: number | null
          age_category: string
          avatar_url: string | null
          background: string | null
          blood_status: string | null
          canon_era: string | null
          canon_notes: string | null
          canon_portrayed_by: string | null
          character_type: string
          created_at: string | null
          dreams: string | null
          family_father: string | null
          family_mother: string | null
          family_relatives: string | null
          family_siblings: string | null
          favorite_class: string | null
          favorite_spell: string | null
          fears: string | null
          full_name: string
          gender: string
          history: string | null
          house: Database["public"]["Enums"]["house_type"] | null
          id: string
          instagram: string | null
          level: number | null
          pair_character_id: string | null
          patronus: string | null
          personality: string | null
          pet: string | null
          pet_avatar: string | null
          pet_name: string | null
          physical_description: string | null
          quotes: string | null
          relationship_status: string | null
          secrets: string | null
          strength: string | null
          user_id: string
          wand: string | null
          weakness: string | null
          xp: number | null
          xp_to_next: number | null
        }
        Insert: {
          actor_faceclaim?: string | null
          adult_job?: string | null
          age?: number | null
          age_category?: string
          avatar_url?: string | null
          background?: string | null
          blood_status?: string | null
          canon_era?: string | null
          canon_notes?: string | null
          canon_portrayed_by?: string | null
          character_type: string
          created_at?: string | null
          dreams?: string | null
          family_father?: string | null
          family_mother?: string | null
          family_relatives?: string | null
          family_siblings?: string | null
          favorite_class?: string | null
          favorite_spell?: string | null
          fears?: string | null
          full_name: string
          gender?: string
          history?: string | null
          house?: Database["public"]["Enums"]["house_type"] | null
          id?: string
          instagram?: string | null
          level?: number | null
          pair_character_id?: string | null
          patronus?: string | null
          personality?: string | null
          pet?: string | null
          pet_avatar?: string | null
          pet_name?: string | null
          physical_description?: string | null
          quotes?: string | null
          relationship_status?: string | null
          secrets?: string | null
          strength?: string | null
          user_id: string
          wand?: string | null
          weakness?: string | null
          xp?: number | null
          xp_to_next?: number | null
        }
        Update: {
          actor_faceclaim?: string | null
          adult_job?: string | null
          age?: number | null
          age_category?: string
          avatar_url?: string | null
          background?: string | null
          blood_status?: string | null
          canon_era?: string | null
          canon_notes?: string | null
          canon_portrayed_by?: string | null
          character_type?: string
          created_at?: string | null
          dreams?: string | null
          family_father?: string | null
          family_mother?: string | null
          family_relatives?: string | null
          family_siblings?: string | null
          favorite_class?: string | null
          favorite_spell?: string | null
          fears?: string | null
          full_name?: string
          gender?: string
          history?: string | null
          house?: Database["public"]["Enums"]["house_type"] | null
          id?: string
          instagram?: string | null
          level?: number | null
          pair_character_id?: string | null
          patronus?: string | null
          personality?: string | null
          pet?: string | null
          pet_avatar?: string | null
          pet_name?: string | null
          physical_description?: string | null
          quotes?: string | null
          relationship_status?: string | null
          secrets?: string | null
          strength?: string | null
          user_id?: string
          wand?: string | null
          weakness?: string | null
          xp?: number | null
          xp_to_next?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_pair_character_id_fkey"
            columns: ["pair_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
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
      couples: {
        Row: {
          character1_id: string
          character2_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          character1_id: string
          character2_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          character1_id?: string
          character2_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "couples_character1_id_fkey"
            columns: ["character1_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "couples_character2_id_fkey"
            columns: ["character2_id"]
            isOneToOne: true
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
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
          last_interaction_at: string | null
          status: string
          streak_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          last_interaction_at?: string | null
          status?: string
          streak_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          last_interaction_at?: string | null
          status?: string
          streak_count?: number | null
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
      galeon_orders: {
        Row: {
          amount_brl: number
          created_at: string | null
          galeons: number
          id: string
          infinitepay_id: string | null
          package_id: string
          paid_at: string | null
          payment_link: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_brl: number
          created_at?: string | null
          galeons: number
          id?: string
          infinitepay_id?: string | null
          package_id: string
          paid_at?: string | null
          payment_link?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string | null
          galeons?: number
          id?: string
          infinitepay_id?: string | null
          package_id?: string
          paid_at?: string | null
          payment_link?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "galeon_orders_user_id_fkey"
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
      insta_character_follows: {
        Row: {
          created_at: string | null
          followed_char_id: string
          follower_user_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_char_id: string
          follower_user_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_char_id?: string
          follower_user_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insta_character_follows_followed_char_id_fkey"
            columns: ["followed_char_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insta_character_follows_follower_user_id_fkey"
            columns: ["follower_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      insta_follows: {
        Row: {
          created_at: string | null
          followed_user_id: string
          follower_user_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          followed_user_id: string
          follower_user_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          followed_user_id?: string
          follower_user_id?: string
          id?: string
        }
        Relationships: []
      }
      insta_posts: {
        Row: {
          caption: string | null
          character_id: string | null
          created_at: string
          id: string
          image_url: string
          likes: string[]
          spotify_uri: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          character_id?: string | null
          created_at?: string
          id?: string
          image_url: string
          likes?: string[]
          spotify_uri?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          character_id?: string | null
          created_at?: string
          id?: string
          image_url?: string
          likes?: string[]
          spotify_uri?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insta_posts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel_id: string
          character_id: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          user_id: string
        }
        Insert: {
          channel_id: string
          character_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          user_id: string
        }
        Update: {
          channel_id?: string
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
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
          {
            foreignKeyName: "messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
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
          character_id: string | null
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
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
          character_id: string | null
          content: string
          created_at: string
          id: string
          music_url: string | null
          reactions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          content: string
          created_at?: string
          id?: string
          music_url?: string | null
          reactions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          music_url?: string | null
          reactions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_character_id: string | null
          age: number
          approved: boolean
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string
          current_session_id: string | null
          full_name: string
          galeons: number | null
          has_accepted_rules: boolean | null
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
          vip_expires_at: string | null
          vip_plan: string | null
          xp: number
          xp_to_next: number
        }
        Insert: {
          active_character_id?: string | null
          age?: number
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          current_session_id?: string | null
          full_name?: string
          galeons?: number | null
          has_accepted_rules?: boolean | null
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
          vip_expires_at?: string | null
          vip_plan?: string | null
          xp?: number
          xp_to_next?: number
        }
        Update: {
          active_character_id?: string | null
          age?: number
          approved?: boolean
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string
          current_session_id?: string | null
          full_name?: string
          galeons?: number | null
          has_accepted_rules?: boolean | null
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
          vip_expires_at?: string | null
          vip_plan?: string | null
          xp?: number
          xp_to_next?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_active_character"
            columns: ["active_character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          invited_id: string | null
          inviter_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_id?: string | null
          inviter_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_id?: string | null
          inviter_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_invited_id_fkey"
            columns: ["invited_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "referrals_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
      sticker_trades: {
        Row: {
          accepted_at: string | null
          accepted_by_id: string | null
          created_at: string | null
          id: string
          offered_sticker_id: string
          offerer_id: string
          status: string | null
          wanted_sticker_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_id?: string | null
          created_at?: string | null
          id?: string
          offered_sticker_id: string
          offerer_id: string
          status?: string | null
          wanted_sticker_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_id?: string | null
          created_at?: string | null
          id?: string
          offered_sticker_id?: string
          offerer_id?: string
          status?: string | null
          wanted_sticker_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sticker_trades_offered_sticker_id_fkey"
            columns: ["offered_sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sticker_trades_wanted_sticker_id_fkey"
            columns: ["wanted_sticker_id"]
            isOneToOne: false
            referencedRelation: "stickers"
            referencedColumns: ["id"]
          },
        ]
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
      store_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price_galeons: number
          rarity: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price_galeons: number
          rarity?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price_galeons?: number
          rarity?: string | null
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
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string | null
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string | null
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_logs: {
        Row: {
          created_at: string | null
          id: string
          level: string
          message: string
          stack: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          level: string
          message: string
          stack?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string
          message?: string
          stack?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
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
          proof_url: string | null
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
          proof_url?: string | null
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
          proof_url?: string | null
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
      user_items: {
        Row: {
          character_id: string | null
          id: string
          item_id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          character_id?: string | null
          id?: string
          item_id: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          character_id?: string | null
          id?: string
          item_id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_items_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "store_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
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
          quantity: number | null
          sticker_id: string
          user_id: string
        }
        Insert: {
          id?: string
          obtained_at?: string
          quantity?: number | null
          sticker_id: string
          user_id: string
        }
        Update: {
          id?: string
          obtained_at?: string
          quantity?: number | null
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
      vip_subscriptions: {
        Row: {
          amount_brl: number
          expires_at: string
          galeons_monthly: number | null
          id: string
          infinitepay_id: string | null
          plan: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount_brl: number
          expires_at: string
          galeons_monthly?: number | null
          id?: string
          infinitepay_id?: string | null
          plan: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount_brl?: number
          expires_at?: string
          galeons_monthly?: number | null
          id?: string
          infinitepay_id?: string | null
          plan?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp_action:
        | {
            Args: { _action: string; _user_id: string; _xp: number }
            Returns: undefined
          }
        | {
            Args: { _action: string; _user_id: string; _xp: number }
            Returns: undefined
          }
      complete_referral_action: {
        Args: { _invited_id: string }
        Returns: undefined
      }
      create_infinitepay_link: {
        Args: {
          p_amount_brl: number
          p_description: string
          p_galeons?: number
          p_order_id: string
          p_user_email: string
          p_user_id: string
          p_user_name: string
          p_vip_plan?: string
        }
        Returns: Json
      }
      get_payment_link: {
        Args: { p_order_id: string; p_request_id: number }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      start_payment_request: {
        Args: {
          p_amount_brl: number
          p_description: string
          p_order_id: string
          p_user_email: string
          p_user_id: string
          p_user_name: string
        }
        Returns: Json
      }
      verify_infinitepay_payment: {
        Args: {
          p_order_nsu: string
          p_slug?: string
          p_transaction_nsu: string
        }
        Returns: Json
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
