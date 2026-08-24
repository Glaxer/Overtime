import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompetition } from "@/lib/queries/competitions";
import { getMyTeams } from "@/lib/queries/teams";
import { getMatches } from "@/lib/queries/matches";
import { getStandings } from "@/lib/queries/standings";
import {
  signupTeam,
  setSignupStatus,
  withdrawSignup,
  startCompetition,
  publishSchedule,
  reopenCompetition,
  updatePlayoffTeams,
  generatePlayoffs
} from "../actions";
import SwapTool from "@/components/ui/SwapTool";
import MatchRow from "@/components/MatchRow";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default async function CompetitionPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const comp = await getCompetition(id);
  if (!comp) notFound();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const isAdmin = comp.admins.some((a) => a.user.id === user?.id);

  const [myTeams, matches, standings] = await Promise.all([
    user ? getMyTeams(user.id) : Promise.resolve([]),
    getMatches(comp.id),
    comp.type === "league" ? getStandings(comp.id) : Promise.resolve([])
  ]);

  // --- signups ---
  const signedUpTeamIds = new Set(comp.signups.map((s) => s.team.id));
  const eligibleTeams = myTeams.filter(
    (m) =>
      m.role === "captain" &&
      m.team.title.name === comp.title.name &&
      !signedUpTeamIds.has(m.team.id)
  );
  const mySignups = comp.signups.filter((s) =>
    myTeams.some((m) => m.role === "captain" && m.team.id === s.team.id)
  );
  const accepted = comp.signups.filter((s) => s.status === "accepted");
  const pending = comp.signups.filter((s) => s.status === "pending");

  // --- matches ---
  const regularMatches = matches.filter((m) => m.stage === "regular");
  const playoffMatches = matches.filter((m) => m.stage === "playoff");
  const regularRounds = [...new Set(regularMatches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const playoffRounds = [...new Set(playoffMatches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const playoffLabel = (r: number) => {
    const count = playoffMatches.filter((m) => m.round === r).length;
    if (count === 1) return "Grand Final";
    if (count === 2) return "Semi-finals";
    if (count === 4) return "Quarter-finals";
    return `Playoff round ${r}`;
  };

  const regularDone =
    regularMatches.length > 0 &&
    regularMatches.every((m) => m.status === "completed");
  const playoffTeams =
    (comp.settings as { playoff_teams?: number })?.playoff_teams ?? 0;

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted">
        {comp.title.name} · {comp.type} · {comp.status}
      </p>
      <h1 className="mb-6 text-2xl font-bold">{comp.name}</h1>

      {/* Teams */}
      <h2 className="mb-2 font-semibold">Teams</h2>
      <ul className="mb-8 flex flex-col gap-1">
        {accepted.map((s) => (
          <li key={s.team.id} className="text-sm">
            <Link href={`/teams/${s.team.id}`} className="hover:underline">
              {s.team.name}
            </Link>
          </li>
        ))}
        {accepted.length === 0 && (
          <li className="text-sm text-muted">No teams yet</li>
        )}
      </ul>

      {/* Sign up */}
      {comp.status === "open" && eligibleTeams.length > 0 && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Sign up a team</h2>
          <form action={signupTeam} className="flex gap-2">
            <input type="hidden" name="competition_id" value={comp.id} />
            <select
              name="team_id"
              required
              className="flex-1 rounded border  border-border p-2 text-sm"
            >
              {eligibleTeams.map((m) => (
                <option key={m.team.id} value={m.team.id}>
                  {m.team.name}
                </option>
              ))}
            </select>
            <Button>Sign up</Button>
          </form>
        </div>
      )}

      {/* Pending signups (admin) */}
      {isAdmin && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Pending signups</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((s) => (
              <li
                key={s.team.id}
                className="flex items-center justify-between rounded border border-border p-3"
              >
                <span className="text-sm font-medium">{s.team.name}</span>
                <span className="flex gap-2">
                  {(["accepted", "rejected"] as const).map((status) => (
                    <form key={status} action={setSignupStatus}>
                      <input
                        type="hidden"
                        name="competition_id"
                        value={comp.id}
                      />
                      <input type="hidden" name="team_id" value={s.team.id} />
                      <input type="hidden" name="status" value={status} />
                      <Button
                        variant={
                          status === "accepted" ? "primary" : "secondary"
                        }
                      >
                        {status === "accepted" ? "Accept" : "Reject"}
                      </Button>
                    </form>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Your signups */}
      {mySignups.length > 0 && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Your signups</h2>
          <ul className="flex flex-col gap-2">
            {mySignups.map((s) => (
              <li
                key={s.team.id}
                className="flex items-center justify-between rounded border border-border p-3"
              >
                <span className="text-sm">
                  {s.team.name}
                  <span className="ml-2 text-xs text-muted">({s.status})</span>
                </span>
                <form action={withdrawSignup}>
                  <input type="hidden" name="competition_id" value={comp.id} />
                  <input type="hidden" name="team_id" value={s.team.id} />
                  <Button variant="secondary">Withdraw</Button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Start (open → draft) */}
      {isAdmin && comp.status === "open" && accepted.length >= 2 && (
        <form action={startCompetition} className="mb-8">
          <input type="hidden" name="competition_id" value={comp.id} />
          <Button>Start competition — generate schedule</Button>
        </form>
      )}

      {/* Standings */}
      {standings.length > 0 && comp.status !== "open" && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Standings</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="py-1 pr-2">#</th>
                <th className="py-1 pr-2">Team</th>
                <th className="py-1 pr-2 text-right">P</th>
                <th className="py-1 pr-2 text-right">W</th>
                <th className="py-1 pr-2 text-right">L</th>
                <th className="py-1 pr-2 text-right">Games</th>
                <th className="py-1 pr-2 text-right">+/−</th>
                <th className="py-1 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, i) => (
                <tr key={row.teamId} className="border-t border-border">
                  <td className="py-1 pr-2 text-muted">{i + 1}</td>
                  <td className="py-1 pr-2">
                    <Link
                      href={`/teams/${row.teamId}`}
                      className="hover:underline"
                    >
                      {row.teamName}
                    </Link>
                  </td>
                  <td className="py-1 pr-2 text-right">{row.played}</td>
                  <td className="py-1 pr-2 text-right">{row.wins}</td>
                  <td className="py-1 pr-2 text-right">{row.losses}</td>
                  <td className="py-1 pr-2 text-right text-muted">
                    {row.gameWins}–{row.gameLosses}
                  </td>
                  <td className="py-1 pr-2 text-right">
                    {row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
                  </td>
                  <td className="py-1 text-right font-medium">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule (regular season) */}
      {regularMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">
            Schedule{" "}
            {comp.status === "draft" && "(draft — only admins can see this)"}
          </h2>
          {regularRounds.map((r) => (
            <div key={r} className="mb-4">
              <h3 className="mb-1 text-sm font-medium text-muted">Round {r}</h3>
              <ul className="flex flex-col gap-1">
                {regularMatches
                  .filter((m) => m.round === r)
                  .map((m) => (
                    <MatchRow
                      key={m.id}
                      match={m}
                      competitionId={comp.id}
                      editable={isAdmin && comp.status === "draft"}
                    />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Playoffs */}
      {playoffMatches.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Playoffs</h2>
          {playoffRounds.map((r) => (
            <div key={r} className="mb-4">
              <h3 className="mb-1 text-sm font-medium text-muted">
                {playoffLabel(r)}
              </h3>
              <ul className="flex flex-col gap-1">
                {playoffMatches
                  .filter((m) => m.round === r)
                  .map((m) => (
                    <MatchRow
                      key={m.id}
                      match={m}
                      competitionId={comp.id}
                      editable={isAdmin}
                    />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Generate playoffs */}
      {isAdmin &&
        comp.status === "active" &&
        playoffTeams > 0 &&
        playoffMatches.length === 0 &&
        regularDone && (
          <form action={generatePlayoffs} className="mb-8">
            <input type="hidden" name="competition_id" value={comp.id} />
            <Button>Generate playoffs (top {playoffTeams})</Button>
          </form>
        )}

      {/* Draft tools */}
      {isAdmin && comp.status === "draft" && (
        <div className="mb-8 flex max-w-md flex-col gap-4">
          <div>
            <h3 className="mb-1 text-sm font-medium">Swap two teams</h3>
            <SwapTool matches={regularMatches} competitionId={comp.id} />
          </div>

          <form action={updatePlayoffTeams} className="flex items-center gap-2">
            <input type="hidden" name="competition_id" value={comp.id} />
            <label className="text-sm">Playoff teams</label>
            <select
              name="playoff_teams"
              defaultValue={playoffTeams}
              className="rounded border border-border p-1 text-sm"
            >
              <option value={0}>No playoffs</option>
              {[2, 4, 8, 16].map((n) => (
                <option key={n} value={n}>
                  Top {n}
                </option>
              ))}
            </select>
            <Button variant="secondary" className="text-xs">
              Save
            </Button>
          </form>

          <form action={publishSchedule}>
            <input type="hidden" name="competition_id" value={comp.id} />
            <Button>Publish schedule</Button>
          </form>

          <form action={reopenCompetition}>
            <input type="hidden" name="competition_id" value={comp.id} />
            <Button variant="danger">Reopen signups (discard schedule)</Button>
          </form>
        </div>
      )}
    </div>
  );
}
