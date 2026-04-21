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
          level: string | null
          objective: string | null
          tools: string[] | null
          links: Json | null
          plan: 'free' | 'pro' | 'studio'
          xp: number
          league: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'xp' | 'plan' | 'league' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
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
          track: string
          level: string
          month: number
          year: number
          status: 'draft' | 'active' | 'closed' | 'archived'
          reveal_at: string
          closes_at: string
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['challenges']['Row'], 'status' | 'created_at'>
        Update: Partial<Database['public']['Tables']['challenges']['Insert']>
      }
      submissions: {
        Row: {
          id: string
          challenge_id: string | null
          user_id: string | null
          cover_url: string
          files: Json | null
          description: string | null
          attempt_number: number
          is_visible: boolean
          xp_earned: number
          likes_count: number
          comments_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['submissions']['Row'], 'attempt_number' | 'is_visible' | 'xp_earned' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['submissions']['Insert']>
      }
      random_briefs: {
        Row: {
          id: string
          user_id: string | null
          prompt: Json
          brief_text: string
          status: 'active' | 'archived'
          is_public: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['random_briefs']['Row'], 'status' | 'is_public' | 'created_at'>
        Update: Partial<Database['public']['Tables']['random_briefs']['Insert']>
      }
      likes: {
        Row: { id: string; submission_id: string | null; user_id: string | null; created_at: string }
        Insert: Pick<Database['public']['Tables']['likes']['Row'], 'submission_id' | 'user_id'>
        Update: never
      }
      comments: {
        Row: {
          id: string
          submission_id: string | null
          user_id: string | null
          content: string
          is_reported: boolean
          created_at: string
        }
        Insert: Pick<Database['public']['Tables']['comments']['Row'], 'submission_id' | 'user_id' | 'content'>
        Update: Partial<Pick<Database['public']['Tables']['comments']['Row'], 'content'>>
      }
      feedbacks: {
        Row: {
          id: string
          submission_id: string | null
          mentor_id: string | null
          ai_draft: string | null
          final_text: string | null
          strengths: string | null
          improvements: string | null
          priority_action: string | null
          league_impact: string | null
          score: number | null
          status: 'pending' | 'published'
          created_at: string
          published_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['feedbacks']['Row'], 'status' | 'created_at' | 'published_at'>
        Update: Partial<Database['public']['Tables']['feedbacks']['Insert']>
      }
      badges: {
        Row: {
          id: string
          user_id: string | null
          badge_type: string
          metadata: Json | null
          created_at: string
        }
        Insert: Pick<Database['public']['Tables']['badges']['Row'], 'user_id' | 'badge_type' | 'metadata'>
        Update: never
      }
      user_badges: {
        Row: { id: string; user_id: string; badge_id: string; earned_at: string }
        Insert: Pick<Database['public']['Tables']['user_badges']['Row'], 'user_id' | 'badge_id'>
        Update: never
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string | null
          plan: 'free' | 'pro' | 'studio'
          status: 'active' | 'past_due' | 'canceled' | 'trialing'
          paddle_subscription_id: string | null
          paddle_customer_id: string | null
          current_period_start: string | null
          current_period_end: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subscriptions']['Row'], 'status' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          data: Json | null
          is_read: boolean
          created_at: string
        }
        Insert: Pick<Database['public']['Tables']['notifications']['Row'], 'user_id' | 'type' | 'data'>
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'is_read'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Challenge = Database['public']['Tables']['challenges']['Row']
export type Submission = Database['public']['Tables']['submissions']['Row']
export type RandomBrief = Database['public']['Tables']['random_briefs']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Feedback = Database['public']['Tables']['feedbacks']['Row']
export type Badge = Database['public']['Tables']['badges']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
