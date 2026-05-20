export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          country: string | null
          city: string | null
          specialty: string | null
          objective: string | null
          objectives: string[] | null
          tools: string[] | null
          links: Json | null
          plan: 'free' | 'pro' | 'studio'
          xp: number
          league: string
          role: 'user' | 'admin'
          is_suspended: boolean
          notification_prefs: Json | null
          first_name: string | null
          last_name: string | null
          experience_level: string | null
          job_title: string | null
          behance_url: string | null
          linkedin_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']>
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      leagues: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          order_index: number
          min_challenges: number
          xp_threshold_percent: number
          access: 'all' | 'pro_only'
          is_active: boolean
          specialty: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['leagues']['Row']>
        Update: Partial<Database['public']['Tables']['leagues']['Row']>
      }
      challenges: {
        Row: {
          id: string
          title: string
          brief: string
          context: string | null
          deliverable: string | null
          constraints: string | null
          criteria: string | null
          league_id: string | null
          specialty: string | null
          challenge_type: string | null
          industry: string | null
          xp_reward: number
          deadline_days: number
          is_published: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['challenges']['Row']>
        Update: Partial<Database['public']['Tables']['challenges']['Row']>
      }
      participations: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          joined_at: string
          personal_deadline: string
          status: 'active' | 'submitted' | 'expired'
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['participations']['Row']>
        Update: Partial<Database['public']['Tables']['participations']['Row']>
      }
      submissions: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          participation_id: string | null
          cover_url: string
          files: Json | null
          description: string | null
          attempt_number: number
          is_visible: boolean
          is_reported: boolean
          xp_earned: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['submissions']['Row']>
        Update: Partial<Database['public']['Tables']['submissions']['Row']>
      }
      comments: {
        Row: {
          id: string
          submission_id: string
          user_id: string
          content: string
          is_reported: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['comments']['Row']>
        Update: Partial<Database['public']['Tables']['comments']['Row']>
      }
      feedbacks: {
        Row: {
          id: string
          submission_id: string
          mentor_id: string | null
          ai_draft: string | null
          final_text: string | null
          strengths: string | null
          improvements: string | null
          priority_action: string | null
          league_impact: string | null
          score: number | null
          status: 'pending' | 'in_review' | 'published'
          created_at: string
          published_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['feedbacks']['Row']>
        Update: Partial<Database['public']['Tables']['feedbacks']['Row']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'pro_monthly' | 'pro_yearly'
          status: 'active' | 'cancelled' | 'expired' | 'paused'
          paddle_subscription_id: string | null
          paddle_customer_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']>
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
      badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['badges']['Row']>
        Update: Partial<Database['public']['Tables']['badges']['Row']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['notifications']['Row']>
        Update: Partial<Database['public']['Tables']['notifications']['Row']>
      }
      settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['settings']['Row']>
        Update: Partial<Database['public']['Tables']['settings']['Row']>
      }
    }
  }
}

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
