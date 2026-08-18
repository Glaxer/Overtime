-- ============ ENUMS ============
create type competition_type as enum ('league', 'tournament');
create type competition_status as enum ('draft', 'open', 'active', 'completed');
create type signup_status as enum ('pending', 'accepted', 'rejected');
create type match_status as enum ('scheduled', 'live', 'completed', 'cancelled');
create type submission_status as enum ('pending', 'verified', 'rejected');
create type team_role as enum ('captain', 'member');

-- ============ TABLES ============
create table titles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  stat_schema jsonb not null default '{"stats": []}'::jsonb,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table user_titles (
  user_id uuid not null references users(id) on delete cascade,
  title_id uuid not null references titles(id) on delete cascade,
  primary key (user_id, title_id)
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id),
  name text not null,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table team_members (
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role team_role not null default 'member',
  primary key (team_id, user_id)
);

create table competitions (
  id uuid primary key default gen_random_uuid(),
  title_id uuid not null references titles(id),
  name text not null,
  type competition_type not null,
  status competition_status not null default 'draft',
  team_size int not null default 3,
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table comp_admins (
  competition_id uuid not null references competitions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  primary key (competition_id, user_id)
);

create table signups (
  competition_id uuid not null references competitions(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  status signup_status not null default 'pending',
  created_at timestamptz not null default now(),
  primary key (competition_id, team_id)
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid not null references competitions(id) on delete cascade,
  team_a_id uuid not null references teams(id),
  team_b_id uuid not null references teams(id),
  round int not null default 1,
  scheduled_at timestamptz,
  status match_status not null default 'scheduled',
  best_of int not null default 1,
  created_at timestamptz not null default now(),
  check (team_a_id <> team_b_id),
  check (best_of % 2 = 1)
);

create table games (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  game_number int not null,
  score_a int not null,
  score_b int not null,
  unique (match_id, game_number)
);

create table game_player_stats (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references games(id) on delete cascade,
  user_id uuid not null references users(id),
  stats jsonb not null default '{}'::jsonb,
  unique (game_id, user_id)
);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  submitted_by uuid not null references users(id),
  payload jsonb not null,
  evidence_url text,
  status submission_status not null default 'pending',
  verified_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- ============ AUTO-CREATE users ROW ON SIGNUP ============
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ ROW LEVEL SECURITY ============
alter table titles enable row level security;
alter table users enable row level security;
alter table user_titles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table competitions enable row level security;
alter table comp_admins enable row level security;
alter table signups enable row level security;
alter table matches enable row level security;
alter table games enable row level security;
alter table game_player_stats enable row level security;
alter table submissions enable row level security;

-- Helper: is the current user an admin of a competition?
create function public.is_comp_admin(comp_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.comp_admins
    where competition_id = comp_id and user_id = auth.uid()
  );
$$;

-- ---- Everyone can READ everything public-facing ----
create policy "public read" on titles for select using (true);
create policy "public read" on users for select using (true);
create policy "public read" on teams for select using (true);
create policy "public read" on team_members for select using (true);
create policy "public read" on competitions for select using (true);
create policy "public read" on comp_admins for select using (true);
create policy "public read" on signups for select using (true);
create policy "public read" on matches for select using (true);
create policy "public read" on games for select using (true);
create policy "public read" on game_player_stats for select using (true);

-- ---- users: manage own row ----
create policy "update own profile" on users
  for update using (auth.uid() = id);

-- ---- user_titles: manage own preferences ----
create policy "manage own titles" on user_titles
  for all using (auth.uid() = user_id);

-- ---- teams: any signed-in user creates; creator updates ----
create policy "create team" on teams
  for insert with check (auth.uid() = created_by);
create policy "update own team" on teams
  for update using (auth.uid() = created_by);

-- ---- team_members: captains manage roster; users can join/leave themselves ----
create policy "captain manages members" on team_members
  for all using (
    exists (
      select 1 from team_members tm
      where tm.team_id = team_members.team_id
        and tm.user_id = auth.uid() and tm.role = 'captain'
    )
  );
create policy "manage own membership" on team_members
  for all using (auth.uid() = user_id);

-- ---- competitions: any signed-in user creates; comp admins update ----
create policy "create competition" on competitions
  for insert with check (auth.uid() = created_by);
create policy "admins update competition" on competitions
  for update using (public.is_comp_admin(id));

-- ---- comp_admins: comp admins manage the admin list ----
create policy "admins manage admins" on comp_admins
  for all using (public.is_comp_admin(competition_id));

-- ---- signups: team captains sign their team up; comp admins manage ----
create policy "captain signs up team" on signups
  for insert with check (
    exists (
      select 1 from team_members tm
      where tm.team_id = signups.team_id
        and tm.user_id = auth.uid() and tm.role = 'captain'
    )
  );
create policy "admins manage signups" on signups
  for update using (public.is_comp_admin(competition_id));

-- ---- matches: only comp admins create/manage ----
create policy "admins manage matches" on matches
  for all using (public.is_comp_admin(competition_id));

-- ---- games + stats: only comp admins write (materialized on verification) ----
create policy "admins write games" on games
  for all using (
    public.is_comp_admin((select m.competition_id from matches m where m.id = games.match_id))
  );
create policy "admins write stats" on game_player_stats
  for all using (
    public.is_comp_admin((
      select m.competition_id from matches m
      join games g on g.match_id = m.id
      where g.id = game_player_stats.game_id
    ))
  );

-- ---- submissions: participants submit; admins verify; involved parties read ----
create policy "read submissions" on submissions for select using (true);
create policy "participant submits" on submissions
  for insert with check (
    auth.uid() = submitted_by
    and exists (
      select 1 from matches m
      join team_members tm on tm.team_id in (m.team_a_id, m.team_b_id)
      where m.id = submissions.match_id and tm.user_id = auth.uid()
    )
  );
create policy "admins verify submissions" on submissions
  for update using (
    public.is_comp_admin((select m.competition_id from matches m where m.id = submissions.match_id))
  );

-- Auto-add creator as captain (mirrors the auth signup trigger pattern)
create function public.handle_new_team()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, new.created_by, 'captain');
  return new;
end;
$$;

create trigger on_team_created
  after insert on teams
  for each row execute function public.handle_new_team();

-- Replace the too-loose policy: users may only LEAVE, not add themselves
drop policy "manage own membership" on team_members;

create policy "leave team" on team_members
  for delete using (auth.uid() = user_id);

-- Helper: is the current user captain of this team? (security definer breaks the recursion)
create function public.is_team_captain(t_id uuid)
returns boolean
language sql
security definer set search_path = ''
stable
as $$
  select exists (
    select 1 from public.team_members
    where team_id = t_id and user_id = auth.uid() and role = 'captain'
  );
$$;

-- Replace the recursive policy
drop policy "captain manages members" on team_members;

create policy "captain manages members" on team_members
  for all using (public.is_team_captain(team_id));

create unique index teams_title_lower_name_key on teams (title_id, lower(name));

create type invite_status as enum ('pending', 'accepted', 'declined');

create table team_invites (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  invited_by uuid not null references users(id),
  status invite_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

alter table team_invites enable row level security;

-- Only the involved parties see invites (not public — your invites are your business)
create policy "see own invites" on team_invites
  for select using (
    auth.uid() = user_id or public.is_team_captain(team_id)
  );

create policy "captain invites" on team_invites
  for insert with check (
    public.is_team_captain(team_id) and auth.uid() = invited_by
  );

-- Invitee answers their own pending invite
create policy "invitee responds" on team_invites
  for update using (auth.uid() = user_id and status = 'pending');

-- Captain can retract a pending invite
create policy "captain cancels" on team_invites
  for delete using (public.is_team_captain(team_id));

  create function public.accept_team_invite(invite_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  inv record;
begin
  select * into inv from public.team_invites
  where id = invite_id and user_id = auth.uid() and status = 'pending';

  if inv is null then
    raise exception 'Invite not found or not yours';
  end if;

  update public.team_invites set status = 'accepted' where id = invite_id;
  insert into public.team_members (team_id, user_id, role)
  values (inv.team_id, inv.user_id, 'member');
end;
$$;