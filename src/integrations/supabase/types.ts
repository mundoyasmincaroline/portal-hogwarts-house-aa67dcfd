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
      auction_bids: {
        Row: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          auction_id: string
          bidder_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          auction_id?: string
          bidder_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auction_bids_auction_id_fkey"
            columns: ["auction_id"]
            isOneToOne: false
            referencedRelation: "auctions"
            referencedColumns: ["id"]
          },
        ]
      }
      auctions: {
        Row: {
          created_at: string
          current_bid: number
          current_winner: string | null
          description: string | null
          ends_at: string
          id: string
          seller_id: string
          starting_bid: number
          status: string
          sticker_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          current_bid?: number
          current_winner?: string | null
          description?: string | null
          ends_at: string
          id?: string
          seller_id: string
          starting_bid?: number
          status?: string
          sticker_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          current_bid?: number
          current_winner?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          seller_id?: string
          starting_bid?: number
          status?: string
          sticker_id?: string | null
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
      bank_loans: {
        Row: {
          amount: number
          created_at: string
          due_at: string
          id: string
          interest_pct: number
          paid: number
          status: string
          total_due: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_at: string
          id?: string
          interest_pct?: number
          paid?: number
          status?: string
          total_due: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_at?: string
          id?: string
          interest_pct?: number
          paid?: number
          status?: string
          total_due?: number
          user_id?: string
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
      battle_pass_rewards: {
        Row: {
          created_at: string | null
          id: string
          is_premium: boolean | null
          level_required: number
          pass_id: string | null
          reward_type: string
          reward_value: Json
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          level_required: number
          pass_id?: string | null
          reward_type: string
          reward_value: Json
        }
        Update: {
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          level_required?: number
          pass_id?: string | null
          reward_type?: string
          reward_value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "battle_pass_rewards_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "battle_passes"
            referencedColumns: ["id"]
          },
        ]
      }
      battle_passes: {
        Row: {
          active: boolean | null
          created_at: string | null
          end_date: string
          id: string
          season_name: string
          start_date: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          end_date: string
          id?: string
          season_name: string
          start_date: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          end_date?: string
          id?: string
          season_name?: string
          start_date?: string
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
      canon_professors: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          bio: string | null
          canon_name: string
          catchphrase: string | null
          created_at: string
          difficulty: number | null
          id: string
          subject: string
          title: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          canon_name: string
          catchphrase?: string | null
          created_at?: string
          difficulty?: number | null
          id?: string
          subject: string
          title?: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          bio?: string | null
          canon_name?: string
          catchphrase?: string | null
          created_at?: string
          difficulty?: number | null
          id?: string
          subject?: string
          title?: string
        }
        Relationships: []
      }
      castle_rooms: {
        Row: {
          description: string
          emoji: string | null
          event_chance: number
          event_payload: Json | null
          id: string
          name: string
          pos_x: number
          pos_y: number
          room_type: string
          slug: string
          unlock_level: number
        }
        Insert: {
          description: string
          emoji?: string | null
          event_chance?: number
          event_payload?: Json | null
          id?: string
          name: string
          pos_x?: number
          pos_y?: number
          room_type?: string
          slug: string
          unlock_level?: number
        }
        Update: {
          description?: string
          emoji?: string | null
          event_chance?: number
          event_payload?: Json | null
          id?: string
          name?: string
          pos_x?: number
          pos_y?: number
          room_type?: string
          slug?: string
          unlock_level?: number
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
          pinned_message_id: string | null
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
          pinned_message_id?: string | null
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
          pinned_message_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_pinned_message_id_fkey"
            columns: ["pinned_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      character_infractions: {
        Row: {
          context: string | null
          created_at: string
          detail: string | null
          id: string
          points_lost: number
          reason: string
          user_id: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          points_lost?: number
          reason: string
          user_id: string
        }
        Update: {
          context?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          points_lost?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      character_spells: {
        Row: {
          character_id: string
          id: string
          learned_at: string
          learned_from: string | null
          mastery: number
          spell_id: string
          times_cast: number
        }
        Insert: {
          character_id: string
          id?: string
          learned_at?: string
          learned_from?: string | null
          mastery?: number
          spell_id: string
          times_cast?: number
        }
        Update: {
          character_id?: string
          id?: string
          learned_at?: string
          learned_from?: string | null
          mastery?: number
          spell_id?: string
          times_cast?: number
        }
        Relationships: []
      }
      characters: {
        Row: {
          actor_faceclaim: string | null
          adult_job: string | null
          age: number | null
          age_category: string
          alignment: string | null
          amortentia: string | null
          animago_form: string | null
          avatar_url: string | null
          background: string | null
          best_subject: string | null
          birthday: string | null
          blood_locked: boolean
          blood_status: string | null
          boggart: string | null
          broomstick: string | null
          canon_era: string | null
          canon_notes: string | null
          canon_portrayed_by: string | null
          character_type: string
          created_at: string | null
          dreams: string | null
          faction: string | null
          family_father: string | null
          family_mother: string | null
          family_relatives: string | null
          family_siblings: string | null
          father_id: string | null
          favorite_class: string | null
          favorite_spell: string | null
          fears: string | null
          full_name: string
          gender: string
          history: string | null
          hobbies: string | null
          house: Database["public"]["Enums"]["house_type"] | null
          hp: number | null
          id: string
          instagram: string | null
          level: number | null
          max_hp: number | null
          mbti: string | null
          mirror_of_erised: string | null
          mother_id: string | null
          nationality: string | null
          pair_character_id: string | null
          patronus: string | null
          personality: string | null
          pet: string | null
          pet_avatar: string | null
          pet_name: string | null
          physical_description: string | null
          quidditch_position: string | null
          quotes: string | null
          relationship_status: string | null
          school_year: number | null
          secrets: string | null
          special_skills: string | null
          strength: string | null
          user_id: string
          wand: string | null
          wand_core: string | null
          wand_flexibility: string | null
          wand_length: string | null
          wand_wood: string | null
          weakness: string | null
          worst_subject: string | null
          xp: number | null
          xp_to_next: number | null
        }
        Insert: {
          actor_faceclaim?: string | null
          adult_job?: string | null
          age?: number | null
          age_category?: string
          alignment?: string | null
          amortentia?: string | null
          animago_form?: string | null
          avatar_url?: string | null
          background?: string | null
          best_subject?: string | null
          birthday?: string | null
          blood_locked?: boolean
          blood_status?: string | null
          boggart?: string | null
          broomstick?: string | null
          canon_era?: string | null
          canon_notes?: string | null
          canon_portrayed_by?: string | null
          character_type: string
          created_at?: string | null
          dreams?: string | null
          faction?: string | null
          family_father?: string | null
          family_mother?: string | null
          family_relatives?: string | null
          family_siblings?: string | null
          father_id?: string | null
          favorite_class?: string | null
          favorite_spell?: string | null
          fears?: string | null
          full_name: string
          gender?: string
          history?: string | null
          hobbies?: string | null
          house?: Database["public"]["Enums"]["house_type"] | null
          hp?: number | null
          id?: string
          instagram?: string | null
          level?: number | null
          max_hp?: number | null
          mbti?: string | null
          mirror_of_erised?: string | null
          mother_id?: string | null
          nationality?: string | null
          pair_character_id?: string | null
          patronus?: string | null
          personality?: string | null
          pet?: string | null
          pet_avatar?: string | null
          pet_name?: string | null
          physical_description?: string | null
          quidditch_position?: string | null
          quotes?: string | null
          relationship_status?: string | null
          school_year?: number | null
          secrets?: string | null
          special_skills?: string | null
          strength?: string | null
          user_id: string
          wand?: string | null
          wand_core?: string | null
          wand_flexibility?: string | null
          wand_length?: string | null
          wand_wood?: string | null
          weakness?: string | null
          worst_subject?: string | null
          xp?: number | null
          xp_to_next?: number | null
        }
        Update: {
          actor_faceclaim?: string | null
          adult_job?: string | null
          age?: number | null
          age_category?: string
          alignment?: string | null
          amortentia?: string | null
          animago_form?: string | null
          avatar_url?: string | null
          background?: string | null
          best_subject?: string | null
          birthday?: string | null
          blood_locked?: boolean
          blood_status?: string | null
          boggart?: string | null
          broomstick?: string | null
          canon_era?: string | null
          canon_notes?: string | null
          canon_portrayed_by?: string | null
          character_type?: string
          created_at?: string | null
          dreams?: string | null
          faction?: string | null
          family_father?: string | null
          family_mother?: string | null
          family_relatives?: string | null
          family_siblings?: string | null
          father_id?: string | null
          favorite_class?: string | null
          favorite_spell?: string | null
          fears?: string | null
          full_name?: string
          gender?: string
          history?: string | null
          hobbies?: string | null
          house?: Database["public"]["Enums"]["house_type"] | null
          hp?: number | null
          id?: string
          instagram?: string | null
          level?: number | null
          max_hp?: number | null
          mbti?: string | null
          mirror_of_erised?: string | null
          mother_id?: string | null
          nationality?: string | null
          pair_character_id?: string | null
          patronus?: string | null
          personality?: string | null
          pet?: string | null
          pet_avatar?: string | null
          pet_name?: string | null
          physical_description?: string | null
          quidditch_position?: string | null
          quotes?: string | null
          relationship_status?: string | null
          school_year?: number | null
          secrets?: string | null
          special_skills?: string | null
          strength?: string | null
          user_id?: string
          wand?: string | null
          wand_core?: string | null
          wand_flexibility?: string | null
          wand_length?: string | null
          wand_wood?: string | null
          weakness?: string | null
          worst_subject?: string | null
          xp?: number | null
          xp_to_next?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_father_id_fkey"
            columns: ["father_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_mother_id_fkey"
            columns: ["mother_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
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
      club_members: {
        Row: {
          club_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
          weekly_xp: number
        }
        Insert: {
          club_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
          weekly_xp?: number
        }
        Update: {
          club_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
          weekly_xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "club_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          description: string | null
          emblem: string | null
          founded_by: string | null
          id: string
          meeting_day: string | null
          name: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          emblem?: string | null
          founded_by?: string | null
          id?: string
          meeting_day?: string | null
          name: string
          slug: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          emblem?: string | null
          founded_by?: string | null
          id?: string
          meeting_day?: string | null
          name?: string
          slug?: string
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
      creatures: {
        Row: {
          active: boolean | null
          created_at: string | null
          danger_level: number | null
          description: string | null
          drops: Json | null
          habitat: string | null
          id: string
          image_url: string | null
          name: string
          rarity: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          danger_level?: number | null
          description?: string | null
          drops?: Json | null
          habitat?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          danger_level?: number | null
          description?: string | null
          drops?: Json | null
          habitat?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: string | null
        }
        Relationships: []
      }
      currency_ledger: {
        Row: {
          amount: number
          created_at: string | null
          currency_type: string
          description: string | null
          id: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency_type: string
          description?: string | null
          id?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency_type?: string
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      daily_missions_catalog: {
        Row: {
          action_type: string
          active: boolean
          created_at: string
          description: string
          galeons_reward: number
          goal: number
          icon: string
          id: string
          title: string
          xp_reward: number
        }
        Insert: {
          action_type: string
          active?: boolean
          created_at?: string
          description?: string
          galeons_reward?: number
          goal?: number
          icon?: string
          id?: string
          title: string
          xp_reward?: number
        }
        Update: {
          action_type?: string
          active?: boolean
          created_at?: string
          description?: string
          galeons_reward?: number
          goal?: number
          icon?: string
          id?: string
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      daily_prophet_news: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_ai_generated: boolean | null
          title: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          title: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_ai_generated?: boolean | null
          title?: string
        }
        Relationships: []
      }
      detentions: {
        Row: {
          assigned_by: string | null
          completed_at: string | null
          created_at: string
          hours: number
          id: string
          points_deducted: number
          reason: string
          status: string
          task_description: string | null
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          hours?: number
          id?: string
          points_deducted?: number
          reason: string
          status?: string
          task_description?: string | null
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          hours?: number
          id?: string
          points_deducted?: number
          reason?: string
          status?: string
          task_description?: string | null
          user_id?: string
        }
        Relationships: []
      }
      diary_entries: {
        Row: {
          ai_reflection: string | null
          character_id: string | null
          content: string
          created_at: string
          id: string
          is_private: boolean
          mood: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_reflection?: string | null
          character_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_reflection?: string | null
          character_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_private?: boolean
          mood?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      duel_actions: {
        Row: {
          created_at: string | null
          damage: number
          healed: number
          id: string
          log_text: string | null
          match_id: string
          player: string
          shielded: number
          spell_code: string
          turn: number
        }
        Insert: {
          created_at?: string | null
          damage?: number
          healed?: number
          id?: string
          log_text?: string | null
          match_id: string
          player: string
          shielded?: number
          spell_code: string
          turn: number
        }
        Update: {
          created_at?: string | null
          damage?: number
          healed?: number
          id?: string
          log_text?: string | null
          match_id?: string
          player?: string
          shielded?: number
          spell_code?: string
          turn?: number
        }
        Relationships: [
          {
            foreignKeyName: "duel_actions_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "duel_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      duel_matches: {
        Row: {
          created_at: string | null
          current_turn: string | null
          finished_at: string | null
          galeon_reward: number
          hp_a: number
          hp_b: number
          id: string
          mp_a: number
          mp_b: number
          player_a: string
          player_b: string
          shield_a: number
          shield_b: number
          started_at: string | null
          status: string
          turn_number: number
          winner: string | null
          xp_reward: number
        }
        Insert: {
          created_at?: string | null
          current_turn?: string | null
          finished_at?: string | null
          galeon_reward?: number
          hp_a?: number
          hp_b?: number
          id?: string
          mp_a?: number
          mp_b?: number
          player_a: string
          player_b: string
          shield_a?: number
          shield_b?: number
          started_at?: string | null
          status?: string
          turn_number?: number
          winner?: string | null
          xp_reward?: number
        }
        Update: {
          created_at?: string | null
          current_turn?: string | null
          finished_at?: string | null
          galeon_reward?: number
          hp_a?: number
          hp_b?: number
          id?: string
          mp_a?: number
          mp_b?: number
          player_a?: string
          player_b?: string
          shield_a?: number
          shield_b?: number
          started_at?: string | null
          status?: string
          turn_number?: number
          winner?: string | null
          xp_reward?: number
        }
        Relationships: []
      }
      duel_spells: {
        Row: {
          code: string
          created_at: string | null
          damage: number
          description: string | null
          heal: number
          icon: string | null
          id: string
          level_req: number
          mp_cost: number
          name: string
          shield: number
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          damage?: number
          description?: string | null
          heal?: number
          icon?: string | null
          id?: string
          level_req?: number
          mp_cost?: number
          name: string
          shield?: number
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          damage?: number
          description?: string | null
          heal?: number
          icon?: string | null
          id?: string
          level_req?: number
          mp_cost?: number
          name?: string
          shield?: number
          type?: string
        }
        Relationships: []
      }
      duel_turns: {
        Row: {
          actor: string
          created_at: string
          damage: number | null
          duel_id: string
          hit: boolean | null
          id: string
          narrative: string | null
          spell_id: string | null
          spell_name: string
          turn_number: number
        }
        Insert: {
          actor: string
          created_at?: string
          damage?: number | null
          duel_id: string
          hit?: boolean | null
          id?: string
          narrative?: string | null
          spell_id?: string | null
          spell_name: string
          turn_number: number
        }
        Update: {
          actor?: string
          created_at?: string
          damage?: number | null
          duel_id?: string
          hit?: boolean | null
          id?: string
          narrative?: string | null
          spell_id?: string | null
          spell_name?: string
          turn_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "duel_turns_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "duels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duel_turns_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spells"
            referencedColumns: ["id"]
          },
        ]
      }
      duels: {
        Row: {
          challenger_character_id: string
          challenger_hp: number | null
          challenger_user_id: string
          created_at: string
          current_turn: string | null
          finished_at: string | null
          galeons_reward: number | null
          id: string
          opponent_canon_name: string | null
          opponent_character_id: string | null
          opponent_hp: number | null
          opponent_type: string
          opponent_user_id: string | null
          status: string | null
          winner: string | null
          xp_reward: number | null
        }
        Insert: {
          challenger_character_id: string
          challenger_hp?: number | null
          challenger_user_id: string
          created_at?: string
          current_turn?: string | null
          finished_at?: string | null
          galeons_reward?: number | null
          id?: string
          opponent_canon_name?: string | null
          opponent_character_id?: string | null
          opponent_hp?: number | null
          opponent_type?: string
          opponent_user_id?: string | null
          status?: string | null
          winner?: string | null
          xp_reward?: number | null
        }
        Update: {
          challenger_character_id?: string
          challenger_hp?: number | null
          challenger_user_id?: string
          created_at?: string
          current_turn?: string | null
          finished_at?: string | null
          galeons_reward?: number | null
          id?: string
          opponent_canon_name?: string | null
          opponent_character_id?: string | null
          opponent_hp?: number | null
          opponent_type?: string
          opponent_user_id?: string | null
          status?: string | null
          winner?: string | null
          xp_reward?: number | null
        }
        Relationships: []
      }
      endorsements: {
        Row: {
          created_at: string
          from_user: string
          id: string
          note: string | null
          to_user: string
          type: string
        }
        Insert: {
          created_at?: string
          from_user: string
          id?: string
          note?: string | null
          to_user: string
          type: string
        }
        Update: {
          created_at?: string
          from_user?: string
          id?: string
          note?: string | null
          to_user?: string
          type?: string
        }
        Relationships: []
      }
      event_attendees: {
        Row: {
          attended: boolean
          event_id: string
          id: string
          joined_at: string
          rsvp: string
          user_id: string
        }
        Insert: {
          attended?: boolean
          event_id: string
          id?: string
          joined_at?: string
          rsvp?: string
          user_id: string
        }
        Update: {
          attended?: boolean
          event_id?: string
          id?: string
          joined_at?: string
          rsvp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "live_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_chat: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_chat_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "live_events"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          answers: Json | null
          exam_id: string
          grade: string
          id: string
          passed: boolean
          percentage: number
          score: number
          taken_at: string
          total: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          exam_id: string
          grade: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          taken_at?: string
          total?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          exam_id?: string
          grade?: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          taken_at?: string
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_index: number
          exam_id: string
          explanation: string | null
          id: string
          options: Json
          order_idx: number
          question: string
        }
        Insert: {
          correct_index: number
          exam_id: string
          explanation?: string | null
          id?: string
          options: Json
          order_idx?: number
          question: string
        }
        Update: {
          correct_index?: number
          exam_id?: string
          explanation?: string | null
          id?: string
          options?: Json
          order_idx?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_minutes: number
          exam_type: string
          galeons_reward: number
          id: string
          min_year: number
          passing_percentage: number
          subject: string
          title: string
          xp_reward: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_type?: string
          galeons_reward?: number
          id?: string
          min_year?: number
          passing_percentage?: number
          subject: string
          title: string
          xp_reward?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_type?: string
          galeons_reward?: number
          id?: string
          min_year?: number
          passing_percentage?: number
          subject?: string
          title?: string
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
      guild_members: {
        Row: {
          contributed_xp: number
          guild_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          contributed_xp?: number
          guild_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          contributed_xp?: number
          guild_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guild_members_guild_id_fkey"
            columns: ["guild_id"]
            isOneToOne: false
            referencedRelation: "guilds"
            referencedColumns: ["id"]
          },
        ]
      }
      guilds: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          emblem: string | null
          house: Database["public"]["Enums"]["house_type"]
          id: string
          leader_id: string
          name: string
          total_xp: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          emblem?: string | null
          house: Database["public"]["Enums"]["house_type"]
          id?: string
          leader_id: string
          name: string
          total_xp?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          emblem?: string | null
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          leader_id?: string
          name?: string
          total_xp?: number
        }
        Relationships: []
      }
      hogsmeade_items: {
        Row: {
          active: boolean
          category: string
          consumable: boolean
          created_at: string
          description: string | null
          emoji: string
          equippable: boolean
          id: string
          name: string
          price_galeons: number
          rarity: string
          stock_limit: number | null
          tradable: boolean
        }
        Insert: {
          active?: boolean
          category: string
          consumable?: boolean
          created_at?: string
          description?: string | null
          emoji?: string
          equippable?: boolean
          id?: string
          name: string
          price_galeons: number
          rarity?: string
          stock_limit?: number | null
          tradable?: boolean
        }
        Update: {
          active?: boolean
          category?: string
          consumable?: boolean
          created_at?: string
          description?: string | null
          emoji?: string
          equippable?: boolean
          id?: string
          name?: string
          price_galeons?: number
          rarity?: string
          stock_limit?: number | null
          tradable?: boolean
        }
        Relationships: []
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
      house_war_scores: {
        Row: {
          house: Database["public"]["Enums"]["house_type"]
          id: string
          points: number
          updated_at: string
          war_id: string
        }
        Insert: {
          house: Database["public"]["Enums"]["house_type"]
          id?: string
          points?: number
          updated_at?: string
          war_id: string
        }
        Update: {
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          points?: number
          updated_at?: string
          war_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "house_war_scores_war_id_fkey"
            columns: ["war_id"]
            isOneToOne: false
            referencedRelation: "house_wars"
            referencedColumns: ["id"]
          },
        ]
      }
      house_wars: {
        Row: {
          created_at: string
          id: string
          status: string
          week_end: string
          week_start: string
          winner_house: Database["public"]["Enums"]["house_type"] | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          week_end: string
          week_start: string
          winner_house?: Database["public"]["Enums"]["house_type"] | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          week_end?: string
          week_start?: string
          winner_house?: Database["public"]["Enums"]["house_type"] | null
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
      insta_comments: {
        Row: {
          character_id: string | null
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insta_comments_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insta_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "insta_posts"
            referencedColumns: ["id"]
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
      item_trades: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          message: string | null
          offered_galeons: number
          offered_item_id: string | null
          offered_qty: number
          recipient_id: string
          requested_galeons: number
          requested_item_id: string | null
          requested_qty: number
          resolved_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offered_galeons?: number
          offered_item_id?: string | null
          offered_qty?: number
          recipient_id: string
          requested_galeons?: number
          requested_item_id?: string | null
          requested_qty?: number
          resolved_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          offered_galeons?: number
          offered_item_id?: string | null
          offered_qty?: number
          recipient_id?: string
          requested_galeons?: number
          requested_item_id?: string | null
          requested_qty?: number
          resolved_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_trades_offered_item_id_fkey"
            columns: ["offered_item_id"]
            isOneToOne: false
            referencedRelation: "hogsmeade_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_trades_requested_item_id_fkey"
            columns: ["requested_item_id"]
            isOneToOne: false
            referencedRelation: "hogsmeade_items"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_attendance: {
        Row: {
          attended_at: string
          character_id: string
          id: string
          lesson_id: string
          spell_learned: boolean | null
          user_id: string
        }
        Insert: {
          attended_at?: string
          character_id: string
          id?: string
          lesson_id: string
          spell_learned?: boolean | null
          user_id: string
        }
        Update: {
          attended_at?: string
          character_id?: string
          id?: string
          lesson_id?: string
          spell_learned?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "professor_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      live_events: {
        Row: {
          cover_emoji: string
          created_at: string
          created_by: string
          description: string | null
          ends_at: string
          id: string
          location: string
          max_attendees: number | null
          reward_gold: number
          reward_xp: number
          starts_at: string
          status: string
          title: string
          type: string
        }
        Insert: {
          cover_emoji?: string
          created_at?: string
          created_by: string
          description?: string | null
          ends_at: string
          id?: string
          location?: string
          max_attendees?: number | null
          reward_gold?: number
          reward_xp?: number
          starts_at: string
          status?: string
          title: string
          type?: string
        }
        Update: {
          cover_emoji?: string
          created_at?: string
          created_by?: string
          description?: string | null
          ends_at?: string
          id?: string
          location?: string
          max_attendees?: number | null
          reward_gold?: number
          reward_xp?: number
          starts_at?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          buyer_id: string | null
          created_at: string
          fee_galeons: number | null
          id: string
          price_galeons: number
          seller_id: string
          sold_at: string | null
          status: string
          sticker_id: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          fee_galeons?: number | null
          id?: string
          price_galeons: number
          seller_id: string
          sold_at?: string | null
          status?: string
          sticker_id: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          fee_galeons?: number | null
          id?: string
          price_galeons?: number
          seller_id?: string
          sold_at?: string | null
          status?: string
          sticker_id?: string
        }
        Relationships: []
      }
      mentorships: {
        Row: {
          apprentice_id: string
          apprentice_levels_gained: number
          created_at: string
          ended_at: string | null
          id: string
          mentor_id: string
          started_at: string | null
          status: string
          total_bonus_xp: number
        }
        Insert: {
          apprentice_id: string
          apprentice_levels_gained?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          mentor_id: string
          started_at?: string | null
          status?: string
          total_bonus_xp?: number
        }
        Update: {
          apprentice_id?: string
          apprentice_levels_gained?: number
          created_at?: string
          ended_at?: string | null
          id?: string
          mentor_id?: string
          started_at?: string | null
          status?: string
          total_bonus_xp?: number
        }
        Relationships: []
      }
      merits: {
        Row: {
          created_at: string
          given_by: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          given_by?: string | null
          id?: string
          points?: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          given_by?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
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
      notification_preferences: {
        Row: {
          daily_digest: boolean
          email_enabled: boolean
          in_app: boolean
          push_enabled: boolean
          quiet_hours_end: number | null
          quiet_hours_start: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_digest?: boolean
          email_enabled?: boolean
          in_app?: boolean
          push_enabled?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_digest?: boolean
          email_enabled?: boolean
          in_app?: boolean
          push_enabled?: boolean
          quiet_hours_end?: number | null
          quiet_hours_start?: number | null
          updated_at?: string
          user_id?: string
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
      npc_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          npc_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          npc_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          npc_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "npc_conversations_npc_id_fkey"
            columns: ["npc_id"]
            isOneToOne: false
            referencedRelation: "npcs"
            referencedColumns: ["id"]
          },
        ]
      }
      npcs: {
        Row: {
          avatar_emoji: string | null
          created_at: string
          house: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          personality: string
          role: string
          slug: string
          system_prompt: string
        }
        Insert: {
          avatar_emoji?: string | null
          created_at?: string
          house?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          personality: string
          role: string
          slug: string
          system_prompt: string
        }
        Update: {
          avatar_emoji?: string | null
          created_at?: string
          house?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          personality?: string
          role?: string
          slug?: string
          system_prompt?: string
        }
        Relationships: []
      }
      patronus_invocations: {
        Row: {
          created_at: string | null
          id: string
          strength: number
          success: boolean
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          strength: number
          success: boolean
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          strength?: number
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      patronuses: {
        Row: {
          animal: string
          created_at: string | null
          form_strength: number
          last_invoked_at: string | null
          mastery_level: number
          user_id: string
        }
        Insert: {
          animal: string
          created_at?: string | null
          form_strength?: number
          last_invoked_at?: string | null
          mastery_level?: number
          user_id: string
        }
        Update: {
          animal?: string
          created_at?: string | null
          form_strength?: number
          last_invoked_at?: string | null
          mastery_level?: number
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
      professor_lessons: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          galeons_reward: number | null
          id: string
          max_students: number | null
          professor_id: string
          scheduled_at: string
          spell_id: string | null
          status: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          galeons_reward?: number | null
          id?: string
          max_students?: number | null
          professor_id: string
          scheduled_at?: string
          spell_id?: string | null
          status?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          galeons_reward?: number | null
          id?: string
          max_students?: number | null
          professor_id?: string
          scheduled_at?: string
          spell_id?: string | null
          status?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "professor_lessons_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "canon_professors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_lessons_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spells"
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
          blood_locked: boolean | null
          created_at: string
          current_session_id: string | null
          full_name: string
          galeons: number | null
          has_accepted_rules: boolean | null
          has_seen_intro: boolean | null
          house: Database["public"]["Enums"]["house_type"]
          id: string
          knuts: number | null
          last_seen: string | null
          level: number
          online: boolean
          role: string | null
          rp_last_claim_date: string | null
          rp_streak_best: number
          rp_streak_current: number
          sickles: number | null
          streak_freezes: number
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
          blood_locked?: boolean | null
          created_at?: string
          current_session_id?: string | null
          full_name?: string
          galeons?: number | null
          has_accepted_rules?: boolean | null
          has_seen_intro?: boolean | null
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          knuts?: number | null
          last_seen?: string | null
          level?: number
          online?: boolean
          role?: string | null
          rp_last_claim_date?: string | null
          rp_streak_best?: number
          rp_streak_current?: number
          sickles?: number | null
          streak_freezes?: number
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
          blood_locked?: boolean | null
          created_at?: string
          current_session_id?: string | null
          full_name?: string
          galeons?: number | null
          has_accepted_rules?: boolean | null
          has_seen_intro?: boolean | null
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          knuts?: number | null
          last_seen?: string | null
          level?: number
          online?: boolean
          role?: string | null
          rp_last_claim_date?: string | null
          rp_streak_best?: number
          rp_streak_current?: number
          sickles?: number | null
          streak_freezes?: number
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
      prophecies: {
        Row: {
          created_at: string
          id: string
          prompt: string | null
          prophecy_text: string
          symbol: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt?: string | null
          prophecy_text: string
          symbol?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt?: string | null
          prophecy_text?: string
          symbol?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prophet_articles: {
        Row: {
          category: string
          content: string
          generated_at: string
          id: string
          image_url: string | null
          published: boolean
          title: string
        }
        Insert: {
          category?: string
          content: string
          generated_at?: string
          id?: string
          image_url?: string | null
          published?: boolean
          title: string
        }
        Update: {
          category?: string
          content?: string
          generated_at?: string
          id?: string
          image_url?: string | null
          published?: boolean
          title?: string
        }
        Relationships: []
      }
      quest_choices: {
        Row: {
          choice_text: string
          consequence_text: string | null
          created_at: string | null
          id: string
          next_quest_id: string | null
          quest_id: string | null
          required_house: Database["public"]["Enums"]["house_type"] | null
        }
        Insert: {
          choice_text: string
          consequence_text?: string | null
          created_at?: string | null
          id?: string
          next_quest_id?: string | null
          quest_id?: string | null
          required_house?: Database["public"]["Enums"]["house_type"] | null
        }
        Update: {
          choice_text?: string
          consequence_text?: string | null
          created_at?: string | null
          id?: string
          next_quest_id?: string | null
          quest_id?: string | null
          required_house?: Database["public"]["Enums"]["house_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "quest_choices_next_quest_id_fkey"
            columns: ["next_quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quest_choices_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quest_steps: {
        Row: {
          action_hint: string | null
          description: string
          galeon_reward: number
          id: string
          narrative: string
          quest_id: string
          step_order: number
          title: string
          xp_reward: number
        }
        Insert: {
          action_hint?: string | null
          description?: string
          galeon_reward?: number
          id?: string
          narrative?: string
          quest_id: string
          step_order: number
          title: string
          xp_reward?: number
        }
        Update: {
          action_hint?: string | null
          description?: string
          galeon_reward?: number
          id?: string
          narrative?: string
          quest_id?: string
          step_order?: number
          title?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quest_steps_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      quests: {
        Row: {
          active: boolean | null
          cover_url: string | null
          created_at: string | null
          description: string | null
          difficulty: number
          galeon_reward: number
          galeons_reward: number | null
          id: string
          min_level: number | null
          region: string
          slug: string | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          active?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: number
          galeon_reward?: number
          galeons_reward?: number | null
          id?: string
          min_level?: number | null
          region?: string
          slug?: string | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          active?: boolean | null
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          difficulty?: number
          galeon_reward?: number
          galeons_reward?: number | null
          id?: string
          min_level?: number | null
          region?: string
          slug?: string | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
      }
      quidditch_events: {
        Row: {
          created_at: string | null
          event_type: string
          house: string
          id: string
          match_id: string
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          house: string
          id?: string
          match_id: string
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          house?: string
          id?: string
          match_id?: string
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quidditch_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "quidditch_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      quidditch_matches: {
        Row: {
          created_at: string | null
          finished_at: string | null
          id: string
          scheduled_at: string
          status: string | null
          team1_id: string | null
          team1_score: number | null
          team2_id: string | null
          team2_score: number | null
          winner_id: string | null
        }
        Insert: {
          created_at?: string | null
          finished_at?: string | null
          id?: string
          scheduled_at: string
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          winner_id?: string | null
        }
        Update: {
          created_at?: string | null
          finished_at?: string | null
          id?: string
          scheduled_at?: string
          status?: string | null
          team1_id?: string | null
          team1_score?: number | null
          team2_id?: string | null
          team2_score?: number | null
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quidditch_matches_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "quidditch_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quidditch_matches_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "quidditch_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quidditch_matches_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "quidditch_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      quidditch_players: {
        Row: {
          house: string
          id: string
          joined_at: string | null
          match_id: string
          position: string
          user_id: string
        }
        Insert: {
          house: string
          id?: string
          joined_at?: string | null
          match_id: string
          position: string
          user_id: string
        }
        Update: {
          house?: string
          id?: string
          joined_at?: string | null
          match_id?: string
          position?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quidditch_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "quidditch_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      quidditch_teams: {
        Row: {
          captain_id: string | null
          draws: number | null
          house: Database["public"]["Enums"]["house_type"]
          id: string
          losses: number | null
          points: number | null
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          captain_id?: string | null
          draws?: number | null
          house: Database["public"]["Enums"]["house_type"]
          id?: string
          losses?: number | null
          points?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          captain_id?: string | null
          draws?: number | null
          house?: Database["public"]["Enums"]["house_type"]
          id?: string
          losses?: number | null
          points?: number | null
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: []
      }
      raid_bosses: {
        Row: {
          created_at: string
          current_hp: number
          description: string | null
          ends_at: string
          galeon_pool: number
          id: string
          image_url: string | null
          max_hp: number
          name: string
          starts_at: string
          status: string
          xp_pool: number
        }
        Insert: {
          created_at?: string
          current_hp?: number
          description?: string | null
          ends_at?: string
          galeon_pool?: number
          id?: string
          image_url?: string | null
          max_hp?: number
          name: string
          starts_at?: string
          status?: string
          xp_pool?: number
        }
        Update: {
          created_at?: string
          current_hp?: number
          description?: string | null
          ends_at?: string
          galeon_pool?: number
          id?: string
          image_url?: string | null
          max_hp?: number
          name?: string
          starts_at?: string
          status?: string
          xp_pool?: number
        }
        Relationships: []
      }
      raid_participants: {
        Row: {
          boss_id: string
          damage_dealt: number
          id: string
          last_attack_at: string
          rewarded: boolean
          user_id: string
        }
        Insert: {
          boss_id: string
          damage_dealt?: number
          id?: string
          last_attack_at?: string
          rewarded?: boolean
          user_id: string
        }
        Update: {
          boss_id?: string
          damage_dealt?: number
          id?: string
          last_attack_at?: string
          rewarded?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "raid_participants_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "raid_bosses"
            referencedColumns: ["id"]
          },
        ]
      }
      ranked_matches: {
        Row: {
          id: string
          mmr_change: number
          player_a: string
          player_b: string
          replay: Json | null
          reported_at: string
          season_id: string
          winner: string | null
        }
        Insert: {
          id?: string
          mmr_change?: number
          player_a: string
          player_b: string
          replay?: Json | null
          reported_at?: string
          season_id: string
          winner?: string | null
        }
        Update: {
          id?: string
          mmr_change?: number
          player_a?: string
          player_b?: string
          replay?: Json | null
          reported_at?: string
          season_id?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ranked_matches_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "ranked_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      ranked_players: {
        Row: {
          division: string
          id: string
          losses: number
          mmr: number
          season_id: string
          updated_at: string
          user_id: string
          wins: number
        }
        Insert: {
          division?: string
          id?: string
          losses?: number
          mmr?: number
          season_id: string
          updated_at?: string
          user_id: string
          wins?: number
        }
        Update: {
          division?: string
          id?: string
          losses?: number
          mmr?: number
          season_id?: string
          updated_at?: string
          user_id?: string
          wins?: number
        }
        Relationships: [
          {
            foreignKeyName: "ranked_players_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "ranked_seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      ranked_seasons: {
        Row: {
          active: boolean
          created_at: string
          ends_at: string
          id: string
          name: string
          starts_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ends_at: string
          id?: string
          name: string
          starts_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ends_at?: string
          id?: string
          name?: string
          starts_at?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          amount: number | null
          claimed: boolean | null
          created_at: string | null
          id: string
          referral_id: string | null
          reward_type: string | null
        }
        Insert: {
          amount?: number | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          referral_id?: string | null
          reward_type?: string | null
        }
        Update: {
          amount?: number | null
          claimed?: boolean | null
          created_at?: string | null
          id?: string
          referral_id?: string | null
          reward_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
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
      reputation: {
        Row: {
          admiration: number
          fear: number
          respect: number
          score: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admiration?: number
          fear?: number
          respect?: number
          score?: number
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admiration?: number
          fear?: number
          respect?: number
          score?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      room_members: {
        Row: {
          id: string
          joined_at: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "room_of_requirement"
            referencedColumns: ["id"]
          },
        ]
      }
      room_of_requirement: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          max_members: number
          name: string
          owner_id: string
          password_hash: string | null
          theme: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_members?: number
          name: string
          owner_id: string
          password_hash?: string | null
          theme?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          max_members?: number
          name?: string
          owner_id?: string
          password_hash?: string | null
          theme?: string
        }
        Relationships: []
      }
      room_visits: {
        Row: {
          id: string
          last_visited: string
          room_id: string
          user_id: string
          visit_count: number
        }
        Insert: {
          id?: string
          last_visited?: string
          room_id: string
          user_id: string
          visit_count?: number
        }
        Update: {
          id?: string
          last_visited?: string
          room_id?: string
          user_id?: string
          visit_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "room_visits_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "castle_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_daily_claims: {
        Row: {
          character_id: string
          claim_date: string
          claimed_at: string
          ended_at: string | null
          id: string
          last_active_at: string
          messages_count: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          character_id: string
          claim_date?: string
          claimed_at?: string
          ended_at?: string | null
          id?: string
          last_active_at?: string
          messages_count?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          character_id?: string
          claim_date?: string
          claimed_at?: string
          ended_at?: string | null
          id?: string
          last_active_at?: string
          messages_count?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: []
      }
      rp_streak_milestones: {
        Row: {
          active: boolean
          created_at: string
          days_required: number
          galeons_bonus: number
          id: string
          label: string
          updated_at: string
          xp_bonus: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          days_required: number
          galeons_bonus?: number
          id?: string
          label?: string
          updated_at?: string
          xp_bonus?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          days_required?: number
          galeons_bonus?: number
          id?: string
          label?: string
          updated_at?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      rp_streak_rewards: {
        Row: {
          claim_date: string
          created_at: string
          galeons_bonus: number
          id: string
          label: string | null
          milestone: number | null
          streak_day: number
          user_id: string
          xp_bonus: number
        }
        Insert: {
          claim_date: string
          created_at?: string
          galeons_bonus?: number
          id?: string
          label?: string | null
          milestone?: number | null
          streak_day: number
          user_id: string
          xp_bonus?: number
        }
        Update: {
          claim_date?: string
          created_at?: string
          galeons_bonus?: number
          id?: string
          label?: string | null
          milestone?: number | null
          streak_day?: number
          user_id?: string
          xp_bonus?: number
        }
        Relationships: []
      }
      rp_team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "rp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_team_missions: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          reward_gold: number
          reward_xp: number
          status: string
          team_id: string
          title: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          reward_gold?: number
          reward_xp?: number
          status?: string
          team_id: string
          title: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          reward_gold?: number
          reward_xp?: number
          status?: string
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "rp_team_missions_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "rp_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      rp_teams: {
        Row: {
          created_at: string
          description: string | null
          emblem: string
          house: string | null
          id: string
          leader_id: string
          level: number
          max_members: number
          member_count: number
          motto: string | null
          name: string
          treasury: number
          xp: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          emblem?: string
          house?: string | null
          id?: string
          leader_id: string
          level?: number
          max_members?: number
          member_count?: number
          motto?: string | null
          name: string
          treasury?: number
          xp?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          emblem?: string
          house?: string | null
          id?: string
          leader_id?: string
          level?: number
          max_members?: number
          member_count?: number
          motto?: string | null
          name?: string
          treasury?: number
          xp?: number
        }
        Relationships: []
      }
      seasonal_events: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          end_date: string
          event_type: string | null
          house_points_bonus: number | null
          id: string
          start_date: string
          title: string
          xp_multiplier: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date: string
          event_type?: string | null
          house_points_bonus?: number | null
          id?: string
          start_date: string
          title: string
          xp_multiplier?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          event_type?: string | null
          house_points_bonus?: number | null
          id?: string
          start_date?: string
          title?: string
          xp_multiplier?: number | null
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
      social_bonds: {
        Row: {
          created_at: string
          id: string
          status: string
          type: string
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          type?: string
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          type?: string
          user_a?: string
          user_b?: string
        }
        Relationships: []
      }
      spell_combos: {
        Row: {
          active: boolean
          bonus_galeons: number
          bonus_xp: number
          created_at: string
          description: string | null
          emoji: string
          id: string
          name: string
          rarity: string
          spell_sequence: string[]
        }
        Insert: {
          active?: boolean
          bonus_galeons?: number
          bonus_xp?: number
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name: string
          rarity?: string
          spell_sequence: string[]
        }
        Update: {
          active?: boolean
          bonus_galeons?: number
          bonus_xp?: number
          created_at?: string
          description?: string | null
          emoji?: string
          id?: string
          name?: string
          rarity?: string
          spell_sequence?: string[]
        }
        Relationships: []
      }
      spells: {
        Row: {
          base_damage: number | null
          base_defense: number | null
          category: string
          created_at: string
          description: string
          difficulty: number
          effect: string
          icon: string | null
          id: string
          incantation: string | null
          is_unforgivable: boolean | null
          min_year: number
          name: string
          taught_by: string | null
          xp_required: number | null
        }
        Insert: {
          base_damage?: number | null
          base_defense?: number | null
          category?: string
          created_at?: string
          description?: string
          difficulty?: number
          effect?: string
          icon?: string | null
          id?: string
          incantation?: string | null
          is_unforgivable?: boolean | null
          min_year?: number
          name: string
          taught_by?: string | null
          xp_required?: number | null
        }
        Update: {
          base_damage?: number | null
          base_defense?: number | null
          category?: string
          created_at?: string
          description?: string
          difficulty?: number
          effect?: string
          icon?: string | null
          id?: string
          incantation?: string | null
          is_unforgivable?: boolean | null
          min_year?: number
          name?: string
          taught_by?: string | null
          xp_required?: number | null
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
      stock_history: {
        Row: {
          id: string
          price: number
          recorded_at: string
          stock_id: string
        }
        Insert: {
          id?: string
          price: number
          recorded_at?: string
          stock_id: string
        }
        Update: {
          id?: string
          price?: number
          recorded_at?: string
          stock_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "wizard_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_holdings: {
        Row: {
          avg_price: number
          id: string
          shares: number
          stock_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          id?: string
          shares?: number
          stock_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          id?: string
          shares?: number
          stock_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_holdings_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "wizard_stocks"
            referencedColumns: ["id"]
          },
        ]
      }
      store_items: {
        Row: {
          active: boolean | null
          category: string
          created_at: string | null
          description: string | null
          effects: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price_galeons: number
          rarity: string | null
        }
        Insert: {
          active?: boolean | null
          category: string
          created_at?: string | null
          description?: string | null
          effects?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price_galeons: number
          rarity?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string
          created_at?: string | null
          description?: string | null
          effects?: Json | null
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
      story_chapters: {
        Row: {
          arc: string
          chapter_order: number
          content: string
          cover_emoji: string | null
          created_at: string
          id: string
          requires_level: number
          rewards_galeons: number
          rewards_xp: number
          slug: string
          summary: string | null
          title: string
        }
        Insert: {
          arc?: string
          chapter_order?: number
          content: string
          cover_emoji?: string | null
          created_at?: string
          id?: string
          requires_level?: number
          rewards_galeons?: number
          rewards_xp?: number
          slug: string
          summary?: string | null
          title: string
        }
        Update: {
          arc?: string
          chapter_order?: number
          content?: string
          cover_emoji?: string | null
          created_at?: string
          id?: string
          requires_level?: number
          rewards_galeons?: number
          rewards_xp?: number
          slug?: string
          summary?: string | null
          title?: string
        }
        Relationships: []
      }
      story_choices: {
        Row: {
          attribute_effect: Json | null
          chapter_id: string
          display_order: number
          id: string
          label: string
          next_chapter_slug: string | null
          outcome_text: string | null
          xp_bonus: number
        }
        Insert: {
          attribute_effect?: Json | null
          chapter_id: string
          display_order?: number
          id?: string
          label: string
          next_chapter_slug?: string | null
          outcome_text?: string | null
          xp_bonus?: number
        }
        Update: {
          attribute_effect?: Json | null
          chapter_id?: string
          display_order?: number
          id?: string
          label?: string
          next_chapter_slug?: string | null
          outcome_text?: string | null
          xp_bonus?: number
        }
        Relationships: [
          {
            foreignKeyName: "story_choices_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      story_progress: {
        Row: {
          chapter_id: string
          choice_id: string | null
          completed_at: string
          id: string
          user_id: string
        }
        Insert: {
          chapter_id: string
          choice_id?: string | null
          completed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          chapter_id?: string
          choice_id?: string | null
          completed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_progress_choice_id_fkey"
            columns: ["choice_id"]
            isOneToOne: false
            referencedRelation: "story_choices"
            referencedColumns: ["id"]
          },
        ]
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
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      tournament_matches: {
        Row: {
          created_at: string
          id: string
          player_a: string | null
          player_b: string | null
          reported_at: string | null
          round: number
          scheduled_at: string | null
          slot: number
          status: string
          tournament_id: string
          winner: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          player_a?: string | null
          player_b?: string | null
          reported_at?: string | null
          round: number
          scheduled_at?: string | null
          slot: number
          status?: string
          tournament_id: string
          winner?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          player_a?: string | null
          player_b?: string | null
          reported_at?: string | null
          round?: number
          scheduled_at?: string | null
          slot?: number
          status?: string
          tournament_id?: string
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          character_id: string | null
          eliminated: boolean
          id: string
          joined_at: string
          seed: number | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          character_id?: string | null
          eliminated?: boolean
          id?: string
          joined_at?: string
          seed?: number | null
          tournament_id: string
          user_id: string
        }
        Update: {
          character_id?: string | null
          eliminated?: boolean
          id?: string
          joined_at?: string
          seed?: number | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          format: string
          galeon_prize: number
          id: string
          max_participants: number
          name: string
          starts_at: string | null
          status: string
          xp_prize: number
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: string
          galeon_prize?: number
          id?: string
          max_participants?: number
          name: string
          starts_at?: string | null
          status?: string
          xp_prize?: number
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          format?: string
          galeon_prize?: number
          id?: string
          max_participants?: number
          name?: string
          starts_at?: string | null
          status?: string
          xp_prize?: number
        }
        Relationships: []
      }
      ugc_missions: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          difficulty: number
          galeon_reward: number
          id: string
          status: string
          title: string
          votes: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          description: string
          difficulty?: number
          galeon_reward?: number
          id?: string
          status?: string
          title: string
          votes?: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          difficulty?: number
          galeon_reward?: number
          id?: string
          status?: string
          title?: string
          votes?: number
          xp_reward?: number
        }
        Relationships: []
      }
      ugc_rooms: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          id: string
          name: string
          status: string
          theme: string | null
          votes: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          name: string
          status?: string
          theme?: string | null
          votes?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          theme?: string | null
          votes?: number
        }
        Relationships: []
      }
      ugc_spells: {
        Row: {
          created_at: string
          creator_id: string
          effect: string
          id: string
          incantation: string
          power: number
          status: string
          votes: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          effect: string
          id?: string
          incantation: string
          power?: number
          status?: string
          votes?: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          effect?: string
          id?: string
          incantation?: string
          power?: number
          status?: string
          votes?: number
        }
        Relationships: []
      }
      ugc_votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      user_audio_prefs: {
        Row: {
          ambient_enabled: boolean
          track: string | null
          updated_at: string
          user_id: string
          volume: number
        }
        Insert: {
          ambient_enabled?: boolean
          track?: string | null
          updated_at?: string
          user_id: string
          volume?: number
        }
        Update: {
          ambient_enabled?: boolean
          track?: string | null
          updated_at?: string
          user_id?: string
          volume?: number
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
      user_battle_pass_progress: {
        Row: {
          claimed_rewards: Json | null
          current_level: number | null
          current_xp: number | null
          pass_id: string
          premium_unlocked: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          claimed_rewards?: Json | null
          current_level?: number | null
          current_xp?: number | null
          pass_id: string
          premium_unlocked?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          claimed_rewards?: Json | null
          current_level?: number | null
          current_xp?: number | null
          pass_id?: string
          premium_unlocked?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_battle_pass_progress_pass_id_fkey"
            columns: ["pass_id"]
            isOneToOne: false
            referencedRelation: "battle_passes"
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
      user_daily_missions: {
        Row: {
          assigned_date: string
          completed: boolean
          completed_at: string | null
          created_at: string
          galeons_awarded: number | null
          id: string
          mission_id: string
          progress: number
          user_id: string
          xp_awarded: number | null
        }
        Insert: {
          assigned_date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          galeons_awarded?: number | null
          id?: string
          mission_id: string
          progress?: number
          user_id: string
          xp_awarded?: number | null
        }
        Update: {
          assigned_date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          galeons_awarded?: number | null
          id?: string
          mission_id?: string
          progress?: number
          user_id?: string
          xp_awarded?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_daily_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "daily_missions_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      user_inventory: {
        Row: {
          equipped: boolean
          id: string
          item_id: string
          obtained_at: string
          quantity: number
          user_id: string
        }
        Insert: {
          equipped?: boolean
          id?: string
          item_id: string
          obtained_at?: string
          quantity?: number
          user_id: string
        }
        Update: {
          equipped?: boolean
          id?: string
          item_id?: string
          obtained_at?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_inventory_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "hogsmeade_items"
            referencedColumns: ["id"]
          },
        ]
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
      user_notification_settings: {
        Row: {
          enable_email_digest: boolean | null
          enable_quests: boolean | null
          enable_social: boolean | null
          enable_system: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          enable_email_digest?: boolean | null
          enable_quests?: boolean | null
          enable_social?: boolean | null
          enable_system?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          enable_email_digest?: boolean | null
          enable_quests?: boolean | null
          enable_social?: boolean | null
          enable_system?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_quest_progress: {
        Row: {
          id: string
          last_choice_id: string | null
          quest_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_choice_id?: string | null
          quest_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_choice_id?: string | null
          quest_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_quest_progress_last_choice_id_fkey"
            columns: ["last_choice_id"]
            isOneToOne: false
            referencedRelation: "quest_choices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          completed: boolean
          completed_at: string | null
          current_step: number
          id: string
          quest_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          current_step?: number
          id?: string
          quest_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          current_step?: number
          id?: string
          quest_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
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
      user_spells: {
        Row: {
          id: string
          last_practiced_at: string | null
          learned_at: string
          mastery_level: number | null
          spell_id: string
          times_practiced: number
          user_id: string
        }
        Insert: {
          id?: string
          last_practiced_at?: string | null
          learned_at?: string
          mastery_level?: number | null
          spell_id: string
          times_practiced?: number
          user_id: string
        }
        Update: {
          id?: string
          last_practiced_at?: string | null
          learned_at?: string
          mastery_level?: number | null
          spell_id?: string
          times_practiced?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_spells_spell_id_fkey"
            columns: ["spell_id"]
            isOneToOne: false
            referencedRelation: "spells"
            referencedColumns: ["id"]
          },
        ]
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
      wands: {
        Row: {
          bonus_attack: number
          bonus_defense: number
          bonus_speed: number
          core: string
          crafted_at: string | null
          flexibility: string
          length_inches: number
          user_id: string
          wood: string
        }
        Insert: {
          bonus_attack?: number
          bonus_defense?: number
          bonus_speed?: number
          core: string
          crafted_at?: string | null
          flexibility?: string
          length_inches?: number
          user_id: string
          wood: string
        }
        Update: {
          bonus_attack?: number
          bonus_defense?: number
          bonus_speed?: number
          core?: string
          crafted_at?: string | null
          flexibility?: string
          length_inches?: number
          user_id?: string
          wood?: string
        }
        Relationships: []
      }
      webhook_audit_log: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload_hash: string
          result_message: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload_hash: string
          result_message?: string | null
          status: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload_hash?: string
          result_message?: string | null
          status?: string
        }
        Relationships: []
      }
      wizard_stocks: {
        Row: {
          company: string
          description: string | null
          id: string
          price: number
          ticker: string
          updated_at: string
          volatility: number
        }
        Insert: {
          company: string
          description?: string | null
          id?: string
          price?: number
          ticker: string
          updated_at?: string
          volatility?: number
        }
        Update: {
          company?: string
          description?: string | null
          id?: string
          price?: number
          ticker?: string
          updated_at?: string
          volatility?: number
        }
        Relationships: []
      }
    }
    Views: {
      admin_kpis: {
        Row: {
          approved_wizards: number | null
          flags_week: number | null
          market_active: number | null
          new_week: number | null
          revenue_month_brl: number | null
          total_wizards: number | null
          tournaments_active: number | null
        }
        Relationships: []
      }
      analytics_daily_active: {
        Row: {
          active_users: number | null
          day: string | null
        }
        Relationships: []
      }
      analytics_house_distribution: {
        Row: {
          house: string | null
          total: number | null
        }
        Relationships: []
      }
      analytics_retention_cohorts: {
        Row: {
          cohort_week: string | null
          signups: number | null
          still_active: number | null
        }
        Relationships: []
      }
      analytics_vip_funnel: {
        Row: {
          lifetime_revenue_brl: number | null
          paid_orders: number | null
          total_users: number | null
          vip_users: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_duel: { Args: { p_match: string }; Returns: undefined }
      accept_sticker_trade: { Args: { _trade_id: string }; Returns: Json }
      admin_credit_order: { Args: { _order_id: string }; Returns: Json }
      admin_grant_vip: {
        Args: { _months?: number; _plan: string; _user_id: string }
        Returns: undefined
      }
      assign_daily_missions: {
        Args: never
        Returns: {
          assigned_date: string
          completed: boolean
          completed_at: string | null
          created_at: string
          galeons_awarded: number | null
          id: string
          mission_id: string
          progress: number
          user_id: string
          xp_awarded: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "user_daily_missions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      assign_detention: {
        Args: {
          p_hours?: number
          p_reason: string
          p_task?: string
          p_user_id: string
        }
        Returns: Json
      }
      award_galeons: {
        Args: { _amount: number; _reason?: string; _user_id: string }
        Returns: undefined
      }
      award_xp_action: {
        Args: { _action: string; _user_id: string; _xp: number }
        Returns: undefined
      }
      buy_hogsmeade_item: {
        Args: { p_item_id: string; p_qty?: number }
        Returns: Json
      }
      buy_marketplace_listing: { Args: { p_listing_id: string }; Returns: Json }
      buy_stock: {
        Args: { p_shares: number; p_stock_id: string }
        Returns: Json
      }
      buy_store_item: {
        Args: { _item_id: string; _user_id: string }
        Returns: Json
      }
      buy_streak_freeze: { Args: { p_qty?: number }; Returns: Json }
      calc_blood_status: {
        Args: { _father_id: string; _mother_id: string }
        Returns: string
      }
      cancel_item_trade: { Args: { p_trade_id: string }; Returns: Json }
      cancel_marketplace_listing: {
        Args: { p_listing_id: string }
        Returns: Json
      }
      cast_duel_spell: {
        Args: { p_match: string; p_spell_code: string }
        Returns: Json
      }
      claim_battle_pass_reward: {
        Args: { p_pass_id: string; p_reward_id: string }
        Returns: Json
      }
      claim_rp_slot: {
        Args: { p_character_id: string }
        Returns: {
          character_id: string
          claim_date: string
          claimed_at: string
          ended_at: string | null
          id: string
          last_active_at: string
          messages_count: number
          user_id: string
          xp_earned: number
        }
        SetofOptions: {
          from: "*"
          to: "rp_daily_claims"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_canon_lesson: {
        Args: {
          p_character_id: string
          p_lesson_id: string
          p_mastery_score?: number
        }
        Returns: Json
      }
      complete_daily_mission: {
        Args: { p_mission_id: string }
        Returns: {
          assigned_date: string
          completed: boolean
          completed_at: string | null
          created_at: string
          galeons_awarded: number | null
          id: string
          mission_id: string
          progress: number
          user_id: string
          xp_awarded: number | null
        }
        SetofOptions: {
          from: "*"
          to: "user_daily_missions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_detention: { Args: { p_detention_id: string }; Returns: Json }
      complete_quest_step: { Args: { p_quest_id: string }; Returns: Json }
      complete_referral_action: {
        Args: { _invited_id: string }
        Returns: undefined
      }
      craft_wand: {
        Args: {
          p_core: string
          p_flex: string
          p_length: number
          p_wood: string
        }
        Returns: {
          bonus_attack: number
          bonus_defense: number
          bonus_speed: number
          core: string
          crafted_at: string | null
          flexibility: string
          length_inches: number
          user_id: string
          wood: string
        }
        SetofOptions: {
          from: "*"
          to: "wands"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_duel: { Args: { p_opponent: string }; Returns: string }
      create_guild: {
        Args: { p_description?: string; p_emblem?: string; p_name: string }
        Returns: Json
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
      create_marketplace_listing: {
        Args: { p_price: number; p_sticker_id: string }
        Returns: Json
      }
      credit_galeons_atomic: {
        Args: { _amount: number; _user_id: string }
        Returns: number
      }
      damage_raid_boss: {
        Args: { p_boss_id: string; p_damage: number }
        Returns: Json
      }
      finalize_auction: { Args: { p_auction_id: string }; Returns: Json }
      forfeit_duel: { Args: { p_match: string }; Returns: undefined }
      get_payment_link: {
        Args: { p_order_id: string; p_request_id: number }
        Returns: Json
      }
      grant_merit: {
        Args: { p_points?: number; p_reason: string; p_user_id: string }
        Returns: Json
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invoke_patronus: { Args: { p_focus: number }; Returns: Json }
      join_club: { Args: { p_club_id: string }; Returns: Json }
      join_guild: { Args: { p_guild_id: string }; Returns: Json }
      join_tournament: { Args: { p_tournament_id: string }; Returns: Json }
      open_sticker_pack: { Args: { _user_id: string }; Returns: Json }
      place_auction_bid: {
        Args: { p_amount: number; p_auction_id: string }
        Returns: Json
      }
      practice_spell: { Args: { p_spell_id: string }; Returns: Json }
      process_duel_turn: {
        Args: { _duel_id: string; _spell_id: string }
        Returns: Json
      }
      process_vip_renewals: { Args: never; Returns: Json }
      propose_item_trade: {
        Args: {
          p_message?: string
          p_offered_gal: number
          p_offered_item: string
          p_offered_qty: number
          p_recipient_id: string
          p_requested_gal: number
          p_requested_item: string
          p_requested_qty: number
        }
        Returns: Json
      }
      quidditch_score: {
        Args: { p_event: string; p_match: string }
        Returns: Json
      }
      repay_bank_loan: {
        Args: { p_amount: number; p_loan_id: string }
        Returns: Json
      }
      report_match_result: {
        Args: { p_match_id: string; p_winner: string }
        Returns: Json
      }
      report_ranked_match: {
        Args: { p_opponent: string; p_season_id: string; p_won: boolean }
        Returns: Json
      }
      request_mentorship: { Args: { p_mentor_id: string }; Returns: Json }
      respond_item_trade: {
        Args: { p_accept: boolean; p_trade_id: string }
        Returns: Json
      }
      respond_mentorship: {
        Args: { p_accept: boolean; p_mentorship_id: string }
        Returns: Json
      }
      sell_stock: {
        Args: { p_shares: number; p_stock_id: string }
        Returns: Json
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
      start_quest: { Args: { p_quest_id: string }; Returns: Json }
      start_quidditch_match: { Args: { p_match: string }; Returns: undefined }
      submit_exam: {
        Args: { p_answers: Json; p_exam_id: string }
        Returns: Json
      }
      take_bank_loan: {
        Args: { p_amount: number; p_days?: number }
        Returns: Json
      }
      toggle_insta_like: {
        Args: { p_post_id: string; p_user_id: string }
        Returns: undefined
      }
      validate_enigma_answer: {
        Args: { _answer: string; _challenge_id: string }
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
      vote_ugc: {
        Args: { p_target_id: string; p_target_type: string }
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
