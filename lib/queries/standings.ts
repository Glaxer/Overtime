import { createClient } from "@/lib/supabase/server";
import { matchOutcome } from "@/lib/matchOutcome";

export type StandingRow = {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  points: number;
};

export async function getStandings(
  competitionId: string
): Promise<StandingRow[]> {
  const supabase = await createClient();

  const [{ data: comp }, { data: signups }, { data: matches }] =
    await Promise.all([
      supabase
        .from("competitions")
        .select("settings")
        .eq("id", competitionId)
        .single(),
      supabase
        .from("signups")
        .select("team:teams ( id, name )")
        .eq("competition_id", competitionId)
        .eq("status", "accepted"),
      supabase
        .from("matches")
        .select(
          `
        forfeited_by,
        team_a:teams!matches_team_a_id_fkey ( id ),
        team_b:teams!matches_team_b_id_fkey ( id ),
        games ( score_a, score_b )
      `
        )
        .eq("competition_id", competitionId)
        .eq("stage", "regular")
    ]);

  const settings = (comp?.settings ?? {}) as {
    points_win?: number;
    points_loss?: number;
  };
  const pointsWin = settings.points_win ?? 3;
  const pointsLoss = settings.points_loss ?? 0;

  const table = new Map<string, StandingRow>();
  for (const s of signups ?? []) {
    table.set(s.team.id, {
      teamId: s.team.id,
      teamName: s.team.name,
      played: 0,
      wins: 0,
      losses: 0,
      gameWins: 0,
      gameLosses: 0,
      gameDiff: 0,
      points: 0
    });
  }

  for (const m of matches ?? []) {
    const o = matchOutcome(m);
    if (!o.played) continue;

    const a = table.get(m.team_a.id);
    const b = table.get(m.team_b.id);
    if (!a || !b) continue;

    a.played++;
    b.played++;
    a.gameWins += o.gamesA;
    a.gameLosses += o.gamesB;
    b.gameWins += o.gamesB;
    b.gameLosses += o.gamesA;

    const winner = o.winnerId === a.teamId ? a : b;
    const loser = o.winnerId === a.teamId ? b : a;
    winner.wins++;
    loser.losses++;
    winner.points += pointsWin;
    loser.points += pointsLoss;
  }

  return [...table.values()]
    .map((r) => ({ ...r, gameDiff: r.gameWins - r.gameLosses }))
    .sort(
      (x, y) =>
        y.points - x.points ||
        y.gameDiff - x.gameDiff ||
        y.gameWins - x.gameWins ||
        x.teamName.localeCompare(y.teamName)
    );
}
