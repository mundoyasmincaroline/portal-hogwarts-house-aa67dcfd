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
          sickles: number | null
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
          sickles?: number | null
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
          sickles?: number | null
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
      quests: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          galeons_reward: number | null
          id: string
          min_level: number | null
          title: string
          xp_reward: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          galeons_reward?: number | null
          id?: string
          min_level?: number | null
          title: string
          xp_reward?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          galeons_reward?: number | null
          id?: string
          min_level?: number | null
          title?: string
          xp_reward?: number | null
        }
        Relationships: []
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
          learned_at: string
          mastery_level: number | null
          spell_id: string
          user_id: string
        }
        Insert: {
          id?: string
          learned_at?: string
          mastery_level?: number | null
          spell_id: string
          user_id: string
        }
        Update: {
          id?: string
          learned_at?: string
          mastery_level?: number | null
          spell_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_sticker_trade: { Args: { _trade_id: string }; Returns: Json }
      admin_credit_order: { Args: { _order_id: string }; Returns: Json }
      admin_grant_vip: {
        Args: { _months?: number; _plan: string; _user_id: string }
        Returns: undefined
      }
      award_galeons: {
        Args: { _amount: number; _reason?: string; _user_id: string }
        Returns: undefined
      }
      award_xp_action: {
        Args: { _action: string; _user_id: string; _xp: number }
        Returns: undefined
      }
      buy_store_item: {
        Args: { _item_id: string; _user_id: string }
        Returns: Json
      }
      calc_blood_status: {
        Args: { _father_id: string; _mother_id: string }
        Returns: string
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
      credit_galeons_atomic: {
        Args: { _amount: number; _user_id: string }
        Returns: number
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
      open_sticker_pack: { Args: { _user_id: string }; Returns: Json }
      process_duel_turn: {
        Args: { _duel_id: string; _spell_id: string }
        Returns: Json
      }
      process_vip_renewals: { Args: never; Returns: Json }
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
