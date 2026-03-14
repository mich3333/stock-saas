-- profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  tier text not null default 'free' check (tier in ('free', 'pro', 'enterprise')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- subscriptions table
create table if not exists public.subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  tier text not null default 'free',
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- watchlists table
create table if not exists public.watchlists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- watchlist_items table
create table if not exists public.watchlist_items (
  id uuid default gen_random_uuid() primary key,
  watchlist_id uuid references public.watchlists(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  added_at timestamptz default now(),
  notes text,
  unique(watchlist_id, symbol)
);

-- alerts table
create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  condition text not null check (condition in ('above', 'below')),
  target_price numeric not null,
  is_active boolean default true,
  triggered_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- portfolio_positions table
create table if not exists public.portfolio_positions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  symbol text not null,
  shares numeric not null,
  avg_price numeric not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, symbol)
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.watchlists enable row level security;
alter table public.watchlist_items enable row level security;
alter table public.alerts enable row level security;
alter table public.portfolio_positions enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

create policy "Users can view own subscription" on public.subscriptions for select using (auth.uid() = user_id);
create policy "Users can view own watchlists" on public.watchlists for all using (auth.uid() = user_id);
create policy "Users can manage own watchlist items" on public.watchlist_items for all using (auth.uid() = user_id);
create policy "Users can manage own alerts" on public.alerts for all using (auth.uid() = user_id);
create policy "Users can manage own portfolio" on public.portfolio_positions for all using (auth.uid() = user_id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');

  insert into public.watchlists (user_id, name, is_default)
  values (new.id, 'My Watchlist', true);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger handle_watchlists_updated_at before update on public.watchlists
  for each row execute function public.handle_updated_at();

create trigger handle_alerts_updated_at before update on public.alerts
  for each row execute function public.handle_updated_at();

create trigger handle_portfolio_updated_at before update on public.portfolio_positions
  for each row execute function public.handle_updated_at();

create trigger handle_subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- Indexes for performance
create index if not exists idx_watchlists_user_id on public.watchlists(user_id);
create index if not exists idx_watchlist_items_watchlist_id on public.watchlist_items(watchlist_id);
create index if not exists idx_watchlist_items_user_id on public.watchlist_items(user_id);
create index if not exists idx_alerts_user_id on public.alerts(user_id);
create index if not exists idx_alerts_symbol on public.alerts(symbol);
create index if not exists idx_alerts_is_active on public.alerts(is_active);
create index if not exists idx_portfolio_user_id on public.portfolio_positions(user_id);
