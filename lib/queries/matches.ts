import { createClient } from "@/lib/supabase/server";

export async function getMatches(competitionId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("matches")
    .select(
      `
      id, round, status, best_of, scheduled_at,
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
