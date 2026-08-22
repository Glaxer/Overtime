type OutcomeMatch = {
  team_a: { id: string };
  team_b: { id: string };
  forfeited_by: string | null;
  games: { score_a: number; score_b: number }[];
};

export function matchOutcome(m: OutcomeMatch) {
  if (m.forfeited_by) {
    const winnerId = m.forfeited_by === m.team_a.id ? m.team_b.id : m.team_a.id;
    return { played: true, forfeit: true, winnerId, gamesA: 0, gamesB: 0 };
  }
  if (m.games.length === 0) {
    return {
      played: false,
      forfeit: false,
      winnerId: null,
      gamesA: 0,
      gamesB: 0
    };
  }
  const gamesA = m.games.filter((g) => g.score_a > g.score_b).length;
  const gamesB = m.games.filter((g) => g.score_b > g.score_a).length;
  return {
    played: true,
    forfeit: false,
    winnerId: gamesA > gamesB ? m.team_a.id : m.team_b.id,
    gamesA,
    gamesB
  };
}
