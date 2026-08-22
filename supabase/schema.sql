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

-- Creator becomes comp admin automatically
create function public.handle_new_competition()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.comp_admins (competition_id, user_id)
  values (new.id, new.created_by);
  return new;
end;
$$;

create trigger on_competition_created
  after insert on competitions
  for each row execute function public.handle_new_competition();

-- Captains can withdraw their team's signup; admins can remove signups
create policy "captain withdraws signup" on signups
  for delete using (
    exists (
      select 1 from team_members tm
      where tm.team_id = signups.team_id
        and tm.user_id = auth.uid() and tm.role = 'captain'
    )
  );

create policy "admins remove signups" on signups
  for delete using (public.is_comp_admin(competition_id));

  -- ===== RUN THIS BLOCK FIRST, ALONE =====
alter type competition_status add value if not exists 'draft' before 'active';
create type match_stage as enum ('regular', 'playoff');
create type reschedule_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- ===== THEN THE REST =====
alter table matches add column stage match_stage not null default 'regular';
alter table matches add column forfeited_by uuid references teams(id);

create table match_reschedules (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  proposed_at timestamptz not null,
  requested_by uuid not null references users(id),
  opponent_approved_by uuid references users(id),
  admin_approved_by uuid references users(id),
  status reschedule_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table match_reschedules enable row level security;

create policy "public read" on match_reschedules for select using (true);

-- Helper: is user a captain of one of the match's teams? Returns that team id.
create function public.captain_team_in_match(p_match_id uuid)
returns uuid
language sql
security definer set search_path = ''
stable
as $$
  select tm.team_id
  from public.matches m
  join public.team_members tm
    on tm.team_id in (m.team_a_id, m.team_b_id)
  where m.id = p_match_id
    and tm.user_id = auth.uid()
    and tm.role = 'captain'
  limit 1;
$$;

-- Propose: only a participating captain, only one reschedule ever per match
create function public.propose_reschedule(p_match_id uuid, p_proposed_at timestamptz)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  m record;
  my_team uuid;
begin
  select * into m from public.matches
  where id = p_match_id and status = 'scheduled';
  if m is null then raise exception 'Match not found or not reschedulable'; end if;

  my_team := public.captain_team_in_match(p_match_id);
  if my_team is null then raise exception 'Only a participating captain can propose'; end if;

  if exists (select 1 from public.match_reschedules
             where match_id = p_match_id and status in ('pending', 'approved')) then
    raise exception 'This match has already used its reschedule';
  end if;

  if m.scheduled_at is null then raise exception 'Match has no scheduled time yet'; end if;
  if p_proposed_at <= m.scheduled_at then
    raise exception 'Proposed time must be after the current time slot';
  end if;
  if p_proposed_at > m.scheduled_at + interval '7 days' then
    raise exception 'Matches can be moved at most 1 week';
  end if;

  insert into public.match_reschedules (match_id, proposed_at, requested_by)
  values (p_match_id, p_proposed_at, auth.uid());
end;
$$;

-- Approve: opposing captain and comp admin each fill their slot; both filled → applied
create function public.approve_reschedule(p_reschedule_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  req record;
  m record;
  my_team uuid;
  requester_team uuid;
  is_admin boolean;
  did_something boolean := false;
begin
  select * into req from public.match_reschedules
  where id = p_reschedule_id and status = 'pending';
  if req is null then raise exception 'Request not found or not pending'; end if;

  select * into m from public.matches where id = req.match_id;
  is_admin := public.is_comp_admin(m.competition_id);
  my_team := public.captain_team_in_match(req.match_id);

  select public.captain_team_in_match(req.match_id) into requester_team;
  -- requester's team: derive from requested_by instead
  select tm.team_id into requester_team
  from public.team_members tm
  where tm.user_id = req.requested_by
    and tm.team_id in (m.team_a_id, m.team_b_id)
  limit 1;

  -- Opposing captain approval
  if my_team is not null and my_team <> requester_team
     and req.opponent_approved_by is null then
    update public.match_reschedules
    set opponent_approved_by = auth.uid() where id = p_reschedule_id;
    did_something := true;
  end if;

  -- Admin approval
  if is_admin and req.admin_approved_by is null then
    update public.match_reschedules
    set admin_approved_by = auth.uid() where id = p_reschedule_id;
    did_something := true;
  end if;

  if not did_something then
    raise exception 'Nothing for you to approve on this request';
  end if;

  -- Both slots filled → apply
  select * into req from public.match_reschedules where id = p_reschedule_id;
  if req.opponent_approved_by is not null and req.admin_approved_by is not null then
    update public.matches set scheduled_at = req.proposed_at where id = req.match_id;
    update public.match_reschedules set status = 'approved' where id = p_reschedule_id;
  end if;
end;
$$;

-- Reject: opposing captain or admin kills it
create function public.reject_reschedule(p_reschedule_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  req record;
  m record;
  my_team uuid;
  requester_team uuid;
begin
  select * into req from public.match_reschedules
  where id = p_reschedule_id and status = 'pending';
  if req is null then raise exception 'Request not found or not pending'; end if;

  select * into m from public.matches where id = req.match_id;
  select tm.team_id into requester_team
  from public.team_members tm
  where tm.user_id = req.requested_by
    and tm.team_id in (m.team_a_id, m.team_b_id)
  limit 1;
  my_team := public.captain_team_in_match(req.match_id);

  if public.is_comp_admin(m.competition_id)
     or (my_team is not null and my_team <> requester_team) then
    update public.match_reschedules set status = 'rejected' where id = p_reschedule_id;
  else
    raise exception 'Not allowed to reject this request';
  end if;
end;
$$;

-- Forfeit: participating captain concedes; opponent wins by FF
create function public.forfeit_match(p_match_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  my_team uuid;
begin
  my_team := public.captain_team_in_match(p_match_id);
  if my_team is null then raise exception 'Only a participating captain can forfeit'; end if;

  update public.matches
  set forfeited_by = my_team, status = 'completed'
  where id = p_match_id and status = 'scheduled';

  if not found then raise exception 'Match not found or already completed'; end if;

  -- Void any open reschedule
  update public.match_reschedules
  set status = 'cancelled'
  where match_id = p_match_id and status = 'pending';
end;
$$;

-- Pairwise team swap between two draft matches (admin, draft phase only)
create function public.swap_match_teams(
  p_match_a uuid, p_slot_a text,
  p_match_b uuid, p_slot_b text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  ma record; mb record;
  comp record;
  team_x uuid; team_y uuid;
begin
  select * into ma from public.matches where id = p_match_a;
  select * into mb from public.matches where id = p_match_b;
  if ma is null or mb is null then raise exception 'Match not found'; end if;
  if ma.competition_id <> mb.competition_id then
    raise exception 'Matches must be in the same competition';
  end if;

  select * into comp from public.competitions where id = ma.competition_id;
  if comp.status <> 'draft' then raise exception 'Swaps only in draft phase'; end if;
  if not public.is_comp_admin(comp.id) then raise exception 'Admins only'; end if;
  if p_slot_a not in ('a','b') or p_slot_b not in ('a','b') then
    raise exception 'Slots must be a or b';
  end if;

  team_x := case p_slot_a when 'a' then ma.team_a_id else ma.team_b_id end;
  team_y := case p_slot_b when 'a' then mb.team_a_id else mb.team_b_id end;

  if p_slot_a = 'a' then update public.matches set team_a_id = team_y where id = p_match_a;
  else update public.matches set team_b_id = team_y where id = p_match_a; end if;

  if p_slot_b = 'a' then update public.matches set team_a_id = team_x where id = p_match_b;
  else update public.matches set team_b_id = team_x where id = p_match_b; end if;
end;
$$;

-- Publish: draft → active
create function public.publish_schedule(p_comp_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_comp_admin(p_comp_id) then raise exception 'Admins only'; end if;
  update public.competitions set status = 'active'
  where id = p_comp_id and status = 'draft';
  if not found then raise exception 'Competition not in draft'; end if;
end;
$$;

create or replace function public.start_competition(p_comp_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  comp record;
  team_ids uuid[];
  n int;
  rounds int;
  i int; r int; slot int;
  a uuid; b uuid;
  v_best_of int;
  s_date date;
  interval_days int;
  times jsonb;
  tcount int;
  mtime time;
begin
  if not public.is_comp_admin(p_comp_id) then
    raise exception 'Only competition admins can start the competition';
  end if;

  select * into comp from public.competitions
  where id = p_comp_id and status = 'open';
  if comp is null then raise exception 'Competition not found or not open'; end if;

  if comp.settings->>'start_date' is null then
    raise exception 'Competition settings need a start_date';
  end if;
  s_date := (comp.settings->>'start_date')::date;
  interval_days := coalesce((comp.settings->>'round_interval_days')::int, 7);
  times := coalesce(comp.settings->'match_times', '["19:00"]'::jsonb);
  tcount := jsonb_array_length(times);
  v_best_of := coalesce((comp.settings->>'best_of')::int, 3);

  select coalesce(array_agg(team_id order by created_at), '{}')
  into team_ids
  from public.signups
  where competition_id = p_comp_id and status = 'accepted';

  n := array_length(team_ids, 1);
  if n is null or n < 2 then raise exception 'Need at least 2 accepted teams'; end if;

  if comp.type = 'league' then
    if n % 2 = 1 then
      team_ids := team_ids || null::uuid;
      n := n + 1;
    end if;
    rounds := n - 1;

    for r in 1..rounds loop
      slot := 0;
      for i in 1..(n / 2) loop
        a := team_ids[i];
        b := team_ids[n + 1 - i];
        if a is not null and b is not null then
          mtime := (times->>(slot % tcount))::time;
          insert into public.matches
            (competition_id, team_a_id, team_b_id, round, best_of, scheduled_at)
          values (
            p_comp_id, a, b, r, v_best_of,
            ((s_date + (r - 1) * interval_days) + mtime) at time zone 'Europe/Copenhagen'
          );
          slot := slot + 1;
        end if;
      end loop;
      team_ids := team_ids[1:1] || team_ids[n:n] || team_ids[2:n-1];
    end loop;

  else
    select array_agg(t order by random()) into team_ids
    from unnest(team_ids) t;

    slot := 0;
    i := 1;
    while i < n loop
      mtime := (times->>(slot % tcount))::time;
      insert into public.matches
        (competition_id, team_a_id, team_b_id, round, best_of, scheduled_at)
      values (
        p_comp_id, team_ids[i], team_ids[i + 1], 1, v_best_of,
        (s_date + mtime) at time zone 'Europe/Copenhagen'
      );
      slot := slot + 1;
      i := i + 2;
    end loop;
  end if;

  update public.competitions set status = 'draft' where id = p_comp_id;
end;
$$;

-- Draft schedules are admin-only; matches go public when the competition is
drop policy "public read" on matches;
create policy "read matches" on matches for select using (
  public.is_comp_admin(competition_id)
  or exists (
    select 1 from competitions c
    where c.id = matches.competition_id and c.status in ('active', 'completed')
  )
);

create function public.reopen_competition(p_comp_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if not public.is_comp_admin(p_comp_id) then
    raise exception 'Admins only';
  end if;

  delete from public.matches where competition_id = p_comp_id;

  update public.competitions set status = 'open'
  where id = p_comp_id and status = 'draft';

  if not found then
    raise exception 'Competition is not in draft';
  end if;
end;
$$;

create or replace function public.swap_match_teams(
  p_match_a uuid, p_slot_a text,
  p_match_b uuid, p_slot_b text
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  ma record; mb record;
  comp record;
  team_x uuid; team_y uuid;
  other_a uuid; other_b uuid;
begin
  if p_match_a = p_match_b then
    raise exception 'Pick two different matches';
  end if;

  select * into ma from public.matches where id = p_match_a;
  select * into mb from public.matches where id = p_match_b;
  if ma is null or mb is null then raise exception 'Match not found'; end if;
  if ma.competition_id <> mb.competition_id then
    raise exception 'Matches must be in the same competition';
  end if;

  select * into comp from public.competitions where id = ma.competition_id;
  if comp.status <> 'draft' then raise exception 'Swaps only in draft phase'; end if;
  if not public.is_comp_admin(comp.id) then raise exception 'Admins only'; end if;
  if p_slot_a not in ('a','b') or p_slot_b not in ('a','b') then
    raise exception 'Slots must be a or b';
  end if;

  team_x := case p_slot_a when 'a' then ma.team_a_id else ma.team_b_id end;
  team_y := case p_slot_b when 'a' then mb.team_a_id else mb.team_b_id end;
  other_a := case p_slot_a when 'a' then ma.team_b_id else ma.team_a_id end;
  other_b := case p_slot_b when 'a' then mb.team_b_id else mb.team_a_id end;

  if team_x = team_y then
    raise exception 'Same team selected twice — nothing to swap';
  end if;
  if team_y = other_a or team_x = other_b then
    raise exception 'A team cannot play itself';
  end if;

  if p_slot_a = 'a' then update public.matches set team_a_id = team_y where id = p_match_a;
  else update public.matches set team_b_id = team_y where id = p_match_a; end if;

  if p_slot_b = 'a' then update public.matches set team_a_id = team_x where id = p_match_b;
  else update public.matches set team_b_id = team_x where id = p_match_b; end if;

  -- Round-robin integrity: no pairing may occur twice
  if exists (
    select 1 from public.matches
    where competition_id = comp.id and stage = 'regular'
    group by least(team_a_id, team_b_id), greatest(team_a_id, team_b_id)
    having count(*) > 1
  ) then
    raise exception 'Swap rejected — it would make two teams meet twice';
  end if;
end;
$$;