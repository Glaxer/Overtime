import { createClient } from "@/lib/supabase/server";

export async function getMatches(competitionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      `
        id, round, status, best_of, scheduled_at, forfeited_by, stage,
        team_a:teams!matches_team_a_id_fkey ( id, name ),
        team_b:teams!matches_team_b_id_fkey ( id, name ),
        games ( game_number, score_a, score_b )
      `
    )
    .eq("competition_id", competitionId)
    .order("round")
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  return data ?? [];
}

export async function getMatch(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        id, competition_id, round, status, best_of, scheduled_at, forfeited_by,
        competition:competitions ( id, name, status ),
        team_a:teams!matches_team_a_id_fkey ( id, name ),
        team_b:teams!matches_team_b_id_fkey ( id, name ),
        games ( game_number, score_a, score_b ),
        submissions (
          id, status, payload, created_at,
          submitter:users!submissions_submitted_by_fkey ( id, display_name )
        ),
        reschedules:match_reschedules (
          id, proposed_at, status, created_at,
          requested_by,
          opponent_approved_by, admin_approved_by,
          requester:users!match_reschedules_requested_by_fkey ( id, display_name )
        )
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("getMatch error:", error);
    return null;
  }
  return data;
}

export async function getMyUpcomingMatches(userId: string) {
  const supabase = await createClient();

  const { data: teamRows } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId);

  const teamIds = (teamRows ?? []).map((t) => t.team_id);
  if (teamIds.length === 0) return [];

  const { data } = await supabase
    .from("matches")
    .select(
      `
        id, round, scheduled_at, status,
        competition:competitions ( id, name, status ),
        team_a:teams!matches_team_a_id_fkey ( id, name ),
        team_b:teams!matches_team_b_id_fkey ( id, name )
      `
    )
    .in("status", ["scheduled"])
    .or(
      `team_a_id.in.(${teamIds.join(",")}),team_b_id.in.(${teamIds.join(",")})`
    )
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .limit(5);

  return (data ?? []).filter((m) => m.competition.status === "active");
}

export async function getRescheduleRequestsForMe(userId: string) {
  const supabase = await createClient();

  const [{ data: teamRows }, { data: adminRows }] = await Promise.all([
    supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .eq("role", "captain"),
    supabase.from("comp_admins").select("competition_id").eq("user_id", userId)
  ]);

  const teamIds = (teamRows ?? []).map((t) => t.team_id);
  const compIds = (adminRows ?? []).map((c) => c.competition_id);
  if (teamIds.length === 0 && compIds.length === 0) return [];

  const { data } = await supabase
    .from("match_reschedules")
    .select(
      `
        id, proposed_at, requested_by, opponent_approved_by, admin_approved_by,
        match:matches (
          id, scheduled_at, competition_id,
          team_a:teams!matches_team_a_id_fkey ( id, name ),
          team_b:teams!matches_team_b_id_fkey ( id, name )
        ),
        requester:users!match_reschedules_requested_by_fkey ( display_name )
      `
    )
    .eq("status", "pending")
    .neq("requested_by", userId); // never asked to approve your own request

  return (data ?? []).filter(
    (r) =>
      compIds.includes(r.match.competition_id) ||
      teamIds.includes(r.match.team_a.id) ||
      teamIds.includes(r.match.team_b.id)
  );
}
