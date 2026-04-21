-- Enable extensions
create extension if not exists "uuid-ossp";

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  twitter text,
  linkedin text,
  dribbble text,
  behance text,
  xp integer not null default 0,
  level integer not null default 1,
  league text not null default 'bronze' check (league in ('bronze','silver','gold','platinum','diamond')),
  streak integer not null default 0,
  subscription_tier text not null default 'free' check (subscription_tier in ('free','pro','studio')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CHALLENGES
create table public.challenges (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  description text not null,
  brief text not null,
  category text not null,
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced','expert')),
  xp_reward integer not null default 50,
  deadline timestamptz,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  cover_url text,
  tags text[] not null default '{}',
  submission_count integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- SUBMISSIONS
create table public.submissions (
  id uuid primary key default uuid_generate_v4(),
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  image_url text not null,
  figma_url text,
  live_url text,
  score integer,
  ai_feedback text,
  is_winner boolean not null default false,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(challenge_id, user_id)
);

-- LIKES
create table public.likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  submission_id uuid references public.submissions(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, submission_id)
);

-- COMMENTS
create table public.comments (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id uuid references public.comments(id) on delete cascade,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FEEDBACKS
create table public.feedbacks (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid references public.submissions(id) on delete cascade not null,
  reviewer_id uuid references public.profiles(id) on delete cascade not null,
  visual_score integer not null check (visual_score between 0 and 100),
  ux_score integer not null check (ux_score between 0 and 100),
  creativity_score integer not null check (creativity_score between 0 and 100),
  overall_score integer not null check (overall_score between 0 and 100),
  comment text,
  is_ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

-- RANDOM BRIEFS
create table public.random_briefs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  brief_content jsonb not null,
  industry text not null,
  style text not null,
  constraints text[] not null default '{}',
  used boolean not null default false,
  created_at timestamptz not null default now()
);

-- BADGES
create table public.badges (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text not null,
  icon_url text,
  category text not null,
  xp_threshold integer,
  challenge_count integer,
  is_rare boolean not null default false,
  created_at timestamptz not null default now()
);

-- USER BADGES
create table public.user_badges (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id uuid references public.badges(id) on delete cascade not null,
  earned_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

-- SUBSCRIPTIONS
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  paddle_customer_id text,
  paddle_subscription_id text,
  plan text not null default 'free' check (plan in ('free','pro','studio')),
  status text not null default 'active' check (status in ('active','past_due','canceled','trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('like','comment','badge','league_up','challenge_winner','feedback','system')),
  title text not null,
  body text not null,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- INDEXES
create index on public.submissions(challenge_id);
create index on public.submissions(user_id);
create index on public.likes(submission_id);
create index on public.comments(submission_id);
create index on public.notifications(user_id, is_read);

-- RLS
alter table public.profiles enable row level security;
alter table public.challenges enable row level security;
alter table public.submissions enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.feedbacks enable row level security;
alter table public.random_briefs enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.subscriptions enable row level security;
alter table public.notifications enable row level security;

-- POLICIES
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Active challenges are viewable by everyone" on public.challenges for select using (is_active = true);

create policy "Approved submissions are viewable by everyone" on public.submissions for select using (status = 'approved');
create policy "Users can insert own submissions" on public.submissions for insert with check (auth.uid() = user_id);
create policy "Users can update own submissions" on public.submissions for update using (auth.uid() = user_id);

create policy "Likes are viewable by everyone" on public.likes for select using (true);
create policy "Users can manage own likes" on public.likes for all using (auth.uid() = user_id);

create policy "Comments are viewable by everyone" on public.comments for select using (true);
create policy "Users can insert comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can update own comments" on public.comments for update using (auth.uid() = user_id);

create policy "Feedbacks are viewable by everyone" on public.feedbacks for select using (true);
create policy "Users can insert feedbacks" on public.feedbacks for insert with check (auth.uid() = reviewer_id);

create policy "Users can view own briefs" on public.random_briefs for all using (auth.uid() = user_id);

create policy "Badges are viewable by everyone" on public.badges for select using (true);
create policy "User badges are viewable by everyone" on public.user_badges for select using (true);

create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can view own notifications" on public.notifications for all using (auth.uid() = user_id);

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := coalesce(
    new.raw_user_meta_data->>'username',
    split_part(new.email, '@', 1)
  );
  base_username := regexp_replace(lower(base_username), '[^a-z0-9_]', '', 'g');
  final_username := base_username;

  loop
    exit when not exists (select 1 from public.profiles where username = final_username);
    counter := counter + 1;
    final_username := base_username || counter;
  end loop;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.subscriptions (user_id) values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- AUTO-UPDATE updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger handle_updated_at before update on public.profiles for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.challenges for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.submissions for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.subscriptions for each row execute procedure public.handle_updated_at();
