import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMatch } from "@/lib/queries/matches";
import { getMyTeams } from "@/lib/queries/teams";
import {
  submitResult,
  verifySubmission,
  rejectSubmission,
  forfeitMatch
} from "../actions";
import Button from "@/components/ui/Button";

export default async function MatchPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatch(id);
  if (!match) notFound();

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  // Am I an admin of this competition?
  const { data: adminRow } = user
    ? await supabase
        .from("comp_admins")
        .select("user_id")
        .eq("competition_id", match.competition_id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };
  const isAdmin = !!adminRow;

  // Am I a captain of one of the two teams?
  const myTeams = user ? await getMyTeams(user.id) : [];
  const myCaptainTeam = myTeams.find(
    (m) =>
      m.role === "captain" &&
      (m.team.id === match.team_a.id || m.team.id === match.team_b.id)
  )?.team;

  const isParticipantCaptain = !!myCaptainTeam;

  const games = [...match.games].sort((a, b) => a.game_number - b.game_number);
  const seriesA = games.filter((g) => g.score_a > g.score_b).length;
  const seriesB = games.filter((g) => g.score_b > g.score_a).length;

  const pending = match.submissions.filter((s) => s.status === "pending");
  const hasResult = games.length > 0 || !!match.forfeited_by;

  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("da-DK", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Europe/Copenhagen"
        })
      : "TBD";

  return (
    <div className="max-w-2xl">
      <Link
        href={`/competitions/${match.competition_id}`}
        className="text-sm text-gray-500 hover:underline"
      >
        ← {match.competition.name}
      </Link>

      <p className="mt-2 text-sm text-gray-500">
        Round {match.round} · Best of {match.best_of} ·{" "}
        {fmt(match.scheduled_at)}
      </p>

      <h1 className="mb-6 text-2xl font-bold">
        {match.team_a.name} vs {match.team_b.name}
      </h1>

      {/* Result */}
      {match.forfeited_by ? (
        <p className="mb-8 text-lg">
          Forfeit —{" "}
          {match.forfeited_by === match.team_a.id
            ? match.team_b.name
            : match.team_a.name}{" "}
          wins
        </p>
      ) : games.length > 0 ? (
        <div className="mb-8">
          <p className="text-3xl font-bold">
            {seriesA} – {seriesB}
          </p>
          <ul className="mt-2 flex flex-col gap-0.5 text-sm text-gray-500">
            {games.map((g) => (
              <li key={g.game_number}>
                Game {g.game_number}: {g.score_a} – {g.score_b}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mb-8 text-sm text-gray-500">Not played yet</p>
      )}

      {/* Submit result */}
      {!hasResult && pending.length === 0 && isParticipantCaptain && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Submit result</h2>
          <p className="mb-2 text-xs text-gray-500">
            Fill in only the games that were played. Left column ={" "}
            {match.team_a.name}.
          </p>
          <form action={submitResult} className="flex flex-col gap-2">
            <input type="hidden" name="match_id" value={match.id} />
            <input type="hidden" name="best_of" value={match.best_of} />
            {Array.from({ length: match.best_of }, (_, i) => i + 1).map((n) => (
              <div key={n} className="flex items-center gap-2 text-sm">
                <span className="w-16 text-gray-500">Game {n}</span>
                <input
                  type="number"
                  min={0}
                  name={`game_${n}_a`}
                  className="w-16 rounded border p-1"
                />
                <span>–</span>
                <input
                  type="number"
                  min={0}
                  name={`game_${n}_b`}
                  className="w-16 rounded border p-1"
                />
              </div>
            ))}
            <Button className="mt-2 self-start">Submit result</Button>
          </form>
          <form action={forfeitMatch} className="mt-4">
            <input type="hidden" name="match_id" value={match.id} />
            <Button variant="danger">Forfeit as {myCaptainTeam.name}</Button>
            <p className="mt-1 text-xs text-gray-500">
              {match.team_a.id === myCaptainTeam.id
                ? match.team_b.name
                : match.team_a.name}{" "}
              gets the win. This can&apos;t be undone.
            </p>
          </form>
        </div>
      )}

      {/* Pending submissions */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 font-semibold">Pending submissions</h2>
          <ul className="flex flex-col gap-2">
            {pending.map((s) => {
              const payloadGames = (
                s.payload as { games: { a: number; b: number }[] }
              ).games;
              return (
                <li key={s.id} className="rounded border p-3 text-sm">
                  <p className="mb-1 text-gray-500">
                    by {s.submitter.display_name} · {fmt(s.created_at)}
                  </p>
                  <p className="mb-2">
                    {payloadGames.map((g) => `${g.a}–${g.b}`).join(", ")}
                  </p>
                  {isAdmin && (
                    <span className="flex gap-2">
                      <form action={verifySubmission}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input
                          type="hidden"
                          name="submission_id"
                          value={s.id}
                        />
                        <Button>Verify</Button>
                      </form>
                      <form action={rejectSubmission}>
                        <input type="hidden" name="match_id" value={match.id} />
                        <input
                          type="hidden"
                          name="submission_id"
                          value={s.id}
                        />
                        <Button variant="secondary">Reject</Button>
                      </form>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
