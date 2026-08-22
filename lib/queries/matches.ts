import { createClient } from "@/lib/supabase/server";

export async function getMatches(competitionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      `
        id, round, status, best_of, scheduled_at, forfeited_by,
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
