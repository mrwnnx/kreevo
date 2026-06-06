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
      ai_analysis_logs: {
        Row: {
          challenge_id: string
          created_at: string
          duration_ms: number
          error: string | null
          id: string
          model: string
          n_images: number
          n_rejected: number
          submission_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          duration_ms: number
          error?: string | null
          id?: string
          model: string
          n_images: number
          n_rejected?: number
          submission_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          duration_ms?: number
          error?: string | null
          id?: string
          model?: string
          n_images?: number
          n_rejected?: number
          submission_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_logs_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analysis_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          badge_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          badge_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          badge_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_types: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          specialty: string | null
          translation_status: Json
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          specialty?: string | null
          translation_status?: Json
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          specialty?: string | null
          translation_status?: Json
        }
        Relationships: []
      }
      challenges: {
        Row: {
          brief: string
          brief_ar: string | null
          brief_en: string | null
          brief_fr: string | null
          challenge_type: string | null
          challenge_type_id: string | null
          constraints: string | null
          constraints_ar: string | null
          constraints_en: string | null
          constraints_fr: string | null
          context: string | null
          context_ar: string | null
          context_en: string | null
          context_fr: string | null
          created_at: string | null
          created_by: string | null
          criteria: string | null
          criteria_ar: string | null
          criteria_en: string | null
          criteria_fr: string | null
          deadline_days: number | null
          deliverable: string | null
          deliverable_ar: string | null
          deliverable_en: string | null
          deliverable_fr: string | null
          emoji: string | null
          id: string
          industry: string | null
          industry_id: string | null
          is_published: boolean | null
          league_id: string | null
          source_lang: string
          specialty: string | null
          specialty_id: string | null
          title: string
          title_ar: string | null
          title_en: string | null
          title_fr: string | null
          translation_status: Json
          updated_at: string
          xp_reward: number | null
        }
        Insert: {
          brief: string
          brief_ar?: string | null
          brief_en?: string | null
          brief_fr?: string | null
          challenge_type?: string | null
          challenge_type_id?: string | null
          constraints?: string | null
          constraints_ar?: string | null
          constraints_en?: string | null
          constraints_fr?: string | null
          context?: string | null
          context_ar?: string | null
          context_en?: string | null
          context_fr?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: string | null
          criteria_ar?: string | null
          criteria_en?: string | null
          criteria_fr?: string | null
          deadline_days?: number | null
          deliverable?: string | null
          deliverable_ar?: string | null
          deliverable_en?: string | null
          deliverable_fr?: string | null
          emoji?: string | null
          id?: string
          industry?: string | null
          industry_id?: string | null
          is_published?: boolean | null
          league_id?: string | null
          source_lang?: string
          specialty?: string | null
          specialty_id?: string | null
          title: string
          title_ar?: string | null
          title_en?: string | null
          title_fr?: string | null
          translation_status?: Json
          updated_at?: string
          xp_reward?: number | null
        }
        Update: {
          brief?: string
          brief_ar?: string | null
          brief_en?: string | null
          brief_fr?: string | null
          challenge_type?: string | null
          challenge_type_id?: string | null
          constraints?: string | null
          constraints_ar?: string | null
          constraints_en?: string | null
          constraints_fr?: string | null
          context?: string | null
          context_ar?: string | null
          context_en?: string | null
          context_fr?: string | null
          created_at?: string | null
          created_by?: string | null
          criteria?: string | null
          criteria_ar?: string | null
          criteria_en?: string | null
          criteria_fr?: string | null
          deadline_days?: number | null
          deliverable?: string | null
          deliverable_ar?: string | null
          deliverable_en?: string | null
          deliverable_fr?: string | null
          emoji?: string | null
          id?: string
          industry?: string | null
          industry_id?: string | null
          is_published?: boolean | null
          league_id?: string | null
          source_lang?: string
          specialty?: string | null
          specialty_id?: string | null
          title?: string
          title_ar?: string | null
          title_en?: string | null
          title_fr?: string | null
          translation_status?: Json
          updated_at?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_challenge_type_id_fkey"
            columns: ["challenge_type_id"]
            isOneToOne: false
            referencedRelation: "challenge_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          claps_given: number | null
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_reported: boolean | null
          likes_count: number | null
          parent_id: string | null
          rating: number | null
          submission_id: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          claps_given?: number | null
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_reported?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          rating?: number | null
          submission_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          claps_given?: number | null
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_reported?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          rating?: number | null
          submission_id?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          banner_position: string
          banner_url: string | null
          body: string
          button_enabled: boolean
          button_label: string
          button_url: string | null
          footer_link: string | null
          footer_text: string
          label: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          banner_position?: string
          banner_url?: string | null
          body?: string
          button_enabled?: boolean
          button_label?: string
          button_url?: string | null
          footer_link?: string | null
          footer_text?: string
          label?: string
          title?: string
          type: string
          updated_at?: string
        }
        Update: {
          banner_position?: string
          banner_url?: string | null
          body?: string
          button_enabled?: boolean
          button_label?: string
          button_url?: string | null
          footer_link?: string | null
          footer_text?: string
          label?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          ai_draft: string | null
          created_at: string | null
          final_text: string | null
          id: string
          improvements: string | null
          league_impact: string | null
          mentor_id: string | null
          priority_action: string | null
          published_at: string | null
          score: number | null
          status: string | null
          strengths: string | null
          submission_id: string | null
        }
        Insert: {
          ai_draft?: string | null
          created_at?: string | null
          final_text?: string | null
          id?: string
          improvements?: string | null
          league_impact?: string | null
          mentor_id?: string | null
          priority_action?: string | null
          published_at?: string | null
          score?: number | null
          status?: string | null
          strengths?: string | null
          submission_id?: string | null
        }
        Update: {
          ai_draft?: string | null
          created_at?: string | null
          final_text?: string | null
          id?: string
          improvements?: string | null
          league_impact?: string | null
          mentor_id?: string | null
          priority_action?: string | null
          published_at?: string | null
          score?: number | null
          status?: string | null
          strengths?: string | null
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      help_articles: {
        Row: {
          category: string
          content_en: string
          content_fr: string
          created_at: string | null
          excerpt_en: string | null
          excerpt_fr: string | null
          helpful: number | null
          id: string
          not_helpful: number | null
          order_index: number | null
          published: boolean | null
          search_vector: unknown
          slug: string
          title_en: string
          title_fr: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category: string
          content_en: string
          content_fr: string
          created_at?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          helpful?: number | null
          id?: string
          not_helpful?: number | null
          order_index?: number | null
          published?: boolean | null
          search_vector?: unknown
          slug: string
          title_en: string
          title_fr: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category?: string
          content_en?: string
          content_fr?: string
          created_at?: string | null
          excerpt_en?: string | null
          excerpt_fr?: string | null
          helpful?: number | null
          id?: string
          not_helpful?: number | null
          order_index?: number | null
          published?: boolean | null
          search_vector?: unknown
          slug?: string
          title_en?: string
          title_fr?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      industries: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          translation_status: Json
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          translation_status?: Json
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          translation_status?: Json
        }
        Relationships: []
      }
      leagues: {
        Row: {
          access: string | null
          color: string
          created_at: string | null
          icon: string
          id: string
          is_active: boolean | null
          min_challenges: number | null
          min_challenges_enabled: boolean
          name: string
          order_index: number
          xp_threshold_percent: number
        }
        Insert: {
          access?: string | null
          color: string
          created_at?: string | null
          icon: string
          id?: string
          is_active?: boolean | null
          min_challenges?: number | null
          min_challenges_enabled?: boolean
          name: string
          order_index: number
          xp_threshold_percent?: number
        }
        Update: {
          access?: string | null
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_active?: boolean | null
          min_challenges?: number | null
          min_challenges_enabled?: boolean
          name?: string
          order_index?: number
          xp_threshold_percent?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participations: {
        Row: {
          challenge_id: string | null
          created_at: string | null
          id: string
          joined_at: string | null
          personal_deadline: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          joined_at?: string | null
          personal_deadline: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          challenge_id?: string | null
          created_at?: string | null
          id?: string
          joined_at?: string | null
          personal_deadline?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participations_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          behance_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string | null
          experience_level: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_suspended: boolean | null
          job_title: string | null
          last_name: string | null
          league: string | null
          league_entered_at: string | null
          level: string | null
          linkedin_url: string | null
          links: Json | null
          objective: string | null
          objectives: string[] | null
          onboarding_completed: boolean
          plan: string | null
          preferred_language: string
          referral_code: string | null
          referred_by: string | null
          role: string | null
          specialty: string | null
          specialty_id: string | null
          tools: string[] | null
          updated_at: string | null
          username: string
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          experience_level?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          is_suspended?: boolean | null
          job_title?: string | null
          last_name?: string | null
          league?: string | null
          league_entered_at?: string | null
          level?: string | null
          linkedin_url?: string | null
          links?: Json | null
          objective?: string | null
          objectives?: string[] | null
          onboarding_completed?: boolean
          plan?: string | null
          preferred_language?: string
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          specialty?: string | null
          specialty_id?: string | null
          tools?: string[] | null
          updated_at?: string | null
          username: string
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          experience_level?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          job_title?: string | null
          last_name?: string | null
          league?: string | null
          league_entered_at?: string | null
          level?: string | null
          linkedin_url?: string | null
          links?: Json | null
          objective?: string | null
          objectives?: string[] | null
          onboarding_completed?: boolean
          plan?: string | null
          preferred_language?: string
          referral_code?: string | null
          referred_by?: string | null
          role?: string | null
          specialty?: string | null
          specialty_id?: string | null
          tools?: string[] | null
          updated_at?: string | null
          username?: string
          xp?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      random_briefs: {
        Row: {
          brief_text: string
          cover_url: string | null
          created_at: string | null
          deadline_at: string | null
          description: string | null
          figma_url: string | null
          id: string
          is_public: boolean | null
          prompt: Json
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          brief_text: string
          cover_url?: string | null
          created_at?: string | null
          deadline_at?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          is_public?: boolean | null
          prompt: Json
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          brief_text?: string
          cover_url?: string | null
          created_at?: string | null
          deadline_at?: string | null
          description?: string | null
          figma_url?: string | null
          id?: string
          is_public?: boolean | null
          prompt?: Json
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "random_briefs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_id: string | null
          referrer_id: string | null
          status: string | null
          xp_awarded: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
          xp_awarded?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_id?: string | null
          referrer_id?: string | null
          status?: string | null
          xp_awarded?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
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
      specialties: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string
          is_active: boolean
          name: string
          name_ar: string | null
          name_en: string | null
          name_fr: string | null
          order_index: number
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          name: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          order_index?: number
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string
          is_active?: boolean
          name?: string
          name_ar?: string | null
          name_en?: string | null
          name_fr?: string | null
          order_index?: number
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_contests: {
        Row: {
          admin_response: string | null
          created_at: string | null
          id: string
          message: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          submission_id: string | null
          user_id: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          submission_id?: string | null
          user_id?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          submission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_contests_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_contests_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_contests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_feedbacks: {
        Row: {
          content: Json
          created_at: string
          id: string
          lang: string | null
          model: string
          submission_id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          lang?: string | null
          model?: string
          submission_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lang?: string | null
          model?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submission_feedbacks_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: true
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_feedbacks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_likes: {
        Row: {
          created_at: string | null
          id: string
          likes_count: number | null
          submission_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          likes_count?: number | null
          submission_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          likes_count?: number | null
          submission_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_claps_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_claps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_reports: {
        Row: {
          created_at: string | null
          id: string
          reason: string
          submission_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason: string
          submission_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string
          submission_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submission_reports_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_analysis: Json | null
          ai_analysis_bypassed: boolean
          ai_feedback: Json | null
          ai_feedback_at: string | null
          ai_rejection_count: number
          attempt_number: number | null
          challenge_id: string | null
          comments_count: number | null
          cover_url: string
          created_at: string | null
          description: string | null
          description_bonus_applied: boolean
          files: Json | null
          id: string
          is_draft: boolean
          is_reported: boolean | null
          is_visible: boolean | null
          participation_id: string | null
          rejection_reason: string | null
          reported_at: string | null
          reports_count: number | null
          title: string | null
          total_likes: number | null
          updated_at: string | null
          user_id: string | null
          validated_at: string | null
          validated_by: string | null
          validation_status: string | null
          views_count: number
          xp_attributed: boolean | null
          xp_earned: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_analysis_bypassed?: boolean
          ai_feedback?: Json | null
          ai_feedback_at?: string | null
          ai_rejection_count?: number
          attempt_number?: number | null
          challenge_id?: string | null
          comments_count?: number | null
          cover_url: string
          created_at?: string | null
          description?: string | null
          description_bonus_applied?: boolean
          files?: Json | null
          id?: string
          is_draft?: boolean
          is_reported?: boolean | null
          is_visible?: boolean | null
          participation_id?: string | null
          rejection_reason?: string | null
          reported_at?: string | null
          reports_count?: number | null
          title?: string | null
          total_likes?: number | null
          updated_at?: string | null
          user_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
          views_count?: number
          xp_attributed?: boolean | null
          xp_earned?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_analysis_bypassed?: boolean
          ai_feedback?: Json | null
          ai_feedback_at?: string | null
          ai_rejection_count?: number
          attempt_number?: number | null
          challenge_id?: string | null
          comments_count?: number | null
          cover_url?: string
          created_at?: string | null
          description?: string | null
          description_bonus_applied?: boolean
          files?: Json | null
          id?: string
          is_draft?: boolean
          is_reported?: boolean | null
          is_visible?: boolean | null
          participation_id?: string | null
          rejection_reason?: string | null
          reported_at?: string | null
          reports_count?: number | null
          title?: string | null
          total_likes?: number | null
          updated_at?: string | null
          user_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string | null
          views_count?: number
          xp_attributed?: boolean | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_participation_id_fkey"
            columns: ["participation_id"]
            isOneToOne: false
            referencedRelation: "participations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          paddle_customer_id: string | null
          paddle_subscription_id: string | null
          plan: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          paddle_customer_id?: string | null
          paddle_subscription_id?: string | null
          plan?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_submission_views: {
        Args: { sub_id: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const


// ── Convenience aliases (backwards-compatible with the hand-written file) ──
export type Profile = Database['public']['Tables']['profiles']['Row']
export type League = Database['public']['Tables']['leagues']['Row']
export type Challenge = Database['public']['Tables']['challenges']['Row']
export type Participation = Database['public']['Tables']['participations']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Feedback = Database['public']['Tables']['feedbacks']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Setting = Database['public']['Tables']['settings']['Row']
