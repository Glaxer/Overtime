import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCompetition } from "@/lib/queries/competitions";
import { getMyTeams } from "@/lib/queries/teams";
import {
  signupTeam,
  setSignupStatus,
  withdrawSignup,
  updatePlayoffTeams,
  startCompetition,
  updateMatchTime,
  publishSchedule,
  reopenCompetition
} from "../actions";
import { getMatches } from "@/lib/queries/matches";
import Button from "@/components/ui/Button";
import SwapTool from "@/components/ui/SwapTool";
import Link from "next/link";
import { getStandings } from "@/lib/queries/standings";

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

  // Teams I captain, for this title, not yet signed up
  const myTeams = user ? await getMyTeams(user.id) : [];
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

  const matches = await getMatches(comp.id);
  const rounds = [...new Set(matches.map((m) => m.round))].sort(
    (a, b) => a - b
  );
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("da-DK", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Europe/Copenhagen"
        })
      : "TBD";

  const standings = comp.type === "league" ? await getStandings(comp.id) : [];

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-gray-500">
        {comp.title.name} · {comp.type} · {comp.status}
      </p>
      <h1 className="mb-6 text-2xl font-bold">{comp.name}</h1>

      <h2 className="mb-2 font-semibold">Teams</h2>
      <ul className="mb-8 flex flex-col gap-1">
        {accepted.map((s) => (
          <li key={s.team.id} className="text-sm">
            {s.team.name}
          </li>
        ))}
        {accepted.length === 0 && (
          <li className="text-sm text-gray-500">No teams yet</li>
        )}
      </ul>

      {comp.status === "open" && eligibleTeams.length > 0 && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Sign up a team</h2>
          <form action={signupTeam} className="flex gap-2">
            <input type="hidden" name="competition_id" value={comp.id} />
            <select
              name="team_id"
              required
              className="flex-1 rounded border p-2 text-sm"
            >
              {eligibleTeams.map((m) => (
                <option key={m.team.id} value={m.team.id}>
                  {m.team.name}
                </option>
              ))}
            </select>
            <button className="rounded bg-black px-3 text-sm text-white">
              Sign up
            </button>
          </form>
        </div>
      )}

      {isAdmin && pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Pending signups</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((s) => (
              <li
                key={s.team.id}
                className="flex items-center justify-between rounded border p-3"
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
                      <button
                        className={
                          status === "accepted"
                            ? "rounded bg-black px-3 py-1 text-sm text-white"
                            : "rounded border px-3 py-1 text-sm hover:bg-gray-100"
                        }
                      >
                        {status === "accepted" ? "Accept" : "Reject"}
                      </button>
                    </form>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {mySignups.length > 0 && (
        <div className="mb-8 max-w-sm">
          <h2 className="mb-2 font-semibold">Your signups</h2>
          <ul className="flex flex-col gap-2">
            {mySignups.map((s) => (
              <li
                key={s.team.id}
                className="flex items-center justify-between rounded border p-3"
              >
                <span className="text-sm">
                  {s.team.name}
                  <span className="ml-2 text-xs text-gray-500">
                    ({s.status})
                  </span>
                </span>
                <form action={withdrawSignup}>
                  <input type="hidden" name="competition_id" value={comp.id} />
                  <input type="hidden" name="team_id" value={s.team.id} />
                  <button className="rounded border px-3 py-1 text-sm hover:bg-gray-100">
                    Withdraw
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Start button (open → draft) */}
      {isAdmin && comp.status === "open" && accepted.length >= 2 && (
        <form action={startCompetition} className="mb-8">
          <input type="hidden" name="competition_id" value={comp.id} />
          <Button>Start competition — generate schedule</Button>
        </form>
      )}

      {/* Schedule */}
      {matches.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">
            Schedule{" "}
            {comp.status === "draft" && "(draft — only admins can see this)"}
          </h2>
          {rounds.map((r) => (
            <div key={r} className="mb-4">
              <h3 className="mb-1 text-sm font-medium text-gray-500">
                Round {r}
              </h3>
              <ul className="flex flex-col gap-1">
                {matches
                  .filter((m) => m.round === r)
                  .map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center justify-between rounded border p-3 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Link
                          href={`/matches/${m.id}`}
                          className="hover:underline"
                        >
                          {m.team_a.name} vs {m.team_b.name}
                        </Link>
                        {m.forfeited_by ? (
                          <span className="text-gray-500">
                            FF —{" "}
                            {m.forfeited_by === m.team_a.id
                              ? m.team_b.name
                              : m.team_a.name}{" "}
                            wins
                          </span>
                        ) : m.games.length > 0 ? (
                          <span className="text-gray-500">
                            {
                              m.games.filter((g) => g.score_a > g.score_b)
                                .length
                            }
                            –
                            {
                              m.games.filter((g) => g.score_b > g.score_a)
                                .length
                            }
                          </span>
                        ) : null}
                      </span>
                      {comp.status === "draft" && isAdmin ? (
                        <form
                          action={updateMatchTime}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="competition_id"
                            value={comp.id}
                          />
                          <input type="hidden" name="match_id" value={m.id} />
                          <input
                            type="datetime-local"
                            name="scheduled_at"
                            defaultValue={m.scheduled_at?.slice(0, 16) ?? ""}
                            className="rounded border p-1 text-xs"
                          />
                          <button className="rounded border px-2 py-1 text-xs hover:bg-gray-100">
                            Save
                          </button>
                        </form>
                      ) : (
                        <span className="text-gray-500">
                          {fmt(m.scheduled_at)}
                        </span>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Draft tools: swap + playoff size + publish */}
      {isAdmin && comp.status === "draft" && (
        <div className="mb-8 flex flex-col gap-4 max-w-md">
          <div>
            <h3 className="mb-1 text-sm font-medium">Swap two teams</h3>
            <SwapTool matches={matches} competitionId={comp.id} />
          </div>

          <form action={updatePlayoffTeams} className="flex items-center gap-2">
            <input type="hidden" name="competition_id" value={comp.id} />
            <label className="text-sm">Playoff teams</label>
            <input
              type="number"
              name="playoff_teams"
              min={0}
              defaultValue={
                (comp.settings as { playoff_teams?: number })?.playoff_teams ??
                0
              }
              className="w-20 rounded border p-1 text-sm"
            />
            <button className="rounded border px-2 py-1 text-xs hover:bg-gray-100">
              Save
            </button>
          </form>

          <form action={reopenCompetition}>
            <input type="hidden" name="competition_id" value={comp.id} />
            <button className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
              Reopen signups (discard schedule)
            </button>
          </form>
          <form action={publishSchedule}>
            <input type="hidden" name="competition_id" value={comp.id} />
            <button className="rounded bg-black px-4 py-2 text-sm text-white">
              Publish schedule
            </button>
          </form>
        </div>
      )}
      {standings.length > 0 && comp.status !== "open" && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Standings</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
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
                <tr key={row.teamId} className="border-t border-gray-700">
                  <td className="py-1 pr-2 text-gray-500">{i + 1}</td>
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
                  <td className="py-1 pr-2 text-right text-gray-500">
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
    </div>
  );
}
